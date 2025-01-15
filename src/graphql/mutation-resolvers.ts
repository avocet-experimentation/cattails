import {
  FeatureFlagDraft,
  FeatureFlag,
  ExperimentDraft,
  Experiment,
  EnvironmentDraft,
  Environment,
  SDKConnectionDraft,
  SDKConnection,
  ClientPropDefDraft,
  ClientPropDef,
  UserDraft,
  User,
} from '@avocet/core';
import { IResolvers } from 'mercurius';
import { RepositoryManager, PartialWithStringId } from '@avocet/mongo-client';
import cfg from '../envalid.js';

const repos = new RepositoryManager(cfg.MONGO_ADMIN_URI);

export const mutationResolvers: IResolvers = {
  Mutation: {
    // #region FeatureFlag
    createFeatureFlag: async (
      _,
      { newEntry }: { newEntry: FeatureFlagDraft },
    ): Promise<FeatureFlag> => {
      const flagId = await repos.featureFlag.create(newEntry);
      return repos.featureFlag.get(flagId);
    },

    updateFeatureFlag: async (
      _,
      { partialEntry }: { partialEntry: PartialWithStringId<FeatureFlag> },
    ): Promise<FeatureFlag> => {
      const success = await repos.featureFlag.update(partialEntry);

      if (!success) {
        throw new Error('Failed to update FeatureFlag');
      }

      return repos.featureFlag.get(partialEntry.id);
    },

    deleteFeatureFlag: async (_, { id }: { id: string }): Promise<string> => {
      await repos.featureFlag.delete(id);
      return id;
    },
    // #endregion
    // #region Experiment
    createExperiment: async (
      _,
      { newEntry }: { newEntry: ExperimentDraft },
    ): Promise<Experiment> => {
      const id = await repos.experiment.create(newEntry);
      return repos.experiment.get(id);
    },

    updateExperiment: async (
      _,
      { partialEntry }: { partialEntry: PartialWithStringId<Experiment> },
    ): Promise<Experiment> => {
      const success = await repos.experiment.update(partialEntry);

      if (!success) {
        throw new Error('Failed to update the experiment');
      }

      return repos.experiment.get(partialEntry.id);
    },

    deleteExperiment: async (_, { id }: { id: string }): Promise<string> => {
      await repos.experiment.delete(id);
      return id;
    },

    startExperiment: async (_, { id }: { id: string }): Promise<boolean> =>
      repos.experiment.start(id),
    pauseExperiment: async (_, { id }: { id: string }): Promise<boolean> =>
      repos.experiment.pause(id),
    completeExperiment: async (_, { id }: { id: string }): Promise<boolean> =>
      repos.experiment.complete(id),
    // #endregion
    // #region Environment
    createEnvironment: async (
      _,
      { newEntry }: { newEntry: EnvironmentDraft },
    ): Promise<Environment> => {
      const id = await repos.environment.create(newEntry);
      return repos.environment.get(id);
    },

    updateEnvironment: async (
      _,
      {
        partialEntry,
      }: {
        partialEntry: PartialWithStringId<Environment>;
      },
    ): Promise<Environment> => {
      const success = await repos.environment.update(partialEntry);
      if (!success) {
        throw new Error(`Failed to update environment ${partialEntry.id}`);
      }

      return repos.environment.get(partialEntry.id);
    },

    deleteEnvironment: async (_, { id }: { id: string }): Promise<string> => {
      await repos.environment.delete(id);
      return id;
    },
    // #endregion
    // #region SDKConnection
    createSDKConnection: async (
      _,
      { newEntry }: { newEntry: SDKConnectionDraft },
    ): Promise<SDKConnection> => {
      const id = await repos.sdkConnection.create(newEntry);
      return repos.sdkConnection.get(id);
    },

    updateSDKConnection: async (
      _,
      {
        partialEntry,
      }: {
        partialEntry: PartialWithStringId<SDKConnection>;
      },
    ): Promise<SDKConnection> => {
      const success = await repos.sdkConnection.update(partialEntry);
      if (!success) {
        throw new Error(`Failed to update SDK connection ${partialEntry.id}`);
      }

      return repos.sdkConnection.get(partialEntry.id);
    },

    deleteSDKConnection: async (_, { id }: { id: string }): Promise<string> => {
      await repos.sdkConnection.delete(id);
      return id;
    },
    // #endregion
    // #region ClientPropDef
    createClientPropDef: async (
      _,
      { newEntry }: { newEntry: ClientPropDefDraft },
    ): Promise<ClientPropDef> => {
      const id = await repos.clientPropDef.create(newEntry);
      return repos.clientPropDef.get(id);
    },

    updateClientPropDef: async (
      _,
      { partialEntry }: { partialEntry: PartialWithStringId<ClientPropDef> },
    ): Promise<ClientPropDef> => {
      const success = await repos.clientPropDef.update(partialEntry);
      if (!success) {
        throw new Error(
          `Failed to update client property definition ${partialEntry.id}`,
        );
      }

      return repos.clientPropDef.get(partialEntry.id);
    },

    deleteClientPropDef: async (_, { id }: { id: string }): Promise<string> => {
      await repos.clientPropDef.delete(id);
      return id;
    },
    // #endregion
    // #region User
    createUser: async (
      _,
      { newEntry }: { newEntry: UserDraft },
    ): Promise<User> => {
      const id = await repos.user.create(newEntry);
      return repos.user.get(id);
    },

    updateUser: async (
      _,
      { partialEntry }: { partialEntry: PartialWithStringId<User> },
    ): Promise<User> => {
      const success = await repos.user.update(partialEntry);

      if (!success) {
        throw new Error(`Failed to update user ${partialEntry.id}`);
      }

      return repos.user.get(partialEntry.id);
    },

    deleteUser: async (_, { id }: { id: string }): Promise<string> => {
      await repos.user.delete(id);
      return id;
    },
    // #endregion
  },
};
