import { ClientPropDef, ClientConnection, User, Environment, Experiment, ClientPropDefDraft, ExperimentDraft, ClientConnectionDraft, UserDraft, FeatureFlagDraft, FeatureFlag } from "@estuary/types";
import RepositoryManager from '../repository/RepositoryManager.js';
import cfg from '../envalid.js';
import { RequireOnly } from "@estuary/types";
import { PartialWithStringId } from "../repository/MongoRepository.js";

const repos = new RepositoryManager(cfg.MONGO_ADMIN_URI);

export const resolvers = {
  // #region Reader resolvers
  Query: {
    clientPropDef: async (_: any, { id }: { id: string }) => {
      const fetched = await repos.clientPropDef.get(id);
      return fetched;
    },
    allClientPropDefs: async (_: any, { limit }: { limit?: number;}) => {
      return await repos.clientPropDef.getMany(limit);
    },
    environment: async (_: any, { id }: { id: string }) => {
      return await repos.environment.get(id);
    },
    allEnvironments: async (_: any, { limit }: { limit?: number;}) => {
      return await repos.environment.getMany(limit);
    },
    findAllEnvironments: async (_: any, { environmentName, defaultEnabled }: { environmentName?: string, defaultEnabled?: boolean }, limit?: number) => {
      const query = {
        ...(environmentName && { name: environmentName }),
        defaultEnabled: defaultEnabled ?? false,
      };
      return repos.environment.findMany(query, limit);
    },
    clientConnection: async (_: any, { id }: { id: string }) => {
      return await repos.clientConnection.get(id);
    },
    allClientConnections: async (_: any, { limit }: { limit?: number;}) => {
      return await repos.clientConnection.getMany(limit);
    },
    user: async (_: any, { id }: { id: string }) => {
      return await repos.user.get(id);
    },
    allUsers: async (_: any, { limit }: { limit?: number;}) => {
      return await repos.user.getMany(limit);
    },
    experiment: async(_: any, { id }: { id: string }) => {
      return await repos.experiment.get(id);
    },
    allExperiments: async (_: any, { limit }: { limit?: number;}) => {
      return await repos.experiment.getMany(limit);
    },
    FeatureFlag: async (_: any, { id }: {id : string;}) => {
      return await repos.featureFlag.get(id);
    },
    allFeatureFlags: async (_: any, { limit }: {limit? : number;}) => {
      return await repos.featureFlag.getMany(limit);
    }
  },
  Mutation: {
    // #endregion
    // #region clientpropdef mutation resolvers
    updateClientPropDef: async (
      _: any,
      { id, name, description, dataType, isIdentifier }: { 
        id: string, 
        name?: string, 
        description?: string, 
        dataType?: "string" | "number" | "boolean", 
        isIdentifier?: boolean 
      }
    ) => {
      //make fields optional?
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
      return await repos.clientPropDef.get(id);
      // return success;
    },
    createClientPropDef: async (
      _: any,
      input: RequireOnly<ClientPropDefDraft, "name" | "dataType">
    ): Promise<string | null> => {

      const newEntry = ClientPropDefDraft.template(input);

    
      const newId = await repos.clientPropDef.create(newEntry);
      if (!newId) { //if id is undefined throw error
        throw new Error('Failed to create ClientPropDef');
      }
    
      return newId; //return id of created ?? tried whole object, ahd type issues
    },
    deleteClientPropDef: async (
      _: any,
      { id }: { id: string }
    ): Promise<string> => {
      const success = await repos.clientPropDef.delete(id);

      if (!success) {
        throw new Error('Failed to delete ClientConnection');
      }

      return id;
    },
    // #endregion
    // #region clientconnection resolvers
    updateClientConnection: async (
      _: any,
      { id, name, description, environmentId }: { id: string; name?: string; description?: string; environmentId?: string }
    ): Promise<ClientConnection> => {
      const updates: Partial<ClientConnection> = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (environmentId !== undefined) updates.environmentId = environmentId;
      updates.updatedAt = Date.now();
    
      const partialEntry = { id, ...updates };
    
      const success = await repos.clientConnection.update(partialEntry);
      if (!success) {
        throw new Error('Failed to update ClientConnection');
      }
    
      const updatedRecord = await repos.clientConnection.get(id);
    
      if (!updatedRecord) {
        throw new Error('ClientConnection not found after update');
      }
    
      return updatedRecord;
    },
    

    createClientConnection: async (
      _: any,
      input: RequireOnly<ClientConnectionDraft, "name" | "environmentId">
    ): Promise<string> => {
      const newEntry = {
        description: "",
        ...input
      };

      const newId = await repos.clientConnection.create(newEntry);

      if (!newId) {
        throw new Error('Failed to create ClientConnection');
      }

      return newId;
    },

    deleteClientConnection: async (
      _: any,
      { id }: { id: string }
    ): Promise<string> => {
      const success = await repos.clientConnection.delete(id);
    
      if (!success) {
        throw new Error('Failed to delete ClientConnection');
      }

      return id;
    },
    // #endregion
    // #region user resolvers
    createUser: async (
      _: any,
     input: RequireOnly<UserDraft, "email">
    ): Promise<User | null> => {
      const newEntry = UserDraft.templateAdmin(input);
    
      const userId = await repos.user.create(newEntry);
    
      if (!userId) {
        throw new Error('Failed to create User');
      }
    
      return await repos.user.get(userId); // Fetch and return the created user
    },
    
    updateUser: async (
      _: any,
      input: PartialWithStringId<User>
    ): Promise<Boolean> => {

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
    
    
    deleteUser: async (_: any, { id }: { id: string }): Promise<string> => {
      const success = await repos.user.delete(id);
    
      if (!success) {
        throw new Error('Failed to delete User');
      }
    
      return id;
    },
    // #endregion
    // #region environment resolvers
    createEnvironment: async (
      _: any,
      { name, defaultEnabled }: { name: "prod" | "dev" | "testing" | "staging"; defaultEnabled: boolean }
    ): Promise<Environment | null> => {
      const newEnvironment = {
        name,
        defaultEnabled,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const newId = await repos.environment.create(newEnvironment);

      if (!newId) {
        throw new Error('Failed to create environment');
      }

      return await repos.environment.get(newId);
    },

    updateEnvironment: async (
      _: any,
      { id, name, defaultEnabled }: { id: string; name?: "prod" | "dev" | "testing" | "staging"; defaultEnabled?: boolean }
    ): Promise<Environment | null> => {
      const updates: Partial<Environment> = {};

      if (name !== undefined) updates.name = name;
      if (defaultEnabled !== undefined) updates.defaultEnabled = defaultEnabled;
      updates.updatedAt = Date.now();

      const partialEntry = { id, ...updates };

      const success = await repos.environment.update(partialEntry);

      if (!success) {
        throw new Error('Failed to update environment');
      }

      return await repos.environment.get(id);
    },

    deleteEnvironment: async (
      _: any,
      { id }: { id: string }
    ): Promise<boolean> => {
      const success = await repos.environment.delete(id);

      if (!success) {
        throw new Error('Failed to delete environment');
      }

      return true;
    },
    // #endregion
    // #region experiment resolvers
    createExperiment: async (
      _: any,
       input: RequireOnly<ExperimentDraft, "name" | "environmentName"> 
    ): Promise<Boolean> => {
      const newExperiment = ExperimentDraft.template(input);

      const newId = await repos.experiment.create(newExperiment);
      console.log("Experiment created with ID:", newId);

      if (!newId) {
        throw new Error('Failed to create experiment');
      }

      return true;
    },

    updateExperiment: async (
      _: any,
      input: PartialWithStringId<Experiment>
    ): Promise<Boolean> => {
      
      const success = await repos.experiment.update(input);

      if (!success) { 
        throw new Error('Failed to update the experiment');
      }
      return true;
    },

    deleteExperiment: async (
      _: any,
      { id }: { id: string }
    ): Promise<boolean> => {
      const success = await repos.experiment.delete(id);

      if (!success) {
        throw new Error('Failed to delete experiment');
      }

      return true;
    },
    // #endregion
    // #region feature flag resolvers
    createFeatureFlag: async (
      _: any,
      input: RequireOnly<FeatureFlagDraft<"string" | "number" | "boolean">, | "name" | "value">
    ): Promise<FeatureFlagDraft | null> => {
      
      const newFeatureFlag = FeatureFlagDraft.template(input);
    
      const flagId = await repos.featureFlag.create(newFeatureFlag);
    
      if (!flagId) {
        throw new Error('Failed to create FeatureFlag');
      }
    
      return await repos.featureFlag.get(flagId);
    },
    

    updateFeatureFlag: async (
      _: any,
      input: PartialWithStringId<FeatureFlag>
    ): Promise<Boolean> => {

      const success = await repos.featureFlag.update(input);

      if (!success) {
        throw new Error(`Failed to update FeatureFlag`);
      }

      return true;
    },

    deleteFeatureFlag: async (
      _: any,
      { id }: { id: string }
    ): Promise<string> => {
      const success = await repos.featureFlag.delete(id);

      if (!success) {
        throw new Error(`Failed to delete FeatureFlag with ID: ${id}`);
      }

      return `FeatureFlag with ID ${id} deleted successfully.`;
    },
  
  }
  // #endregion
};
