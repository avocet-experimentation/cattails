import { ClientPropDef, clientPropDefSchema } from "@estuary/types";
import MongoRepository from "./MongoRepository.js";
import RepositoryManager from "./RepositoryManager.js";

export default class ClientPropDefRepository extends MongoRepository<ClientPropDef> {
  constructor(repositoryManager: RepositoryManager) {
    super('clientPropDef', clientPropDefSchema, repositoryManager);
  }
}
