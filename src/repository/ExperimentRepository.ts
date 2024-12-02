import {
  DocumentUpdateFailedError,
  Experiment,
  ExperimentReference,
  experimentSchema,
} from "@estuary/types";
import MongoRepository from "./MongoRepository.js";
import { PartialWithStringId } from './MongoRepository.js';
import RepositoryManager from "./RepositoryManager.js";
import { ObjectId } from "mongodb";

export default class ExperimentRepository extends MongoRepository<Experiment> {
  constructor(repositoryManager: RepositoryManager) {
    super('experiment', experimentSchema, repositoryManager);
  }

  async startExperiment(experimentId: string) {
    const updates = {
      id: experimentId,
      status: 'active' as const,
      startTimestamp: Date.now(),
    };
    
    const updateResult = await this.update(updates);
    if (!updateResult) {
      throw new DocumentUpdateFailedError(`Failed to start experiment ${experimentId}`);
    }

    const updatedDoc = await this.get(experimentId);
    return this._createEmbeds(updatedDoc);

  }

  async stopExperiment(experimentId: string) {
    const updates = {
      id: experimentId,
      status: 'completed' as const,
      endTimestamp: Date.now(),
    };
    
    const updateResult = await this.update(updates);
    if (!updateResult) {
      throw new DocumentUpdateFailedError(`Failed to stop experiment ${experimentId}`);
    }

    return this._deleteEmbeds(experimentId);
  }
  /** WIP
   * Store an ExperimentReference on any flags referenced in an experiment
   * todo: maybe return the result and let errors bubble to indicate failure
   */
  async _createEmbeds(
    newExperiment: Experiment
  ): Promise<boolean> {
    try {
      const experimentReference = new ExperimentReference(newExperiment);

      const flagMatcher = {
        _id: { $in: newExperiment.flagIds.map((id) => ObjectId.createFromHexString(id)) }
      };

      const embedResult = await this.manager.featureFlag
        .push('overrideRules', experimentReference, flagMatcher);

      if (!embedResult) {
        throw new DocumentUpdateFailedError(
          `Failed to add ExperimentReference on flags ${newExperiment.flagIds}!`
        );
      }

      return embedResult.acknowledged;
    } catch (e: unknown) {
      if (e instanceof Error) {
        throw e;
      }

      return false;
    }
  }

  /** WIP
   * Updates all ExperimentReferences on any flags referenced by an experiment
   */
  async _updateEmbeds(
    partialExperiment: PartialWithStringId<Experiment>
  ): Promise<boolean> {
    try {
      const { featureFlag } = this.manager;
      const updatedExpDoc = await this.get(partialExperiment.id);
      const embedMatcher = { id: partialExperiment.id };

      const flagFilter = {
        _id: { $in: updatedExpDoc.flagIds.map((id) => ObjectId.createFromHexString(id)) },
      };

      const pullResult = await featureFlag.pull('overrideRules', embedMatcher, flagFilter);
      if (!pullResult.acknowledged) {
        throw new DocumentUpdateFailedError(
          'Failed to remove previous ExperimentReference embeds');
      }

      const updatedEmbed = new ExperimentReference({
        ...updatedExpDoc,
        ...partialExperiment
      });

      const embedUpdateResult = await featureFlag.push(
        'overrideRules', 
        updatedEmbed,
        flagFilter,
      );

      return embedUpdateResult.acknowledged;
    } catch (e: unknown) {
      return false;
    }
  }

  /** WIP
   * Deletes all ExperimentReferences on any flags referenced by an experiment
   */
  async _deleteEmbeds(experimentId: string): Promise<boolean> {
    try {
      const embedFilter = {
        id: { $eq: experimentId },
      }

      const embedDeleteResult = await this.manager.featureFlag
      .pull('overrideRules', embedFilter);

      return embedDeleteResult.acknowledged;
    } catch (e: unknown) {
      return false;
    }
  }

  /**
   * (WIP) Get an array of documents containing embeds matching the passed ID
   */
  async _getDocumentsWithEmbeds(experimentId: string) {
    const flagsWithEmbed = await this.manager.featureFlag.findMany({
      overrideRules: { $elemMatch: { id: experimentId, }, },
    });

    return flagsWithEmbed;
  }
}
