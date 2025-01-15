import {
  AvocetMongoCollectionName,
  AvocetMongoTypes,
  DraftRecord,
  SDKConnectionDraft,
  ClientPropDefDraft,
  EnvironmentDraft,
  ExperimentDraft,
  FeatureFlagDraft,
  UserDraft,
} from '@avocet/core';
import { RepositoryManager, MongoRepository } from '@avocet/mongo-client';
import cfg from '../envalid.js';

// change which one is commented out to swap the target database
const CONNECTION_STRING = cfg.MONGO_ADMIN_URI;
// const CONNECTION_STRING = cfg.MONGO_TESTING_URI;

export const colls = new RepositoryManager(CONNECTION_STRING);
const db = colls.client.db();

const eraseCollection = async (collectionName: AvocetMongoCollectionName) =>
  db.dropCollection(collectionName);

export const eraseTestData = async () => {
  await eraseCollection('featureFlag');
  await eraseCollection('experiment');
  await eraseCollection('clientPropDef');
  await eraseCollection('environment');
  await eraseCollection('sdkConnection');
};

export const repos = new RepositoryManager(cfg.MONGO_ADMIN_URI);

export const insertDrafts = async <T extends AvocetMongoTypes>(
  drafts: DraftRecord<T>[],
  collection: MongoRepository<T>,
) => {
  const promises: Promise<string>[] = [];
  for (let i = 0; i < drafts.length; i += 1) {
    promises.push(collection.create(drafts[i]));
  }
  await Promise.all(promises);
};

export const insertFeatureFlags = async (obj: FeatureFlagDraft[]) =>
  insertDrafts(obj, colls.featureFlag);

export const insertClientPropDefs = async (arr: ClientPropDefDraft[]) =>
  insertDrafts(arr, colls.clientPropDef);

export const insertSDKConnections = async (arg: SDKConnectionDraft[]) =>
  insertDrafts(arg, colls.sdkConnection);

export const insertEnvironments = async (arr: EnvironmentDraft[]) =>
  insertDrafts(arr, colls.environment);

export const insertExperiments = async (arr: ExperimentDraft[]) =>
  insertDrafts(arr, colls.experiment);

export const insertUsers = async (arg: UserDraft[]) =>
  insertDrafts(arg, colls.user);
