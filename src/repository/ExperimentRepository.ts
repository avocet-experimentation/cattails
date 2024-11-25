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
    super('experiment', experimentSchema, repositoryManager);
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
    return this._createEmbeds(updatedDoc);

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
    // const updatedDoc = await this.get(experimentId);
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
      // const id = newExperiment.flagIds[0]
      // const flagMatcher = {
      //   _id: typeof id === 'string' ? ObjectId.createFromHexString(newExperiment.flagIds[0]) : id,
      // };
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
      // const flagsWithEmbed = await this._getDocumentsWithEmbeds(partialExperiment.id);
      // if (flagsWithEmbed.length === 0) return true;
      // const existingEmbed = flagsWithEmbed[0].overrideRules
      //   .find((rule) => rule.id === partialExperiment.id);

      // if (!existingEmbed  || existingEmbed.type !== 'ExperimentReference') {
      //   throw new Error(
      //     `Failed to find an ExperimentReference matching id ${partialExperiment.id} ` +
      //     `on flags that should contain it. This error shouldn't occur`);
      // }

      const embedMatcher = { id: partialExperiment.id };

      const flagFilter = {
        _id: { $in: updatedExpDoc.flagIds.map((id) => ObjectId.createFromHexString(id)) },
        // 'overrideRules.$': 
      };
      const matchingFlags = await featureFlag.findMany(flagFilter);
      // printDetail({updatedExpDoc})
      // printDetail({matchingFlags})
      // const updateFilter = {
      //   $set: { 'overrideRules.$': }
      // }
      // const updateResult = await featureFlag.collection.updateMany(flagFilter, );
      const pullResult = await featureFlag.pull('overrideRules', embedMatcher, flagFilter);
      if (!pullResult) {
        throw new DocumentUpdateFailedError(
          'Failed to remove previous ExperimentReference embeds');
      }
      // .findMany({
      //   _id: { $in: flagIds.map(ObjectId.createFromHexString) }
      // });
      // const flagsWithEmbed = currentFlags.filter((flag) => {
      //   const allRules = FeatureFlagDraft.getRules(flag);
      //   return !!allRules.find((rule) => rule.id === id);
      // });
      const updatedEmbed = new ExperimentReference({
        ...updatedExpDoc,
        ...partialExperiment
      });

      const embedAddResult = await featureFlag.push(
        'overrideRules', 
        updatedEmbed,
        flagFilter,
      );
      return embedAddResult.acknowledged;
      
      // const promises = flagsWithEmbed.map((flag) => this.manager.featureFlag
      //   .removeRuleFromId(id, flag.id));

      // const results = await Promise.all(promises);
      // return results.every((el) => el);
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
  async _deleteEmbeds(experimentId: string): Promise<boolean> {
    try {
      // const reference = new ExperimentReference(experiment);
      const embedFilter = {
        id: { $eq: experimentId },
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
      .pull('overrideRules', embedFilter);
      // if (!result) return null;
  
      // if (updatedExperiment === null) return null;
  
      
      // const updatedReference = new ExperimentReference(updatedExperiment);
  
      // delete the ExperimentReference in environments.${experimentDraft.environmentName}.overrideRules for each flag
      return updateResult.acknowledged;
    } catch (e: unknown) {
      return false;
    }
  }

  /**
   * (WIP) Get an array of documents containing embeds matching the passed ID
   * Placeholder implementation
   */
  async _getDocumentsWithEmbeds(experimentId: string) {
    // const allFlags = await this.manager.featureFlag.getMany();
    // const experimentDoc = await this.get(experimentId);
    // const flagsWithEmbed = allFlags
    //   .filter((flag) => experimentDoc.flagIds.includes(flag.id));
    const flagsWithEmbed = await this.manager.featureFlag.findMany({
      overrideRules: { $elemMatch: { id: experimentId } }
    });

    return flagsWithEmbed;
  }
}
