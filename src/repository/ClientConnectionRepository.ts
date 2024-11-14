import { ClientConnection, clientConnectionSchema } from "@estuary/types"; //TODO - schema not found
import MongoRepository from "./MongoRepository.js";

export default class ClientConnectionRepository extends MongoRepository<ClientConnection, typeof clientConnectionSchema> {
  constructor(mongoUri: string) {
    super('ClientConnection', clientConnectionSchema, mongoUri);
  }
}
