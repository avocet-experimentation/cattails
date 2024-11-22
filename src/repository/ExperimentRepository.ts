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
import { printDetail } from "../lib/index.js";

export default class ExperimentRepository extends MongoRepository<Experiment> {
  constructor(repositoryManager: RepositoryManager) {
    super('Experiment', experimentSchema, repositoryManager);
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

      const updateResult = await this.repository.featureFlag
        .addRule(experimentReference, flagMatcher);

      if (!updateResult) {
        throw new DocumentUpdateFailedError(
          `Failed to add ExperimentReference on flags ${newExperiment.flagIds}!`
        );
      }

      return updateResult;
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
      const result = await this.update(partialExperiment);
      // if (result === null) return null;

      const updatedExperiment = await this.get(partialExperiment.id);
      // if (updatedExperiment === null) return null;

      
      const updatedReference = new ExperimentReference(updatedExperiment);

      // overwrite the ExperimentReference in environments.${experimentDraft.environmentName}.overrideRules for each flag
    } catch (e: unknown) {
      return false;
    }

    return true;
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
      
      const updateResult = await this.repository.featureFlag
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
