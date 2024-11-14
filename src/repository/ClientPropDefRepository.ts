import { ClientPropDef, clientPropDefSchema } from "@estuary/types";
import MongoRepository from "./MongoRepository.js";

export default class ClientPropDefRepository extends MongoRepository<ClientPropDef, typeof clientPropDefSchema> {
  constructor(mongoUri: string) {
    super('ClientPropDef', clientPropDefSchema, mongoUri);
  }
}
