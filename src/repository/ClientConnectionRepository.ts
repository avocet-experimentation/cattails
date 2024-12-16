import { ClientConnection, clientConnectionSchema } from '@avocet/core';
import MongoRepository from './MongoRepository.js';
import { IRepositoryManager } from './repository-types.js';

export default class ClientConnectionRepository extends MongoRepository<ClientConnection> {
  constructor(repositoryManager: IRepositoryManager) {
    super('clientConnection', clientConnectionSchema, repositoryManager);
  }
}
