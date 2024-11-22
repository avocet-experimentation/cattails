import {
  DocumentUpdateFailedError,
  Experiment,
  ExperimentReference,
  experimentSchema,
  FeatureFlagDraft,
} from "@estuary/types";
import MongoRepository from "./MongoRepository.js";
import { PartialWithStringId } from './MongoRepository.js';
import RepositoryManager from "./RepositoryManager.js";
import { ObjectId } from "mongodb";
import { printDetail } from "../lib/index.js";

export default class ExperimentRepository extends MongoRepository<Experiment> {
  constructor(repositoryManager: RepositoryManager) {
    super('Experiment', experimentSchema, repositoryManager);
  }

  async startExperiment(experimentId: string) {
    // set status to started, set startTimestamp, and create embeds
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
    this._createEmbeds(updatedDoc);

  }

  async stopExperiment(experimentId: string) {
    // set status to completed, set endTimestamp, and delete embeds
    const updates = {
      id: experimentId,
      status: 'completed' as const,
      endTimestamp: Date.now(),
    };
    
    const updateResult = await this.update(updates);
    if (!updateResult) {
      throw new DocumentUpdateFailedError(`Failed to stop experiment ${experimentId}`);
    }
    const updatedDoc = await this.get(experimentId);
    this._deleteEmbeds(updatedDoc);
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
      // const id = newExperiment.flagIds[0]
      // const flagMatcher = {
      //   _id: typeof id === 'string' ? ObjectId.createFromHexString(newExperiment.flagIds[0]) : id,
      // };
      const flagMatcher = {
        _id: { $in: newExperiment.flagIds.map((id) => ObjectId.createFromHexString(id)) }
      };

      const embedResult = await this.manager.featureFlag
        .addRule(experimentReference, flagMatcher);

      if (!embedResult) {
        throw new DocumentUpdateFailedError(
          `Failed to add ExperimentReference on flags ${newExperiment.flagIds}!`
        );
      }

      return embedResult;
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
    // partialExperiment: PartialWithStringId<Experiment>
  ): Promise<boolean> {
    try {
      const { id } = partialExperiment;
      const currentFlags = await this.manager.featureFlag.getMany();
      const flagsWithEmbed = currentFlags.filter((flag) => {
        const allRules = FeatureFlagDraft.getRules(flag);
        return !!allRules.find((rule) => rule.id === id);
      });

      const promises = flagsWithEmbed.map((flag) => this.manager.featureFlag
        .removeRuleFromId(id, flag.id));

      const results = await Promise.all(promises);
      return results.every((el) => el);
    } catch (e: unknown) {
      return false;
    }
  }

  /** WIP
   * Deletes all ExperimentReferences on any flags referenced by an experiment
   * 
   * given an experimentId:
   * - all override rules with the same id
   */
  async _deleteEmbeds(experiment: Experiment): Promise<boolean> {
    try {
      const reference = new ExperimentReference(experiment);
      const embedFilter = {
        id: experiment.id,
        environmentName: experiment.environmentName,
      }
      // create filter for flags that contain a rule with the experiment id
      // const flagFilter = {
      //   [`environments.*.overrideRules`]: {
      //     $elemMatch: {
      //       id: experimentId,
      //     }
      //   } 
      // };
      // update all flags matching filter
      
      const updateResult = await this.manager.featureFlag
      .removeRule(embedFilter);
      // if (!result) return null;
  
      // if (updatedExperiment === null) return null;
  
      
      // const updatedReference = new ExperimentReference(updatedExperiment);
  
      // delete the ExperimentReference in environments.${experimentDraft.environmentName}.overrideRules for each flag
      return updateResult;
    } catch (e: unknown) {
      return false;
    }
  }
}
