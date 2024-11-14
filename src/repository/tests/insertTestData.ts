import { MongoClient, ObjectId } from 'mongodb';
import env from '../../envalid.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { exampleFlags, getExampleFlag, staticFlags } from './testData.js';
import FeatureFlagRepository from '../FeatureFlagRepository.js'
import { EstuaryMongoCollectionName, FeatureFlag } from '@estuary/types';
// import ExperimentRepository from '../FeatureFlagRepository.js'

const fflagRepo = new FeatureFlagRepository(env.MONGO_TESTING_URI);
// const experimentRepo = new ExperimentRepository(env.MONGO_TESTING_URI);

const db = new MongoClient(env.MONGO_TESTING_URI).db();

const insertExampleFlags = async (resultsArray: (string | null)[]) => {
  const promises = [
    fflagRepo.create(exampleFlags[0]),
    fflagRepo.create(exampleFlags[1]),
  ];

  const resolved = await Promise.all(promises);
  resultsArray.splice(resultsArray.length, 0, ...resolved);
}

const eraseCollection = async (collectionName: EstuaryMongoCollectionName) => await db.dropCollection(collectionName);

const eraseTestData = async () => {
  await eraseCollection('FeatureFlag');
  await eraseCollection('Experiment');
}

const insertTestFlag = async(flag: FeatureFlag) => {
  await db.collection('FeatureFlag').insertOne(flag);
}

await insertTestFlag(staticFlags[0]);