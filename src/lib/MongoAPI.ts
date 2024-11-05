import { MongoClient, ObjectId, Document, WithId, Collection, Db } from 'mongodb';
import env from '../envalid.js';
import { FeatureFlag, featureFlagSchema, Experiment, experimentSchema } from '@fflags/types';

/*
- ObjectID() ref: https://mongodb.github.io/node-mongodb-native/Next/classes/BSON.ObjectId.html

// mongoose options object:
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  authSource: "fflags",
  directConnection: true,
  autoIndex: true,
};
*/

/**
 * Transformed record that stores a hex string representing an ObjectId on the `id` property
 */
export type MongoTypes = FeatureFlag | Experiment;
export type DraftRecord<T extends MongoTypes> = Omit<T, 'id'>;
export type WithMongoStringId<T extends MongoTypes> = T & { id: string };

// export type ToArray<T> = T extends any ? T[] : never;
// export type MongoTypeArray = ToArray<MongoTypes>;

/**
 * CRUD individual environments, featureFlags and experiments
 * Read all from one collection (later: paginate)
 * Transform records
 * 
 * todo:
 * - method implementations
 * - write environment type and add to API
 * - integrate mongoose options?
 * - add runtime validation of fetched documents
 * - document types calculated from their standard types
 * - update property definitions to match document types
 */
export default class MongoAPI {
  #client: MongoClient;
  #db: Db;
  #flags: Collection<DraftRecord<FeatureFlag>>;
  #experiments: Collection<DraftRecord<Experiment>>;
  // environments: Collection<Environment>;

  constructor(mongoUri?: string) {
    this.#client = new MongoClient(mongoUri ?? env.MONGO_URI);
    this.#db = this.#client.db();
    this.#flags = this.#db.collection('flags');
    this.#experiments = this.#db.collection('experiments');
    // this.environments = this.db.collection('environments');
  }

  /**
   * Turns a MongoDB Document into the corresponding object
   */
  _flagRecordToObject(document: WithId<Document>): FeatureFlag {
    const { _id, __v, ...rest } = document;
    const morphed: { id: string } & Document = { id: _id.toHexString(), ...rest };
    // console.log({morphed})
    return featureFlagSchema.parse(morphed);
  }

  /**
   * Turns a MongoDB Document into the corresponding object
   */
  _experimentRecordToObject(document: WithId<Document>): Experiment {
    const { _id, __v, ...rest } = document;
    const morphed: { id: string } & Document = { id: _id.toHexString(), ...rest };
    return experimentSchema.parse(morphed);
  }
  /**
   * Transforms an object to prepare it for insertion into MongoDB
   * Might be unnecessary
   */
  // _objectToRecord<T extends MongoTypes>(input: WithMongoStringId<T>): WithId<T> {
  //   const { id, ...rest } = input;
  //   const morphed = { _id: ObjectId.createFromHexString(id), ...rest };
  //   assert<WithId<T>>(morphed);
  //   return morphed;
  // }
  
  // for debugging
  _storedFlagCount() {
    const count = this.#flags.estimatedDocumentCount;
    console.log({ count });
    return count;
  }

  // for debugging
  _storedExperimentCount() {
    const count = this.#experiments.estimatedDocumentCount;
    console.log({ count });
    return count;
  }

  /**
   * Get up to `maxCount` feature flags, or all if not specified
   * @returns a possibly empty array of documents
   */
  async getFlags(maxCount?: number): Promise<FeatureFlag[]> {
    const resultCursor = this.#flags.find({});
    if (maxCount) resultCursor.limit(maxCount);
    const flagDocuments = await resultCursor.toArray();
    // console.log({ flagDocuments })
    const transformed = flagDocuments.map(this._flagRecordToObject);
    return transformed;
  }

  /**
   * @param documentId a hex string representing an ObjectId
   */
  async getFlag(documentId: string): Promise<FeatureFlag | null> {
    const docId = ObjectId.createFromHexString(documentId);
    const result = await this.#flags.findOne({ _id: docId });
    if (result === null) return result;
    return this._flagRecordToObject(result);
  }

  /**
   * Find a flag document from any of its properties. An empty object matches all documents.
   * To find by name, pass { name: <documentName> }
   * See https://www.mongodb.com/docs/drivers/node/current/fundamentals/crud/query-document/#std-label-node-fundamentals-query-document
   * @param query A MongoDB query
   */
  async findFlag(query: { [key: string]: unknown }): Promise<FeatureFlag | null> {
    const result = await this.#flags.findOne(query);
    if (result === null) return result;
    return this._flagRecordToObject(result);
  }
  /**
   * @returns a hex string representing the new record's ObjectId
   */
  async createFlag(flag: DraftRecord<FeatureFlag>): Promise<string | null> {
    if ('id' in flag) { // placeholder
      throw new Error(`Argument has id ${flag.id}, suggesting the record already exists`);
    }

    const result = await this.#flags.insertOne(flag);
    return result.insertedId?.toHexString() ?? null;
  }

  /**
   * Updates an existing flag
   * @returns a hex string representing the updated record's ObjectId,
   * or null if no record was updated
   */
  async updateFlag(flag: WithMongoStringId<FeatureFlag>): Promise<string | null> {
    const { id, ...updates } = flag;
    const result = await this.#flags.updateOne({ _id: ObjectId.createFromHexString(id)}, updates);
    return result.upsertedId?.toHexString() ?? null;
  }

  /**
   * Deletes an existing flag
   * @returns true if a record was deleted, or false otherwise
   */
  async deleteFlag(documentId: string): Promise<boolean> {
    const filter = { _id: ObjectId.createFromHexString(documentId)};
    const result = await this.#flags.deleteOne(filter);
    return result.deletedCount === 1;
  }

  /**
   * Get up to `maxCount` experiments, or all if not specified
   */
  async getAllExperiments(maxCount?: number) {
    const resultCursor = this.#experiments.find();
    if (maxCount) resultCursor.limit(maxCount);
    const expDocuments = await resultCursor.toArray();
    const transformed = expDocuments.map(this._experimentRecordToObject);
    return transformed;
  }

  /**
   * @param documentId a hex string representing an ObjectId
   */
  async getExperiment(documentId: string): Promise<Experiment | null> {
    const docId = ObjectId.createFromHexString(documentId);
    const result = await this.#experiments.findOne({ _id: docId });
    if (result === null) return result;
    return this._experimentRecordToObject(result);
  }

  /**
   * @returns a hex string representing the new record's ObjectId
   */
  async createExperiment(experiment: Experiment): Promise<string | null> {
    if ('id' in experiment) {
      throw new Error(`Argument has id ${experiment.id}, suggesting the record already exists`);
    }

    const result = await this.#experiments.insertOne(experiment);
    return result.insertedId?.toHexString() ?? null;
  }

  /**
   * Updates an existing experiment
   * @returns a hex string representing the updated record's ObjectId,
   * or null if no record was updated
   */
  async updateExperiment(experiment: WithMongoStringId<Experiment>): Promise<string | null> {
    const { id, ...updates } = experiment;
    const result = await this.#experiments.updateOne({ _id: ObjectId.createFromHexString(id)}, updates);
    return result.upsertedId?.toHexString() ?? null;
  }

  /**
   * Deletes an existing experiment
   * @returns true if a record was deleted, or false otherwise
   */
  async deleteExperiment(documentId: string): Promise<boolean> {
    const filter = { _id: ObjectId.createFromHexString(documentId)};
    const result = await this.#experiments.deleteOne(filter);
    return result.deletedCount === 1;
  }
}

// placeholder
// const db = new MongoAPI(env.MONGO_TESTING_URI);
// const xformResult = db._flagRecordToObject({ _id: ObjectId.createFromHexString('672554f934265b61cb05d5cf'), name: 'example record' });
// console.log({xformResult})

