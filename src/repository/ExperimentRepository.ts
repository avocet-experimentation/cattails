import { Experiment, experimentSchema } from "@estuary/types";
import MongoRepository from "./MongoRepository.js";

export default class ExperimentRepository extends MongoRepository<Experiment, typeof experimentSchema> {
  constructor(mongoUri: string) {
    super('Experiment', experimentSchema, mongoUri);
  }
}
