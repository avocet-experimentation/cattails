import { MongoClient, ObjectId, Document, WithId, Collection, Db } from 'mongodb';
import envConfig from '../envConfig.js';
import { Experiment } from '../experiments/experiments.types.js';
import { FFlag } from '../fflags/fflags.types.js';

/*
- ObjectID() doc: https://mongodb.github.io/node-mongodb-native/Next/classes/BSON.ObjectId.html
*/

/**
 * CRUD individual environments, featureFlags and experiments
 * Read all from one collection (later: paginate)
 * Transform records
 * 
 * todo:
 * - method implementations
 * - write environment type
 * - add runtime validation of fetched documents
 * - document types calculated from their standard types
 * - update property definitions to match document types
 */
export default class MongoAPI {
  #client: MongoClient;
  #db: Db;
  #flags: Collection<FFlag>;
  #experiments: Collection<Experiment>;
  // environments: Collection<Environment>;

  constructor() {
    this.#client = new MongoClient(envConfig.MONGO_CONNECTION_STRING);
    this.#db = this.#client.db()
    this.#flags = this.#db.collection('flags');
    this.#experiments = this.#db.collection('experiments');
    // this.environments = this.db.collection('environments');
    try {
      this.#client.connect();
    } catch(e: unknown) {
      if (e instanceof Error) {
        console.error(e);
      }
    }
  }

  transform<T>(input: WithId<Document>): T {
    const { _id, __v, ...rest } = input;
    const morphed = { id: _id, ...rest };
    assert<T>(morphed);
    return morphed;
  }

  _storedFlags() { // for debugging
    const count = this.#flags.estimatedDocumentCount;
    console.log({ count });
    return count;
  }

  _storedExperiments() { // for debugging
    const count = this.#experiments.estimatedDocumentCount;
    console.log({ count });
    return count;
  }
  /**
   * Get up to `maxCount` feature flags, or all if not specified
   */
  async getAllFlags(maxCount?: number) {
    const resultCursor = this.#flags.find();
    if (maxCount) resultCursor.limit(maxCount);
    return resultCursor.toArray();
  }

  /**
   * @param documentId a MongoDB ObjectId serialized to hex string
   */
  async getFlag(documentId: string) {
    const docId = ObjectId.createFromHexString(documentId);
    const result = await this.#flags.findOne({ _id: docId });
    return result;
  }

  /**
   * Insert a new flag into the database
   * @param flag a Feature Flag object
   * @returns A hex string representation of the new record's Object ID
   */
  async insertFlag(flag: FFlag): Promise<string> {
    const result = await this.#flags.insertOne(flag);
    return result.insertedId.toHexString();
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
   * @param documentId a MongoDB ObjectId serialized to hex string
   */
  async getExperiment(documentId: string) {
    const docId = ObjectId.createFromHexString(documentId);
    const result = await this.#experiments.findOne({ _id: docId });
    return result;
  }
}