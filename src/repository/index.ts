import env from "../envalid.js";
import FeatureFlagRepository from "./FeatureFlagRepository.js";
import ExperimentRepository from "./ExperimentRepository.js";
/**
 * Use getAdminRepos or getClientRepos
 */
export function getAdminRepos() {
  const repos = {
    featureFlag: new FeatureFlagRepository(env.MONGO_ADMIN_URI),
    experiment: new ExperimentRepository(env.MONGO_ADMIN_URI),
  };

  repos.featureFlag.collection.createIndex({ 'name': 1 }, { unique: true, });
  repos.featureFlag.collection.createIndex({ 'environments.$**': 1 });
  repos.experiment.collection.createIndex({ 'name': 1 }, { unique: true, });

  return repos;
}

export function getClientRepos() {
  return {
    fflagRepo: new FeatureFlagRepository(env.MONGO_API_URI),
    experimentRepo: new ExperimentRepository(env.MONGO_API_URI),
  }
}
