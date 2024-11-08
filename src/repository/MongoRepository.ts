import { MongoClient, ObjectId, Document, Collection, Db, Filter } from 'mongodb';
import env from '../envalid.js';
import { EstuarySchema } from '@estuary/types';
import { EstuaryBaseTypes, MongoRecord, BeforeId, PartialUpdate } from './MongoRepository.types.js';

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
 * Parent class for type-specific CRUD operations in Mongo
 * Transform records
 * 
 * todo:
 * - fix filter type
 * - extend for client-facing record access (and override transform to return ClientData)
 * - generalize method implementations
 * - create read-only Mongo account for client-facing MongoRepo subclass
 * - add environments
 * - integrate mongoose options?
 * - paginate find/getAll?
 */
export default class MongoRepository<T extends EstuaryBaseTypes> {
  #client: MongoClient;
  #db: Db;
  schema: EstuarySchema<T>;
  collection: Collection<MongoRecord<T>>;
  // environments: Collection<Environment>;

  constructor(collectionName: string, schema: EstuarySchema<T>, mongoUri?: string) {
    this.#client = new MongoClient(mongoUri ?? env.MONGO_URI);
    this.#db = this.#client.db();
    this.schema = schema;
    this.collection = this.#db.collection(collectionName);
    // this.environments = this.db.collection('environments');
  }

  /**
   * Turns a MongoDB Document into the corresponding object
   */
  _recordToObject(document: MongoRecord<T>): T {
    // const { _id, __v, ...rest } = document;
    const { _id, ...rest } = document;
    const morphed: { id: string } & Document = { id: _id.toHexString(), ...rest };
    // console.log({morphed})
    return this.schema.parse(morphed);
  }

  /**
   * Transforms an object to prepare it for insertion into MongoDB
   * Might be unnecessary
   */
  // _objectToRecord(input: WithMongoStringId<T>): WithId<T> {
  //   const { id, ...rest } = input;
  //   const morphed = { _id: ObjectId.createFromHexString(id), ...rest };
  //   assert<WithId<T>>(morphed);
  //   return morphed;
  // }
  
  // for debugging
  async _storedDocumentCount() {
    const count = await this.collection.estimatedDocumentCount();
    console.log(`${count} records in '${this.collection.collectionName}' collection`);
    return count;
  }

  /**
   * Get up to `maxCount` documents, or all if not specified
   * @returns a possibly empty array of documents
   * Change this to take an array of IDs?
   */
  async getMany(maxCount?: number): Promise<T[]> {
    const resultCursor = this.collection.find({});
    if (maxCount) resultCursor.limit(maxCount);
    const documents = await resultCursor.toArray();
    const transformed = documents.map((doc) => this._recordToObject(doc));
    return transformed;
  }

  /**
   * @param documentId a hex string representing an ObjectId
   */
  async get(documentId: string): Promise<T | null> {
    const docId = ObjectId.createFromHexString(documentId);
    const query: Filter<MongoRecord<T>> = { _id: docId } as Filter<MongoRecord<T>>; // placeholder - seems like Filter doesn't infer correctly on generics
    const result = await this.find(query);
    if (result === null) return result;
    return this._recordToObject(result);
  }

  /**
   * Find a flag document from any of its properties. An empty object matches all documents.
   * To find by name, pass { name: <documentName> }
   * See https://www.mongodb.com/docs/drivers/node/current/fundamentals/crud/query-document/#std-label-node-fundamentals-query-document
   * @param query A MongoDB query
   */
  async find(query: Filter<MongoRecord<T>>): Promise<T | null> {
    const result = await this.collection.findOne(query);
    if (result === null) return result;
    return this._recordToObject(result);
  }

  async findMatchingFlags(query: Filter<MongoRecord<T>>): Promise<T[]> {
    const result = await this.collection.find(query);
    const docs = await result.toArray();
    return docs.map(this._recordToObject);
  }
  /**
   * @returns a hex string representing the new record's ObjectId
   */
  async createFlag(flag: BeforeId<T>): Promise<string | null> {
    if ('id' in flag) { // placeholder
      throw new Error(`Argument has id ${flag.id}, suggesting the record already exists`);
    }

    const result = await this.collection.insertOne(flag);
    return result.insertedId?.toHexString() ?? null;
  }

  /**
   * Updates an existing record
   * @returns a hex string representing the updated record's ObjectId,
   * or null if no record was updated
   */
  async update(flag: PartialUpdate<T>): Promise<string | null> {
    const { id, ...updates } = flag;
    const result = await this.collection.updateOne({ _id: ObjectId.createFromHexString(id)}, updates);
    return result.upsertedId?.toHexString() ?? null;
  }

  /**
   * Deletes an existing flag
   * @returns true if a record was deleted, or false otherwise
   */
  async deleteFlag(documentId: string): Promise<boolean> {
    const filter = { _id: ObjectId.createFromHexString(documentId)};
    const result = await this.collection.deleteOne(filter);
    return result.deletedCount === 1;
  }
}

// example usage
// const db = new MongoAPI(env.MONGO_TESTING_URI);
// const xformResult = db._flagRecordToObject({ _id: ObjectId.createFromHexString('672554f934265b61cb05d5cf'), name: 'example record' });
// console.log({xformResult})

