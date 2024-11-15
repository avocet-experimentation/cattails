import env from "../envalid.js";
import FeatureFlagRepository from "./FeatureFlagRepository.js";
import ExperimentRepository from "./ExperimentRepository.js";
import ClientPropDefRepository from "./ClientPropDefRepository.js";
import EnvironmentRepository from '../repository/EnvironmentRepository.js';
import UserRepository from '../repository/UserRepository.js';
import ClientConnectionRepository from '../repository/ClientConnectionRepository.js';

/**
 * Use getAdminRepos or getClientRepos
 */
export function getAdminRepos() {
  return {
    featureFlag: new FeatureFlagRepository(env.MONGO_ADMIN_URI),
    experiment: new ExperimentRepository(env.MONGO_ADMIN_URI),
    clientPropDef: new ClientPropDefRepository(env.MONGO_ADMIN_URI),
    environment: new EnvironmentRepository(env.MONGO_ADMIN_URI),
    clientConnection: new UserRepository(env.MONGO_ADMIN_URI),
    user: new ClientConnectionRepository(env.MONGO_ADMIN_URI),
  }
}

export function getClientRepos() {
  return {
    featureFlag: new FeatureFlagRepository(env.MONGO_API_URI),
    experiment: new ExperimentRepository(env.MONGO_API_URI),
  }
}

export function getTestingRepos() {
  return {
    featureFlag: new FeatureFlagRepository(env.MONGO_TESTING_URI),
    experiment: new ExperimentRepository(env.MONGO_TESTING_URI),
    clientPropDef: new ClientPropDefRepository(env.MONGO_TESTING_URI),
    environment: new EnvironmentRepository(env.MONGO_TESTING_URI),
    user: new UserRepository(env.MONGO_TESTING_URI),
    clientConnection: new ClientConnectionRepository(env.MONGO_TESTING_URI),
  }
}
