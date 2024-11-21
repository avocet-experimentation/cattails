import { Environment, environmentSchema } from "@estuary/types";
import MongoRepository from "./MongoRepository.js";
import RepositoryManager from "./RepositoryManager.js";

export default class EnvironmentRepository extends MongoRepository<Environment> {
  constructor(repositoryManager: RepositoryManager) {
    super('Environment', environmentSchema, repositoryManager);
  }
}
