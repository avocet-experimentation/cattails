import { Experiment, experimentSchema, FeatureFlag, featureFlagSchema } from "@estuary/types";
import MongoRepository from "./MongoRepository.js";
import env from "../envalid.js";
/**
 * Use getAdminRepos or getClientRepos instead of the classes
 */

export class FFlagRepository extends MongoRepository<FeatureFlag> {
  constructor(mongoUri: string) {
    super('flags', featureFlagSchema, mongoUri);
  }
}

export class ExperimentRepository extends MongoRepository<Experiment> {
  constructor(mongoUri: string) {
    super('experiments', experimentSchema, mongoUri);
  }
}

export function getAdminRepos() {
  return {
    fflagRepo: new FFlagRepository(env.MONGO_ADMIN_URI),
    experimentRepo: new ExperimentRepository(env.MONGO_ADMIN_URI),
  }
}

export function getClientRepos() {
  return {
    fflagRepo: new FFlagRepository(env.MONGO_API_URI),
    experimentRepo: new ExperimentRepository(env.MONGO_API_URI),
  }
}
