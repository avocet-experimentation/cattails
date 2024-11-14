import { schema } from './schemas.js';
import { EstuarySchema } from '@estuary/types';
import env from "../envalid.js";
import ClientPropDefRepository from '../repository/ClientPropDefRepository.js';
import environmentRepository from '../repository/EnvironemntRepo.js';
import UserRepository from '../repository/UserRepo.js';
import ClientConnectionRepository from '../repository/ClientConnectionRepo.js';


const clientPropDefRepo = new ClientPropDefRepository(env.MONGO_ADMIN_URI);
const environmentRepo = new environmentRepository(env.MONGO_ADMIN_URI);
const clientConnectionRepo = new UserRepository(env.MONGO_ADMIN_URI);
const userRepo = new ClientConnectionRepository(env.MONGO_ADMIN_URI);

export const resolvers = {
  Query: {
    clientPropDef: async (_: any, { id }: { id: string }) => {
      return await clientPropDefRepo.get(id);
    },
    allClientPropDefs: async (_: any, { limit }: { limit?: number;}) => {
      return await clientPropDefRepo.getMany(limit);
    },
    environment: async (_: any, { id }: { id: string }) => {
      return await environmentRepo.get(id);
    },
    allEnvironments: async (_: any, { limit }: { limit?: number;}) => {
      return await environmentRepo.getMany(limit);
    },
    clientConnection: async (_: any, { id }: { id: string }) => {
      return await clientConnectionRepo.get(id);
    },
    allClientConnections: async (_: any, { limit }: { limit?: number;}) => {
      return await clientConnectionRepo.getMany(limit);
    },
    user: async (_: any, { id }: { id: string }) => {
      return await userRepo.get(id);
    },
    allUsers: async (_: any, { limit }: { limit?: number;}) => {
      return await userRepo.getMany(limit);
    }
  }
};
