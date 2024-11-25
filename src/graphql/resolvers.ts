import { ClientPropDef, ClientConnection, User, Environment, Experiment } from "@estuary/types";
import RepositoryManager from '../repository/RepositoryManager.js';
import cfg from '../envalid.js';

const repos = new RepositoryManager(cfg.MONGO_TESTING_URI);

export const resolvers = {
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
      { name, description, dataType, isIdentifier }: { 
        name: string; 
        description?: string;
        dataType: "string" | "number" | "boolean",
        isIdentifier?: boolean 
      }
    ): Promise<string | null> => {

      const newEntry = {
        name,
        description,
        dataType,
        isIdentifier: isIdentifier ?? false,  // default to false if not provided
      };
    
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

    updateClientConnection: async (
      _: any,
      { id, name, description, environmentId }: { id: string; name?: string; description?: string; environmentId?: string }
    ): Promise<ClientConnectionDraft> => {
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
      { name, description, environmentId }: { name: string; description?: string; environmentId: string }
    ): Promise<ClientConnection> => {
      const newEntry = {
        name,
        description,
        environmentId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const newId = await repos.clientConnection.create(newEntry);

      if (!newId) {
        throw new Error('Failed to create ClientConnection');
      }

      return {
        id: newId,
        ...newEntry,
      };
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
    createUser: async (
      _: any,
      { email, permissions }: { email: string; permissions: Record<string, string> }
    ): Promise<User | null> => {
      const newEntry: UserDraft = {
        email,
        permissions,
      };
    
      const userId = await repos.user.create(newEntry);
    
      if (!userId) {
        throw new Error('Failed to create User');
      }
    
      return await repos.user.get(userId); // Fetch and return the created user
    },
    
    updateUser: async (
      _: any,
      { id, email, permissions }: { id: string; email?: string; permissions?: Record<string, string> }
    ): Promise<User> => {
      const updates: Partial<User> = {};
      if (email) updates.email = email;
      if (permissions) updates.permissions = permissions;
    
      const success = await repos.user.update({ id, ...updates });
    
      if (!success) {
        throw new Error('Failed to update User');
      }
    
      // Fetch and return the updated user
      const updatedUser = await repos.user.get(id);
      if (!updatedUser) {
        throw new Error('Updated User not found');
      }
    
      return updatedUser; // Ensure this includes `id`
    },
    
    
    deleteUser: async (_: any, { id }: { id: string }): Promise<string> => {
      const success = await repos.user.delete(id);
    
      if (!success) {
        throw new Error('Failed to delete User');
      }
    
      return id;
    },

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
    // createExperiment: async (
    //   _: any,
    //   { name, status, enrollmentAttributes, enrollmentProportion, flagId, description, hypothesis, startTimestamp, endTimestamp }: {
    //     name: string;
    //     status: "draft" | "active" | "paused" | "completed";
    //     enrollmentAttributes: string[];
    //     enrollmentProportion: number;
    //     flagId: string;
    //     description?: string;
    //     hypothesis?: string;
    //     startTimestamp?: number;
    //     endTimestamp?: number;
    //   }
    // ): Promise<Boolean> => {
    //   const newExperiment = {
    //     name,
    //     status,
    //     enrollment: {
    //       attribute: enrollmentAttributes,
    //       proportion: enrollmentProportion
    //     },
    //     flagId,
    //     description,
    //     hypothesis,
    //     startTimestamp,
    //     endTimestamp,
    //     createdAt: Date.now(),
    //     updatedAt: Date.now(),
    //     type: "Experiment",
    //     groups: [],
    //     dependents: [],
    //   };

    //   const newId = await repos.experiment.create(newExperiment);
    //   console.log("Experiment created with ID:", newId);

    //   if (!newId) {
    //     throw new Error('Failed to create experiment');
    //   }

    //   return true;
    // },

    // updateExperiment: async (
    //   _: any,
    //   {
    //     id,
    //     name,
    //     status,
    //     enrollmentAttributes,
    //     enrollmentProportion,
    //     flagId,
    //     description,
    //     hypothesis,
    //     startTimestamp,
    //     endTimestamp,
    //   }: {
    //     id: string;
    //     name?: string;
    //     status?: "draft" | "active" | "paused" | "completed";
    //     enrollmentAttributes?: string[];
    //     enrollmentProportion?: number;
    //     flagId?: string;
    //     description?: string;
    //     hypothesis?: string;
    //     startTimestamp?: number;
    //     endTimestamp?: number;
    //   }
    // ): Promise<Experiment> => {
    //   const updates: Partial<Experiment> = {
    //     id,
    //     type: "Experiment",
    //     createdAt: Date.now(), // Add createdAt if necessary
    //     updatedAt: Date.now(), // Update timestamp for record
    //   };

    //   if (name !== undefined) updates.name = name;
    //   if (status !== undefined) updates.status = status;
    //   if (enrollmentAttributes !== undefined)
    //     updates.enrollment = { attributes: enrollmentAttributes, proportion: updates.enrollment?.proportion ?? 0 };
    //   if (enrollmentProportion !== undefined)
    //     updates.enrollment = { attributes: updates.enrollment?.attributes ?? [], proportion: enrollmentProportion };
    //   if (flagId !== undefined) updates.flagId = flagId;
    //   if (description !== undefined) updates.description = description;
    //   if (hypothesis !== undefined) updates.hypothesis = hypothesis;
    //   if (startTimestamp !== undefined) updates.startTimestamp = startTimestamp;
    //   if (endTimestamp !== undefined) updates.endTimestamp = endTimestamp;

    //   try {
    //     const validExperiment = experimentSchema.parse(updates);

    //     const success = await repos.experiment.update({...validExperiment });
    //     if (!success) {
    //       throw new Error('Failed to update experiment');
    //     }

    //     const updatedExperiment = await repos.experiment.get(id);
    //     if (!updatedExperiment) {
    //       throw new Error(`No experiment found.`);
    //     }
    //     return updatedExperiment;
    //   } catch (error: any) {
    //     throw new Error(`Validation failed: ${error.message}`);
    //   }
    // },

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
    // createFeatureFlag: async (
    //   _: any,
    //   { input }: { input: FeatureFlagDraft }
    // ): Promise<FeatureFlagDraft | null> => {
    //   const { name, description } = input;
    
    //   const newFeatureFlag: FeatureFlagDraft = {
    //     name,
    //     description,

    //   };
    
    //   const flagId = await repos.featureFlag.create(newFeatureFlag);
    
    //   if (!flagId) {
    //     throw new Error('Failed to create FeatureFlag');
    //   }
    
    //   // Assuming the repository returns data conforming to FeatureFlagDraft after creation
    //   return await repos.featureFlag.get(flagId);
    // },
    

    // updateFeatureFlag: async (
    //   _: any,
    //   { id, name, description, enabled, environment }: {id: string; name?: string; description?: string; enabled?: boolean; environment?: string }
    // ): Promise<FeatureFlagDraft | null> => {

    //   const updates: Partial<FeatureFlagDraft> = {}
    //   if (name !== undefined) updates.name = name;
    //   if (description !== undefined) updates.description = description;
    //   // if (enabled !== undefined) updates.environments = environment
    
    //   const partialEntry = { id, ...updates };


    //   const success = await repos.featureFlag.update(partialEntry);

    //   if (!success) {
    //     throw new Error(`Failed to update FeatureFlag with ID: ${id}`);
    //   }

    //   return await repos.featureFlag.get(id); // Fetch and return the updated feature flag
    // },

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
};
