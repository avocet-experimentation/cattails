import { MongoClient, ObjectId } from 'mongodb';
import cfg from '../envalid.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { exampleFlagDrafts, staticFlagDrafts, staticFlags } from './data/featureFlags.js';
// import FeatureFlagRepository from '../repository/FeatureFlagRepository.js'
import { ClientConnectionDraft, ClientPropDef, ClientPropDefDraft, EnvironmentDraft, EstuaryMongoCollectionName, ExperimentDraft, FeatureFlag, FeatureFlagDraft, UserDraft } from '@estuary/types';
import { staticClientPropDefs } from './data/clientPropDefs.js';
import { staticClientConnections } from './data/clientConnections.js';
import { exampleEnvironment, exampleEnvironmentArray } from './data/environments.js';
import { exampleExperiment } from './data/experiments.js';
import { staticUser } from './data/user.js';
import RepositoryManager from '../repository/RepositoryManager.js';

const db = new MongoClient(cfg.MONGO_ADMIN_URI).db();
const colls = new RepositoryManager(cfg.MONGO_ADMIN_URI);

const eraseCollection = async (collectionName: EstuaryMongoCollectionName) => await db.dropCollection(collectionName);

const eraseTestData = async () => {
  await eraseCollection('featureFlag');
  await eraseCollection('experiment');
  await eraseCollection('clientPropDef');
  await eraseCollection('environment');
  await eraseCollection('clientConnection');
}

const insertFeatureFlag = async(obj: FeatureFlagDraft) => {
  await colls.featureFlag.create({...obj});
}

const insertClientPropDefs = async(arr: ClientPropDefDraft[]) => {
  for (let i = 0; i < arr.length; i += 1) {
    await colls.clientPropDef.create(arr[i]);
  }
}

const insertClientConnections = async(arg: ClientConnectionDraft) => {
  await colls.clientConnection.create(arg);
}

const insertEnvironments = async(arr: EnvironmentDraft[]) => {
  for (let i = 0; i < arr.length; i += 1) {
    await colls.environment.create(arr[i]);
  }
}

const insertExperiments = async(arg: ExperimentDraft) => {
  await colls.experiment.create(arg);
}

const insertUser = async(arg: UserDraft) => {
  await colls.user.create(arg);
}
  // await eraseTestData();
  // await insertUser(staticUser);
  // await insertExperiments(exampleExperiment);
  // await insertEnvironments([exampleEnvironment]);
  // await insertEnvironments(exampleEnvironmentArray);
  // await insertClientConnections(staticClientConnections);
  // await insertFeatureFlag(exampleFlagDrafts[0]);
  // await insertClientPropDefs(staticClientPropDefs);

  // console.log("Flags:", await colls.featureFlag.findMany({}));
  // console.log("Client Connection:", await colls.clientConnection.findMany({}));
  // console.log("Experiment:", await colls.experiment.findMany({})); 
  // console.log("Environment:", await colls.environment.findMany({}));
  // console.log("Client Prop Defs: ", await colls.clientPropDef.findMany({}));
  // console.log("User:", await colls.user.findMany({}));