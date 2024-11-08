import { MongoClient, ObjectId, Document, WithId, Collection, Db } from 'mongodb';
// import env from '../envalid.js';
import { FeatureFlag, featureFlagSchema, Experiment, experimentSchema } from '@estuary/types';
import { DraftRecord, WithMongoStringId } from '../lib/MongoAPI.js';
import MongoRepository from './MongoRepository.js';

/**
 * Provides CRUD for FeatureFlags stored in MongoDB. 
 * Also transforms Feature Flag documents into the appropriate type
 * Read all from one collection (later: paginate)
 * Transforms records
 * 
 * todo:
 * - extend MongoManager and add/override methods as needed
 */
class FFlagRepository extends MongoRepository<FeatureFlag> {
  // #client: MongoClient;
  // #db: Db;
  // #collection: Collection<DraftRecord<FeatureFlag>>;
  // environments: Collection<Environment>;

  constructor(mongoUri?: string) {
    super('flags', featureFlagSchema, mongoUri);
    // this.#client = new MongoClient(mongoUri ?? env.MONGO_URI);
    // this.#db = this.#client.db();
    // this.#collection = this.#db.collection('flags');
    // this.environments = this.db.collection('environments');
  }

  // /**
  //  * Get up to `maxCount` feature flags, or all if not specified
  //  * @returns a possibly empty array of documents
  //  */
  // async getFlags(maxCount?: number): Promise<FeatureFlag[]> {
  //   const resultCursor = this.collection.find({});
  //   if (maxCount) resultCursor.limit(maxCount);
  //   const flagDocuments = await resultCursor.toArray();
  //   // console.log({ flagDocuments })
  //   const transformed = flagDocuments.map(this._recordToObject);
  //   return transformed;
  // }

  // /**
  //  * @param documentId a hex string representing an ObjectId
  //  */
  // async getFlag(documentId: string): Promise<FeatureFlag | null> {
  //   const docId = ObjectId.createFromHexString(documentId);
  //   const result = await this.collection.findOne({ _id: docId });
  //   if (result === null) return result;
  //   return this._recordToObject(result);
  // }

  // /**
  //  * Find a flag document from any of its properties. An empty object matches all documents.
  //  * To find by name, pass { name: <documentName> }
  //  * See https://www.mongodb.com/docs/drivers/node/current/fundamentals/crud/query-document/#std-label-node-fundamentals-query-document
  //  * @param query A MongoDB query
  //  */
  // async findFlag(query: { [key: string]: unknown }): Promise<FeatureFlag | null> {
  //   const result = await this.collection.findOne(query);
  //   if (result === null) return result;
  //   return this._recordToObject(result);
  // }

  // async findMatchingFlags(query: { [key: string]: unknown }): Promise<FeatureFlag[]> {
  //   const result = await this.collection.find(query);
  //   const docs = await result.toArray();
  //   return docs.map(this._recordToObject);
  // }
  // /**
  //  * @returns a hex string representing the new record's ObjectId
  //  */
  // async createFlag(flag: DraftRecord<FeatureFlag>): Promise<string | null> {
  //   if ('id' in flag) { // placeholder
  //     throw new Error(`Argument has id ${flag.id}, suggesting the record already exists`);
  //   }

  //   const result = await this.collection.insertOne(flag);
  //   return result.insertedId?.toHexString() ?? null;
  // }

  // /**
  //  * Updates an existing flag
  //  * @returns a hex string representing the updated record's ObjectId,
  //  * or null if no record was updated
  //  */
  // async updateFlag(flag: WithMongoStringId<FeatureFlag>): Promise<string | null> {
  //   const { id, ...updates } = flag;
  //   const result = await this.collection.updateOne({ _id: ObjectId.createFromHexString(id)}, updates);
  //   return result.upsertedId?.toHexString() ?? null;
  // }

  // /**
  //  * Deletes an existing flag
  //  * @returns true if a record was deleted, or false otherwise
  //  */
  // async deleteFlag(documentId: string): Promise<boolean> {
  //   const filter = { _id: ObjectId.createFromHexString(documentId)};
  //   const result = await this.collection.deleteOne(filter);
  //   return result.deletedCount === 1;
  // }
}
