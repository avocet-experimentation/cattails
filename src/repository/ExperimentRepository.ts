import { Experiment, experimentSchema } from "@estuary/types";
import MongoRepository from "./MongoRepository.js";

export default class ExperimentRepository extends MongoRepository<Experiment> {
  constructor(mongoUri: string) {
    super('experiments', experimentSchema, mongoUri);
  }
}
