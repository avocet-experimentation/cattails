import { MongoClient, ObjectId, Document, WithId, Collection, Db } from 'mongodb';
import { cast, MinLength, ReflectionClass, is, assert } from '@deepkit/type';
import env from '../envalid.js';
// import { Experiment } from '../experiments/experiments.types.js';
// import { FFlag } from '../fflags/fflags.types.js';
import { Experiment, FeatureFlag, MongoTypes, OverrideRule, WithMongoStringId } from './placeholderTypes.js';

/*
- ObjectID() doc: https://mongodb.github.io/node-mongodb-native/Next/classes/BSON.ObjectId.html

// mongoose options object:
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  authSource: "fflags",
  directConnection: true,
  autoIndex: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};
*/

/**
 * CRUD individual environments, featureFlags and experiments
 * Read all from one collection (later: paginate)
 * Transform records
 * 
 * todo:
 * - method implementations
 * - write environment type
 * - integrate mongoose options?
 * - add runtime validation of fetched documents
 * - document types calculated from their standard types
 * - update property definitions to match document types
 */
export default class MongoAPI {
  #client: MongoClient;
  #db: Db;
  #flags: Collection<FeatureFlag>;
  #experiments: Collection<Experiment>;
  // environments: Collection<Environment>;

  constructor(mongoUri?: string) {
    this.#client = new MongoClient(mongoUri ?? env.MONGO_URI);
    this.#db = this.#client.db();
    this.#flags = this.#db.collection('flags');
    this.#experiments = this.#db.collection('experiments');
    // this.environments = this.db.collection('environments');
    // try {
    //   this.#client.connect();
    // } catch(e: unknown) {
    //   if (e instanceof Error) {
    //     console.error(e);
    //   }
    // }
  }

  /**
   * Turns a MongoDB Document into the corresponding object
   */
  _RecordToObject<T extends MongoTypes>(document: WithId<Document>): FeatureFlag {
    const { _id, __v, ...rest } = document;
    const morphed: { id: string } & Document = { id: _id.toHexString(), ...rest };
    assert<FeatureFlag>(morphed);
    return morphed;
  }
  /**
   * Transforms an object to prepare it for insertion into MongoDB
   * Might be unnecessary
   */
  _objectToRecord<T extends MongoTypes>(input: WithMongoStringId<T>): WithId<T> {
    const { id, ...rest } = input;
    const morphed = { _id: ObjectId.createFromHexString(id), ...rest };
    assert<WithId<T>>(morphed);
    return morphed;
  }

  _storedFlagCount() { // for debugging
    const count = this.#flags.estimatedDocumentCount;
    console.log({ count });
    return count;
  }

  _storedExperimentCount() { // for debugging
    const count = this.#experiments.estimatedDocumentCount;
    console.log({ count });
    return count;
  }

  /**
   * Get up to `maxCount` feature flags, or all if not specified
   * @returns a possibly empty array of documents
   */
  async getAllFlags(maxCount?: number): Promise<FeatureFlag[]> {
    const resultCursor = this.#flags.find();
    if (maxCount) resultCursor.limit(maxCount);
    const flagDocuments = await resultCursor.toArray();
    const transformed = flagDocuments.map(this._RecordToObject<WithId<FeatureFlag>>);
    return transformed;
  }

  /**
   * @param documentId a hex string representing an ObjectId
   */
  async getFlag(documentId: string): Promise<FeatureFlag | null> {
    const docId = ObjectId.createFromHexString(documentId);
    const result = await this.#flags.findOne({ _id: docId });
    if (result === null) return result;
    return this._RecordToObject<FeatureFlag>(result);
  }

  /**
   * @returns a hex string representing the new record's ObjectId
   */
  async createFlag(flag: FeatureFlag): Promise<string | null> {
    if ('id' in flag) {
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
   * @returns true if a flag was deleted, or false otherwise
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
    return resultCursor.toArray();
  }

  /**
   * @param documentId a hex string representing an ObjectId
   */
  async getExperiment(documentId: string) {
    const docId = ObjectId.createFromHexString(documentId);
    const result = await this.#experiments.findOne({ _id: docId });
    return result;
  }
}

// placeholder
const db = new MongoAPI(env.MONGO_TESTING_URI);
db._RecordToObject({ _id: ObjectId.createFromHexString('672554f934265b61cb05d5cf'), name: 'example record' });