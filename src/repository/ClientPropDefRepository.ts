import { ClientPropDef, clientPropDefSchema } from "@estuary/types";
import MongoRepository from "./MongoRepository.js";

export default class ClientPropDefRepository extends MongoRepository<ClientPropDef> {
  constructor(mongoUri: string) {
    super('clientPropDef', clientPropDefSchema, mongoUri);
  }
}
