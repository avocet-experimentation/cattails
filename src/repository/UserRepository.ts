import { User, userSchema } from '@avocet/core';
import MongoRepository from './MongoRepository.js';
import { IRepositoryManager } from './repository-types.js';

export default class UserRepository extends MongoRepository<User> {
  constructor(repositoryManager: IRepositoryManager) {
    super('user', userSchema, repositoryManager);
  }
}
