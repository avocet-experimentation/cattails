import { getTestingRepos } from '../repository/index.js';

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
  }
};
