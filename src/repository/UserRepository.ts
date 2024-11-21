import { User, userSchema } from "@estuary/types";
import MongoRepository from "./MongoRepository.js";
import RepositoryManager from "./RepositoryManager.js";

export default class UserRepository extends MongoRepository<User> {
  constructor(repositoryManager: RepositoryManager) {
    super('User', userSchema, repositoryManager);
  }
}
