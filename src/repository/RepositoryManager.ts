import { Db, MongoClient } from "mongodb";
import ClientConnectionRepository from "./ClientConnectionRepository.js";
import ClientPropDefRepository from "./ClientPropDefRepository.js";
import EnvironmentRepository from "./EnvironmentRepository.js";
import ExperimentRepository from "./ExperimentRepository.js";
import FeatureFlagRepository from "./FeatureFlagRepository.js";
import UserRepository from "./UserRepository.js";

export default class RepositoryManager {
  client: MongoClient;

  featureFlag: FeatureFlagRepository;
  experiment: ExperimentRepository;
  clientPropDef: ClientPropDefRepository;
  environment: EnvironmentRepository;
  clientConnection: ClientConnectionRepository;
  user: UserRepository;

  constructor(mongoUri: string) {
    this.client = new MongoClient(mongoUri);

    this.featureFlag = new FeatureFlagRepository(this);
    this.experiment = new ExperimentRepository(this);
    this.clientPropDef = new ClientPropDefRepository(this);
    this.environment = new EnvironmentRepository(this);
    this.clientConnection = new ClientConnectionRepository(this);
    this.user = new UserRepository(this);
  }
}