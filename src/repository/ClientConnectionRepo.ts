import { ClientConnection, clientConnectionSchema } from "@estuary/types"; //TODO - schema not found
import MongoRepository from "./MongoRepository.js";

export default class ClientConnectionRepository extends MongoRepository<ClientConnection> {
  constructor(mongoUri: string) {
    super('clientConnection', clientConnectionSchema, mongoUri);
  }
}
