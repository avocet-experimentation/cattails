import { MongoClient, ObjectId } from 'mongodb';
import env from '../envalid.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { exampleFlags, getExampleFlag, staticFlags } from './data/featureFlags.js';
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

const db = new MongoClient(env.MONGO_TESTING_URI).db();
const colls = {
  flags: db.collection('FeatureFlag'),
  clientProps: db.collection('ClientPropDef'),
  connections: db.collection('ClientConnection'),
  experiments: db.collection('Experiment'),
  environments: db.collection('Environment'),
  users: db.collection('User'),
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
  await eraseCollection('FeatureFlag');
  await eraseCollection('Experiment');
  await eraseCollection('ClientPropDef');
  await eraseCollection('Environment');
  await eraseCollection('ClientConnection');
}

const insertFeatureFlag = async(obj: FeatureFlagDraft) => {
  await colls.flags.insertOne(obj);
}

const insertClientPropDefs = async(arr: ClientPropDefDraft[]) => {
  await db.collection('ClientPropDef').insertMany(arr);
}

const insertClientConnections = async(arg: ClientConnectionDraft) => {
  await db.collection('ClientConnection').insertOne(arg);
}

const insertEnvironment = async(arg: EnvironmentDraft) => {
  await db.collection('Environment').insertOne(arg);
}

const insertExperiments = async(arg: ExperimentDraft) => {
  await db.collection('Experiment').insertOne(arg);
}

// await eraseTestData();
// await insertEnvironment(staticEnvironment);
const insertUser = async(arg: UserDraft) => {
    await db.collection('User').insertOne(arg);
    console.log(await colls.users.find().toArray());
  }
  // await eraseTestData();
  await insertUser(staticUser);
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