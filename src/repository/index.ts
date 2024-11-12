import env from "../envalid.js";
import FeatureFlagRepository from "./FeatureFlagRepository.js";
import ExperimentRepository from "./ExperimentRepository.js";
/**
 * Use getAdminRepos or getClientRepos
 */
export function getAdminRepos() {
  return {
    fflagRepo: new FeatureFlagRepository(env.MONGO_ADMIN_URI),
    experimentRepo: new ExperimentRepository(env.MONGO_ADMIN_URI),
  }
}

export function getClientRepos() {
  return {
    fflagRepo: new FeatureFlagRepository(env.MONGO_API_URI),
    experimentRepo: new ExperimentRepository(env.MONGO_API_URI),
  }
}
