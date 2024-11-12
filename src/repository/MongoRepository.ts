import { MongoClient, ObjectId, Document, Collection, Db, Filter, OptionalUnlessRequiredId } from 'mongodb';
import { EstuarySchema } from '@estuary/types';
import { EstuaryBaseTypes, MongoRecord, BeforeId, PartialUpdate } from './MongoRepository.types.js';

/**
 * Parent class for type-specific CRUD operations in Mongo. 
 * Use subclasses instead of instantiating this directly.
 */
export default class MongoRepository<T extends EstuaryBaseTypes> {
  #client: MongoClient;
  #db: Db;
  schema: EstuarySchema<T>;
  collection: Collection<BeforeId<T>>;
  // environments: Collection<Environment>;

  constructor(collectionName: string, schema: EstuarySchema<T>, mongoUri: string) {
    this.#client = new MongoClient(mongoUri);
    this.#db = this.#client.db();
    this.schema = schema;
    this.collection = this.#db.collection(collectionName);
    // this.environments = this.db.collection('environments');
    this._recordToObject = this._recordToObject.bind(this);
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
    // seems like Filter doesn't infer correctly on generics
    const result = await this.findOne({ _id: docId } as Filter<BeforeId<T>>);
    return result;
  }
  /**
   * Find a document from any of its properties. An empty object matches the first document.
   * To find by name, pass { name: <documentName> }
   * See https://www.mongodb.com/docs/drivers/node/current/fundamentals/crud/query-document/#std-label-node-fundamentals-query-document
   * @param query A MongoDB query
   */
  async findOne(query: Filter<BeforeId<T>>): Promise<T | null> {
    const result = await this.collection.findOne(query);
    if (result === null) return result;
    return this._recordToObject(result);
  }
  /**
   * Find all document matching a query object. An empty object matches all documents.
   * To find by name, pass { name: <documentName> }
   * See https://www.mongodb.com/docs/drivers/node/current/fundamentals/crud/query-document/#std-label-node-fundamentals-query-document
   * @param query A MongoDB query
   */
  async findMany(query: Filter<BeforeId<T>>, maxCount?: number): Promise<T[]> {
    const resultCursor = await this.collection.find(query);
    if (maxCount) resultCursor.limit(maxCount);
    const records = await resultCursor.toArray();
    // if (result === null) return result;
    return records.map(this._recordToObject);
  }
  /**
   * @returns a hex string representing the new record's ObjectId
   */
  async create(newEntry: OptionalUnlessRequiredId<BeforeId<T>>): Promise<string | null> {

    const result = await this.collection.insertOne({ ...newEntry });
    return result.insertedId?.toHexString() ?? null;
  }
  /**
   * Updates an existing record
   * @returns true if a record was updated, or false otherwise
   */
  async update(partialEntry: PartialUpdate<T>) {
    const { id, ...updates } = partialEntry;
    const filter = { _id: ObjectId.createFromHexString(id) } as Filter<BeforeId<T>>;
    const result = await this.collection.updateOne(filter, [{ $set: updates }]);
    return result.modifiedCount > 0;
  }
  /**
   * Deletes an existing record
   * @returns true if a record was deleted, or false otherwise
   */
  async delete(documentId: string): Promise<boolean> {
    const filter = { _id: ObjectId.createFromHexString(documentId)};
    const result = await this.collection.deleteOne(filter as Filter<BeforeId<T>>);
    return result.deletedCount === 1;
  }
  /**
   * Pushes to an array within a record
   * @returns true if a record was updated, or false otherwise
   */
  async push(pushUpdates: PartialUpdate<T>) {
    const { id, ...updates } = pushUpdates;
    const filter = { _id: ObjectId.createFromHexString(id) } as Filter<BeforeId<T>>;
    const result = await this.collection.updateOne(filter, [{ $push: updates }]);
    return result.modifiedCount > 0;
  }
  // /**
  //  * Removes an element from a record's array
  //  * @returns true if a record was updated, or false otherwise
  //  */
  // async pop(pushUpdates: PartialUpdate<T>) {
  //   const { id, ...updates } = pushUpdates;
  //   const filter = { _id: ObjectId.createFromHexString(id) } as Filter<BeforeId<T>>;
  //   const result = await this.collection.updateOne(filter, [{ $push: pushUpdates }]);
  //   return result.modifiedCount > 0;
  // }
}