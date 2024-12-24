import {
  ClientPropDef,
  SDKConnection,
  User,
  Environment,
  Experiment,
  ClientPropDefDraft,
  ExperimentDraft,
  SDKConnectionDraft,
  UserDraft,
  FeatureFlagDraft,
  FeatureFlag,
  BeforeId,
  stripKeysWithUndefined,
  EnvironmentDraft,
  RequireOnly,
} from '@avocet/core';
import { Filter } from 'mongodb';
import { IResolvers } from 'mercurius';
import RepositoryManager from '../repository/RepositoryManager.js';
import cfg from '../envalid.js';
import { PartialWithStringId } from '../repository/repository-types.js';

const repos = new RepositoryManager(cfg.MONGO_ADMIN_URI);

export const resolvers: IResolvers = {
  // #region Reader resolvers
  Query: {
    clientPropDef: async (_, { id }: { id: string }) => {
      const fetched = await repos.clientPropDef.get(id);
      return fetched;
    },
    allClientPropDefs: async (_, { limit }: { limit?: number }) =>
      repos.clientPropDef.getMany(limit),
    environment: async (_, { id }: { id: string }) => repos.environment.get(id),
    allEnvironments: async (
      _,
      { limit, offset }: { limit?: number; offset?: number },
    ) => repos.environment.getMany(limit, offset),
    findMatchingEnvironments: async (
      _,
      {
        partial,
        limit,
      }: { partial?: Filter<BeforeId<Environment>>; limit?: number },
    ) => {
      const query = partial ? stripKeysWithUndefined(partial) : {};
      return repos.environment.findMany(query, limit);
    },
    sdkConnection: async (_, { id }: { id: string }) =>
      repos.sdkConnection.get(id),
    allSDKConnections: async (_, { limit }: { limit?: number }) =>
      repos.sdkConnection.getMany(limit),
    user: async (_, { id }: { id: string }) => repos.user.get(id),
    allUsers: async (_, { limit }: { limit?: number }) =>
      repos.user.getMany(limit),
    experiment: async (_, { id }: { id: string }) => repos.experiment.get(id),
    allExperiments: async (_, { limit }: { limit?: number }) =>
      repos.experiment.getMany(limit),
    // FeatureFlag: async (_, { id }: { id: string }) => repos.featureFlag.get(id),
    // allFeatureFlags: async (_, { limit }: { limit?: number }) =>
    //   repos.featureFlag.getMany(limit),
  },
  // #endregion
  Mutation: {
    // #region clientpropdef mutation resolvers
    updateClientPropDef: async (
      _,
      {
        id,
        name,
        description,
        dataType,
        isIdentifier,
      }: {
        id: string;
        name?: string;
        description?: string;
        dataType?: 'string' | 'number' | 'boolean';
        isIdentifier?: boolean;
      },
    ) => {
      // make fields optional?
      const updates: Partial<ClientPropDef> = {};

      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (dataType !== undefined) updates.dataType = dataType;
      if (isIdentifier !== undefined) updates.isIdentifier = isIdentifier;

      // call to update teh record
      const success = await repos.clientPropDef.update({ id, ...updates });
      if (!success) {
        throw new Error('Failed to update ClientPropDef');
      }

      // Return the updated data, meaning it worked
      return repos.clientPropDef.get(id);
      // return success;
    },
    createClientPropDef: async (
      _,
      input: RequireOnly<ClientPropDefDraft, 'name' | 'dataType'>,
    ): Promise<string | null> => {
      const newEntry = ClientPropDefDraft.template(input);

      const newId = await repos.clientPropDef.create(newEntry);
      if (!newId) {
        // if id is undefined throw error
        throw new Error('Failed to create ClientPropDef');
      }

      return newId; // return id of created ?? tried whole object, ahd type issues
    },
    deleteClientPropDef: async (_, { id }: { id: string }): Promise<string> => {
      const success = await repos.clientPropDef.delete(id);

      if (!success) {
        throw new Error('Failed to delete SDKConnection');
      }

      return id;
    },
    // #endregion

    // #region clientconnection resolvers
    updateSDKConnection: async (
      _,
      {
        id,
        name,
        description,
        environmentId,
      }: {
        id: string;
        name?: string;
        description?: string;
        environmentId?: string;
      },
    ): Promise<SDKConnection> => {
      const updates: Partial<SDKConnection> = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (environmentId !== undefined) updates.environmentId = environmentId;

      const partialEntry = { id, ...updates };

      const success = await repos.sdkConnection.update(partialEntry);
      if (!success) {
        throw new Error('Failed to update SDKConnection');
      }

      const updatedRecord = await repos.sdkConnection.get(id);

      if (!updatedRecord) {
        throw new Error('SDKConnection not found after update');
      }

      return updatedRecord;
    },

    createSDKConnection: async (
      _,
      input: SDKConnectionDraft,
    ): Promise<string> => {
      const newId = await repos.sdkConnection.create(input);

      if (!newId) {
        throw new Error('Failed to create SDKConnection');
      }

      return newId;
    },

    deleteSDKConnection: async (_, { id }: { id: string }): Promise<string> => {
      const success = await repos.sdkConnection.delete(id);

      if (!success) {
        throw new Error('Failed to delete SDKConnection');
      }

      return id;
    },
    // #endregion

    // #region user resolvers
    createUser: async (
      _,
      input: RequireOnly<UserDraft, 'identifier'>,
    ): Promise<User | null> => {
      const newEntry = UserDraft.templateAdmin(input);

      const userId = await repos.user.create(newEntry);

      if (!userId) {
        throw new Error('Failed to create User');
      }

      return repos.user.get(userId); // Fetch and return the created user
    },

    updateUser: async (
      _,
      input: PartialWithStringId<User>,
    ): Promise<boolean> => {
      const success = await repos.user.update(input);

      if (!success) {
        throw new Error('Failed to update User');
      }

      // Fetch and return the updated user
      if (!success) {
        throw new Error('Updated User not found');
      }

      return true;
    },

    deleteUser: async (_, { id }: { id: string }): Promise<string> => {
      const success = await repos.user.delete(id);

      if (!success) {
        throw new Error('Failed to delete User');
      }

      return id;
    },
    // #endregion

    // #region environment resolvers
    createEnvironment: async (
      _,
      { newEntry }: { newEntry: EnvironmentDraft },
    ): Promise<Environment> => {
      const newId = await repos.environment.create(newEntry);
      return repos.environment.get(newId);
    },

    updateEnvironment: async (
      _,
      {
        partialEntry,
      }: {
        partialEntry: PartialWithStringId<Environment>;
        mergeProps?: boolean;
      },
    ): Promise<Environment> => {
      await repos.environment.update(partialEntry, false);
      return repos.environment.get(partialEntry.id);
    },

    deleteEnvironment: async (_, { id }: { id: string }): Promise<boolean> =>
      repos.environment.delete(id),
    // #endregion

    // #region experiment resolvers
    createExperiment: async (
      _,
      input: RequireOnly<ExperimentDraft, 'name' | 'environmentName'>,
    ): Promise<boolean> => {
      const newExperiment = ExperimentDraft.template(input);

      const newId = await repos.experiment.create(newExperiment);

      if (!newId) {
        throw new Error('Failed to create experiment');
      }

      return true;
    },

    updateExperiment: async (
      _,
      input: PartialWithStringId<Experiment>,
    ): Promise<boolean> => {
      const success = await repos.experiment.update(input);

      if (!success) {
        throw new Error('Failed to update the experiment');
      }
      return true;
    },

    deleteExperiment: async (_, { id }: { id: string }): Promise<boolean> => {
      const success = await repos.experiment.delete(id);

      if (!success) {
        throw new Error('Failed to delete experiment');
      }

      return true;
    },
    // #endregion

    // #region feature flag resolvers
    // createFeatureFlag: async (
    //   _,
    //   draft: FeatureFlagDraft,
    // ): Promise<FeatureFlag> => {
    //   const flagId = await repos.featureFlag.create(draft);
    //   return repos.featureFlag.get(flagId);
    // },

    // updateFeatureFlag: async (
    //   _,
    //   input: PartialWithStringId<FeatureFlag>,
    // ): Promise<boolean> => {
    //   const success = await repos.featureFlag.update(input);

    //   if (!success) {
    //     throw new Error('Failed to update FeatureFlag');
    //   }

    //   return true;
    // },

    // deleteFeatureFlag: async (_, { id }: { id: string }): Promise<boolean> => {
    //   const success = await repos.featureFlag.delete(id);

    //   if (!success) {
    //     throw new Error(`Failed to delete FeatureFlag with ID: ${id}`);
    //   }

    //   return true;
    // },
    // #endregion
  },
};
