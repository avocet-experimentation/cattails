import {
  DocumentUpdateFailedError,
  Experiment,
  ExperimentDraft,
  ExperimentReference,
  experimentSchema,
} from '@avocet/core';
import MongoRepository from './MongoRepository.js';
import { IRepositoryManager, PartialWithStringId } from './repository-types.js';

export default class ExperimentRepository extends MongoRepository<Experiment> {
  constructor(repositoryManager: IRepositoryManager) {
    super('experiment', experimentSchema, repositoryManager);
  }

  async start(experimentId: string) {
    const experimentDoc = await this.get(experimentId);
    const linkedFlags = await this.manager.featureFlag.findMany(
      this.getIdMatcher(experimentDoc.flagIds),
    );

    const isReady = ExperimentDraft.isReadyToStart(experimentDoc, linkedFlags);
    if (!isReady) {
      throw new Error(
        `Experiment "${experimentDoc.name}" is not ready to start`,
      );
    }

    return this.update({
      id: experimentId,
      status: 'active',
      startTimestamp: Date.now(),
    });
  }

  /**
   * WIP
   */
  async pause(experimentId: string) {
    return this.update({
      id: experimentId,
      status: 'paused',
    });
  }

  /**
   * WIP
   */
  async complete(experimentId: string) {
    return this.update({
      id: experimentId,
      status: 'completed',
      endTimestamp: Date.now(),
    });
  }

  /** WIP
   * Store an ExperimentReference on any flags referenced in an experiment
   * todo: maybe return the result and let errors bubble to indicate failure
   */
  async createEmbeds(newExperiment: Experiment): Promise<boolean> {
    try {
      const experimentReference = new ExperimentReference(newExperiment);

      const embedResult = await this.manager.featureFlag.push(
        'overrideRules',
        experimentReference,
        this.getIdMatcher(newExperiment.flagIds),
      );

      if (!embedResult) {
        throw new DocumentUpdateFailedError(
          `Failed to add ExperimentReference on flags ${newExperiment.flagIds}!`,
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
   *
   * todo: preserve position in override rules array
   */
  async updateEmbeds(
    partialExperiment: PartialWithStringId<Experiment>,
  ): Promise<boolean> {
    try {
      const { featureFlag } = this.manager;
      const updatedExpDoc = await this.get(partialExperiment.id);
      const embedMatcher = { id: partialExperiment.id };

      const flagFilter = this.getIdMatcher(updatedExpDoc.flagIds);

      const pullResult = await featureFlag.pull(
        'overrideRules',
        embedMatcher,
        flagFilter,
      );
      if (!pullResult.acknowledged) {
        throw new DocumentUpdateFailedError(
          'Failed to remove previous ExperimentReference embeds',
        );
      }

      const updatedEmbed = new ExperimentReference({
        ...updatedExpDoc,
        ...partialExperiment,
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
  async deleteEmbeds(experimentId: string): Promise<boolean> {
    try {
      const embedFilter = {
        id: { $eq: experimentId },
      };

      const embedDeleteResult = await this.manager.featureFlag.pull(
        'overrideRules',
        embedFilter,
      );

      return embedDeleteResult.acknowledged;
    } catch (e: unknown) {
      return false;
    }
  }

  /**
   * (WIP) Get an array of documents containing embeds matching the passed ID
   */
  async getDocumentsWithEmbeds(experimentId: string) {
    const flagsWithEmbed = await this.manager.featureFlag.findMany({
      overrideRules: { $elemMatch: { id: experimentId } },
    });

    return flagsWithEmbed;
  }
}
