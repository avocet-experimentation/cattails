import {
  MongoClient,
  ObjectId,
  Collection,
  Db,
  Filter,
  OptionalUnlessRequiredId,
  WithId,
} from 'mongodb';
import {
  EstuarySchema,
  EstuaryMongoCollectionName,
  BeforeId,
  EstuaryMongoTypes,
  RequireOnly,
  AnyZodSchema,
  getPartialSchema,
  schemaOmit,
} from '@estuary/types';

/* TYPE DEFINITIONS FOR WORKING WITH MONGO RECORDS */

export type MongoRecord<T extends EstuaryMongoTypes> = WithId<BeforeId<T>>;

// temporary/WIP
// type findFilter<T extends InferFromSchema> = { [P in keyof WithId<T>]?: Condition<WithId<T>[P]> | undefined; };


/**
 * Parent class for type-specific CRUD operations in Mongo. 
 * Use subclasses instead of instantiating this directly.
 * 
 * todo:
 * - solve filter type problem and remove the `as Filter...` assertions
 * - narrow the type of EstuaryObjectSchema so that it is recognized as an object type
 */
export default class MongoRepository<T extends EstuaryMongoTypes, S extends EstuarySchema<T>> {
  #client: MongoClient;
  #db: Db;
  collection: Collection<BeforeId<T>>;
  schema: AnyZodSchema;

  constructor(collectionName: EstuaryMongoCollectionName, schema: S, mongoUri: string) {
    this.#client = new MongoClient(mongoUri);
    this.#db = this.#client.db();
    this.collection = this.#db.collection(collectionName);
    this.schema = schema;
    // this._recordToObject = this._recordToObject.bind(this); // might remove
  }

  _recordToObject(document: MongoRecord<T>): T {
    const { _id, ...rest } = document;
    const morphed = { id: document._id.toHexString(), ...rest };
    return morphed as unknown as T; // todo: find a better solution for type checking without throwing
    // const safeParseResult = this.schema.safeParse(morphed);
    // if (safeParseResult.success) {
    //   return safeParseResult.data;
    // } else {
    //   console.error(safeParseResult.error);
    //   return morphed as unknown as T; 
    // }
  }

  _validateNew<O extends OptionalUnlessRequiredId<BeforeId<T>>>(obj: O): O | null {
    if ('id' in obj) {
      console.error('Attempted to create a document from an object that contains an id field! Does this document already exist?');
      return null;
    }
    const schemaWithoutId = schemaOmit(this.schema, ['id']);
    const safeParseResult = schemaWithoutId.safeParse(obj);

    if (!safeParseResult.success) { 
      console.error(safeParseResult.error);
      return null; 
    }

    const { id, ...validated } = safeParseResult.data;
    return validated;
  }

  _validateUpdate<U extends RequireOnly<T, 'id'>>(obj: U): U | null {
    if (!('id' in obj) || typeof obj.id !== 'string') {
      console.error('Attempted to update a document without including an id field!');
      return null;
    }
    // const restOptional = schemaRequireOnly(this.schema, ['id']);
    const safeParseResult = getPartialSchema(this.schema).safeParse(obj);

    if (!safeParseResult.success) { 
      console.error(safeParseResult.error);
      return null; 
    }

    return safeParseResult.data;
  }
  /**
   * @returns a hex string representing the new record's ObjectId
   */
  async create(newEntry: OptionalUnlessRequiredId<BeforeId<T>>): Promise<string | null> {
    const validated = this._validateNew(newEntry);
    if (validated === null) return null;
    const result = await this.collection.insertOne(validated);
    return result.insertedId?.toHexString() ?? null;
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
    const transformed = documents.map((doc) => this._recordToObject(doc), this);
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
    return records.map(this._recordToObject, this);
  }
  /**
   * Updates an existing record
   * @returns true if a record was updated, null if the object type is invalid, or false otherwise
   */
  async update(partialEntry: RequireOnly<T, 'id'>): Promise<boolean | null> {
    const validated = this._validateUpdate(partialEntry);
    if (validated === null) return null;
    const { id, ...updates } = validated;
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
  // /**
  //  * Pushes to an array within a record
  //  * @returns true if a record was updated, or false otherwise
  //  */
  // async push(pushUpdates: RequireOnly<T, 'id'>) {
  //   const { id, ...updates } = pushUpdates;
  //   const filter = { _id: ObjectId.createFromHexString(id) } as Filter<BeforeId<T>>;
  //   const result = await this.collection.updateOne(filter, [{ $push: updates }]);
  //   return result.modifiedCount > 0;
  // }
  // /**
  //  * Removes an element from a record's array
  //  * @returns true if a record was updated, or false otherwise
  //  */
  // async pop(pushUpdates: RequireOnly<T, 'id'>) {
  //   const { id, ...updates } = pushUpdates;
  //   const filter = { _id: ObjectId.createFromHexString(id) } as Filter<BeforeId<T>>;
  //   const result = await this.collection.updateOne(filter, [{ $push: pushUpdates }]);
  //   return result.modifiedCount > 0;
  // }
}