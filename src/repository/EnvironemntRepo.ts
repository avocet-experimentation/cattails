import { Environment, environmentSchema } from "@estuary/types";
import MongoRepository from "./MongoRepository.js";

export default class environmentRepository extends MongoRepository<Environment> {
  constructor(mongoUri: string) {
    super('environemnt', environmentSchema, mongoUri);
  }
}
