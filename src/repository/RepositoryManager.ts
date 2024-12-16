import { MongoClient } from 'mongodb';
import SDKConnectionRepository from './SDKConnectionRepository.js';
import ClientPropDefRepository from './ClientPropDefRepository.js';
import EnvironmentRepository from './EnvironmentRepository.js';
import ExperimentRepository from './ExperimentRepository.js';
import FeatureFlagRepository from './FeatureFlagRepository.js';
import UserRepository from './UserRepository.js';
import { IRepositoryManager } from './repository-types.js';

export default class RepositoryManager implements IRepositoryManager {
  client: MongoClient;

  featureFlag: FeatureFlagRepository;

  experiment: ExperimentRepository;

  clientPropDef: ClientPropDefRepository;

  environment: EnvironmentRepository;

  sdkConnection: SDKConnectionRepository;

  user: UserRepository;

  constructor(mongoUri: string) {
    this.client = new MongoClient(mongoUri);

    this.featureFlag = new FeatureFlagRepository(this);
    this.experiment = new ExperimentRepository(this);
    this.clientPropDef = new ClientPropDefRepository(this);
    this.environment = new EnvironmentRepository(this);
    this.sdkConnection = new SDKConnectionRepository(this);
    this.user = new UserRepository(this);
  }
}
