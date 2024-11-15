import { getTestingRepos } from '../repository/index.js';
import { ClientPropDef, ClientConnection, User, Environment, Experiment } from "@estuary/types";
const repos = getTestingRepos();

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
      // return await repos.clientPropDef.get(id);
      return true;
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
    ): Promise<boolean> => {
      const success = await repos.clientPropDef.delete(id);
      if (success) {
        return true;
      }
      throw new Error('Failed to delete ClientPropDef');
    },

    updateClientConnection: async (
      _: any,
      { id, name, description, environmentId }: { id: string; name?: string; description?: string; environmentId?: string }
    ): Promise<boolean | null> => {
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
    
      return true;
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
    // createUser: async (
    //   _: any,
    //   { email, permissions }: { email?: string; permissions: Record<string, string> }
    // ): Promise<User | null> => {
    //   const newEntry: Partial<User> = {
    //     email,
    //     permissions,
    //     createdAt: Date.now(),
    //     updatedAt: Date.now(),
    //   };
    
    //   const userId = await repos.user.create(newEntry);
    
    //   if (!userId) {
    //     throw new Error('Failed to create User');
    //   }
    
    //   return await repos.user.get(userId); // Fetch and return the created user
    // },
    updateUser: async (
      _: any,
      { id, email, permissions }: { id: string; email?: string; permissions?: Record<string, string> }
    ): Promise<boolean | null> => {
      const updates: Partial<User> = {};
      if (email !== undefined) updates.email = email;
      if (permissions !== undefined) updates.permissions = permissions;
      updates.updatedAt = Date.now();
    
      const partialEntry = { id, ...updates };
    
      const success = await repos.user.update(partialEntry);
    
      if (!success) {
        throw new Error('Failed to update User');
      }
    
      return true;
    },
    deleteUser: async (_: any, { id }: { id: string }): Promise<boolean> => {
      const success = await repos.user.delete(id);
    
      if (!success) {
        throw new Error('Failed to delete User');
      }
    
      return true;
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
    // ): Promise<Experiment> => {
    //   const newExperiment = {
    //     name,
    //     status,
    //     enrollment: {
    //       attributes: enrollmentAttributes,
    //       proportion: enrollmentProportion,
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

    //   if (!newId) {
    //     throw new Error('Failed to create experiment');
    //   }

    //   return await repos.experiment.get(newId);
    // },

    updateExperiment: async (
      _: any,
      { id, name, status, enrollmentAttributes, enrollmentProportion, flagId, description, hypothesis, startTimestamp, endTimestamp }: {
        id: string;
        name?: string;
        status?: "draft" | "active" | "paused" | "completed";
        enrollmentAttributes?: string[];
        enrollmentProportion?: number;
        flagId?: string;
        description?: string;
        hypothesis?: string;
        startTimestamp?: number;
        endTimestamp?: number;
      }
    ): Promise<Experiment | null> => {
      const updates: Partial<Experiment> = {};

      if (name !== undefined) updates.name = name;
      if (status !== undefined) updates.status = status;
      if (enrollmentAttributes !== undefined) updates.enrollment = { attributes: enrollmentAttributes, proportion: updates.enrollment?.proportion ?? 0 };
      if (enrollmentProportion !== undefined) updates.enrollment = { attributes: updates.enrollment?.attributes ?? [], proportion: enrollmentProportion };
      if (flagId !== undefined) updates.flagId = flagId;
      if (description !== undefined) updates.description = description;
      if (hypothesis !== undefined) updates.hypothesis = hypothesis;
      if (startTimestamp !== undefined) updates.startTimestamp = startTimestamp;
      if (endTimestamp !== undefined) updates.endTimestamp = endTimestamp;

      updates.updatedAt = Date.now();

      const success = await repos.experiment.update({ id, ...updates });

      if (!success) {
        throw new Error('Failed to update experiment');
      }

      return await repos.experiment.get(id);
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
    
  
  }
};
