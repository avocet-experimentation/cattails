import { Environment, environmentSchema } from "@estuary/types";
import MongoRepository from "./MongoRepository.js";

export default class EnvironmentRepository extends MongoRepository<Environment, typeof environmentSchema> {
  constructor(mongoUri: string) {
    super('Environment', environmentSchema, mongoUri);
  }
}
