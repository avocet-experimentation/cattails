import { getTestingRepos } from '../repository/index.js';
import { ClientPropDef } from "@estuary/types";
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
      return await repos.clientPropDef.get(id);
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
    ): Promise<string | null> => {
      const success = await repos.clientPropDef.delete(id);
      if (success) {
        return id; //return deleted id i guess?
      }
      throw new Error('Failed to delete ClientPropDef');
    }
  }
};
