import { ClientConnection, clientConnectionSchema } from "@estuary/types";
import MongoRepository from "./MongoRepository.js";
import RepositoryManager from "./RepositoryManager.js";

export default class ClientConnectionRepository extends MongoRepository<ClientConnection> {
  constructor(repositoryManager: RepositoryManager) {
    super('ClientConnection', clientConnectionSchema, repositoryManager);
  }
}
