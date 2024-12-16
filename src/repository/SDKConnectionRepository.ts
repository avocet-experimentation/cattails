import { SDKConnection, sdkConnectionSchema } from '@avocet/core';
import MongoRepository from './MongoRepository.js';
import { IRepositoryManager } from './repository-types.js';

export default class SDKConnectionRepository extends MongoRepository<SDKConnection> {
  constructor(repositoryManager: IRepositoryManager) {
    super('sdkConnection', sdkConnectionSchema, repositoryManager);
  }
}
