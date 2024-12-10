import {
  EstuaryMongoTypes,
  BeforeId,
  RequireOnly,
  FeatureFlag,
  Experiment,
  ClientPropDef,
  Environment,
  ClientConnection,
  User,
} from '@estuary/types';
import { MongoClient, WithId } from 'mongodb';
// eslint-disable-next-line import/no-cycle
import MongoRepository from './MongoRepository.js';

/* TYPE DEFINITIONS FOR WORKING WITH MONGO RECORDS */

export type MongoRecord<T extends EstuaryMongoTypes> = WithId<BeforeId<T>>;
/**
 * A partial type that only requires an `id` field
 */
export type PartialWithStringId<T extends EstuaryMongoTypes> = RequireOnly<
T,
'id'
>;

export interface IRepositoryManager {
  client: MongoClient;

  featureFlag: MongoRepository<FeatureFlag>;
  experiment: MongoRepository<Experiment>;
  clientPropDef: MongoRepository<ClientPropDef>;
  environment: MongoRepository<Environment>;
  clientConnection: MongoRepository<ClientConnection>;
  user: MongoRepository<User>;
}
