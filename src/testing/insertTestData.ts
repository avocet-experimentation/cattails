import { MongoClient, ObjectId } from 'mongodb';
import cfg from '../envalid.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { staticFlagDrafts } from './data/featureFlags.js';
// import FeatureFlagRepository from '../repository/FeatureFlagRepository.js'
import { ClientConnectionDraft, ClientPropDef, ClientPropDefDraft, EnvironmentDraft, EstuaryMongoCollectionName, ExperimentDraft, FeatureFlag, FeatureFlagDraft, UserDraft } from '@estuary/types';
import { staticClientPropDefs } from './data/clientPropDefs.js';
import { staticClientConnections } from './data/clientConnections.js';
import { staticEnvironment } from './data/environemnts.js';
import { staticExperiment } from './data/experiments.js';
import { staticUser } from './data/user.js';
// import ExperimentRepository from '../FeatureFlagRepository.js'

/**
 * Todo:
 * - move to using Repository methods only (for consistent parsing and transformation)
 */

const db = new MongoClient(cfg.MONGO_TESTING_URI).db();
const colls = {
  flags: db.collection('featureFlag'),
  clientProps: db.collection('clientPropDef'),
  connections: db.collection('clientConnection'),
  experiments: db.collection('experiment'),
  environments: db.collection('environment'),
  users: db.collection('user'),
}


// const fflagRepo = new FeatureFlagRepository(env.MONGO_TESTING_URI);
// const experimentRepo = new ExperimentRepository(env.MONGO_TESTING_URI);




// const insertExampleFlags = async (resultsArray: (string | null)[]) => {
//   const promises = [
//     fflagRepo.create(exampleFlags[0]),
//     fflagRepo.create(exampleFlags[1]),
//   ];

//   const resolved = await Promise.all(promises);
//   resultsArray.splice(resultsArray.length, 0, ...resolved);
// }

const eraseCollection = async (collectionName: EstuaryMongoCollectionName) => await db.dropCollection(collectionName);

const eraseTestData = async () => {
  await eraseCollection('featureFlag');
  await eraseCollection('experiment');
  await eraseCollection('clientPropDef');
  await eraseCollection('environment');
  await eraseCollection('clientConnection');
}

const insertFeatureFlag = async(obj: FeatureFlagDraft) => {
  await colls.flags.insertOne({...obj});
  console.log(await colls.flags.find().toArray());
}

const insertClientPropDefs = async(arr: ClientPropDefDraft[]) => {
  await db.collection('clientPropDef').insertMany(arr);
}

const insertClientConnections = async(arg: ClientConnectionDraft) => {
  await db.collection('clientConnection').insertOne(arg);
}

const insertEnvironment = async(arg: EnvironmentDraft) => {
  await db.collection('environment').insertOne(arg);
}

const insertExperiments = async(arg: ExperimentDraft) => {
  await db.collection('experiment').insertOne(arg);
}

// await eraseTestData();
// await insertEnvironment(staticEnvironment);
const insertUser = async(arg: UserDraft) => {
    await db.collection('User').insertOne(arg);
    console.log(await colls.users.find().toArray());
  }
  // await eraseTestData();
  // await insertUser(staticUser);
  // await insertExperiments(staticExperiment);
  // await insertEnvironment(staticEnvironment);
  // await insertClientConnections(staticClientConnections);
  // await insertFeatureFlag(staticFlags[0]);
  // await insertClientPropDefs(staticClientPropDefs);
  console.log("Flags:", await colls.flags.find().toArray());
  console.log("Client Connection:", await colls.connections.find().toArray());
  console.log("Experiment:", await colls.experiments.find().toArray()); 
  console.log("Environment:", await colls.environments.find().toArray());
  console.log("Client Prop Defs: ", await colls.clientProps.find().toArray());
  console.log("User:", await colls.users.find().toArray());