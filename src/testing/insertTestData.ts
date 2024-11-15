import { MongoClient, ObjectId } from 'mongodb';
import env from '../envalid.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { exampleFlags, getExampleFlag, staticFlags } from './data/featureFlags.js';
// import FeatureFlagRepository from '../repository/FeatureFlagRepository.js'
import { ClientPropDef, ClientPropDefDraft, EstuaryMongoCollectionName, FeatureFlag, FeatureFlagDraft } from '@estuary/types';
import { staticClientPropDefs } from './data/clientPropDefs.js';
// import ExperimentRepository from '../FeatureFlagRepository.js'

/**
 * Todo:
 * - move to using Repository methods only (for consistent parsing and transformation)
 */

const db = new MongoClient(env.MONGO_TESTING_URI).db();
const colls = {
  flags: db.collection('FeatureFlag'),
  clientProps: db.collection('ClientPropDef'),
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
}

const insertFeatureFlag = async(obj: FeatureFlagDraft) => {
  await colls.flags.insertOne(obj);
  console.log(await colls.flags.find().toArray());
}

const insertClientPropDefs = async(arr: ClientPropDefDraft[]) => {
  await db.collection('ClientPropDef').insertMany(arr);
  console.log(await colls.clientProps.find().toArray());
}

await insertFeatureFlag(staticFlags[0]);
await insertClientPropDefs(staticClientPropDefs);
