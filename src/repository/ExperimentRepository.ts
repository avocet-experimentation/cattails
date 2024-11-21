import {
  Experiment,
  ExperimentReference,
  experimentSchema,
} from "@estuary/types";
import MongoRepository from "./MongoRepository.js";
import { PartialWithStringId } from './MongoRepository.js';
import RepositoryManager from "./RepositoryManager.js";

export default class ExperimentRepository extends MongoRepository<Experiment> {
  constructor(repositoryManager: RepositoryManager) {
    super('Experiment', experimentSchema, repositoryManager);
  }

  /** WIP
   * Store an ExperimentReference on any flags referenced in an experiment
   */
  async _createEmbeds(
    newExperiment: Experiment
  ): Promise<boolean> {
    try {
    // const result = await this.create(experimentDraft);
    // if (!result === null) return null;
    const flagColl = this._getCollection('FeatureFlag');
    const experimentReference = new ExperimentReference(newExperiment);

    const flags = await Promise.all(newExperiment.flagIds.map(this.get));

    for (let i = 0; i < newExperiment.flagIds.length; i += 1) {
      const flagId = newExperiment.flagIds[i];
      // if the environment property doesn't exist, it needs to be imputed
      // else push the new rule to environments.${newExperiment.environmentName}.overrideRules
      // flagColl.updateOne({ _id: flagId },)
    }

    // push the ExperimentReference to environments.${experimentDraft.environmentName}.overrideRules for each flag
    } catch (e: unknown) {
      return false;
    }

    return true;
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
   */
  async _deleteEmbeds(
    partialExperiment: PartialWithStringId<Experiment>
  ): Promise<boolean> {
    try {
      const result = await this.update(partialExperiment);
      // if (!result) return null;
  
      const updatedExperiment = await this.get(partialExperiment.id);
      // if (updatedExperiment === null) return null;
  
      
      const updatedReference = new ExperimentReference(updatedExperiment);
  
      // delete the ExperimentReference in environments.${experimentDraft.environmentName}.overrideRules for each flag

    } catch (e: unknown) {
      return false;
    }

    return true;
  }
}
