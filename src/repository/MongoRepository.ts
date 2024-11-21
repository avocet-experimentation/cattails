import {
  MongoClient,
  ObjectId,
  Collection,
  Db,
  Filter,
  OptionalUnlessRequiredId,
  PushOperator,
  PullOperator,
  MatchKeysAndValues,
  WithId,
  WithSessionCallback,
} from 'mongodb';
import merge from 'deepmerge';
import {
  EstuarySchema,
  EstuaryMongoCollectionName,
  BeforeId,
  EstuaryMongoTypes,
  AnyZodSchema,
  getPartialSchema,
  schemaOmit,
  DraftRecord,
  DocumentUpdateFailedError,
  DocumentNotFoundError,
  SchemaParseError,
  RequireOnly,
  estuaryMongoCollectionNameSchema,
} from '@estuary/types';
import RepositoryManager from './RepositoryManager.js';

/* TYPE DEFINITIONS FOR WORKING WITH MONGO RECORDS */


export type MongoRecord<T extends EstuaryMongoTypes> = WithId<BeforeId<T>>;
/**
 * A partial type that only requires an `id` field
 */
export type PartialWithStringId<T extends EstuaryMongoTypes> = RequireOnly<T, 'id'>;

/**
 * Parent class for type-specific CRUD operations in Mongo. 
 * Use subclasses instead of instantiating this directly.
 * 
 * todo:
 * - solve filter type problem and remove the `as Filter...` assertions
 * - narrow the type of EstuaryObjectSchema so that it is recognized as an object type
 */
export default class MongoRepository<T extends EstuaryMongoTypes, S extends EstuarySchema<T> = EstuarySchema<T>> {
  repository: RepositoryManager;
  collection: Collection<BeforeId<T>>;
  schema: AnyZodSchema;

  constructor(collectionName: EstuaryMongoCollectionName, schema: S, repositoryManager: RepositoryManager) {
    this.repository = repositoryManager;
    this.collection = repositoryManager.client.db().collection(collectionName);
    this.schema = schema;
  }

  _recordToObject(document: MongoRecord<T>): T {
    const { _id, ...rest } = document;
    const morphed = { id: document._id.toHexString(), ...rest };
    return morphed as unknown as T; // todo: find a better solution for type checking without throwing
  }

  _validateNew(obj: object): OptionalUnlessRequiredId<BeforeId<T>> {
    if ('id' in obj) {
      throw new TypeError('Attempted to create a document from an object that ' + 
        'contains an id field! Does this document already exist?');
      // return null;
    }

    const schemaWithoutId = schemaOmit(this.schema, ['id']);
    const safeParseResult = schemaWithoutId.safeParse(obj);

    if (!safeParseResult.success) {
      throw new SchemaParseError(safeParseResult);
      // console.error(safeParseResult.error.format());
      // return null; 
    }
    const parsed = safeParseResult.data;

    if (this._holdsEmptyString(parsed, 'name')) {
      throw new TypeError('Attempted to create an object with an empty name!');
      // return null;
    }

    const { id, ...validated } = safeParseResult.data;
    return validated;
  }

  _validateUpdate<U extends PartialWithStringId<T>>(obj: object): U {
    if (!('id' in obj) || typeof obj.id !== 'string') {
      throw new TypeError('Attempted to update a document without including an id field!');
    }

    const safeParseResult = getPartialSchema(this.schema).safeParse(obj);

    if (!safeParseResult.success) { 
      throw new SchemaParseError(safeParseResult);
    }

    const parsed = safeParseResult.data;

    if (this._holdsEmptyString(parsed, 'name')) {
      throw new TypeError('Attempted to set an empty name!');
    }

    return parsed;
  }

  _holdsEmptyString(obj: Record<string, unknown>, key: string): boolean {
    if (key in obj) {
      return typeof obj[key] === 'string' && obj[key].length === 0;
    } else return false;
  }
  /**
   * @returns a hex string representing the new record's ObjectId
   */
  async create(newEntry: DraftRecord<T>): Promise<string> {
    const withTimeStamps = {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...newEntry,
    }
    const validated = this._validateNew(withTimeStamps);
    const result = await this.repository.client.withSession(async (session) => session
      .withTransaction(async (session) => {
        const insertResult = await this.collection.insertOne(validated);
        if (!insertResult.insertedId) {
          await session.abortTransaction();
          throw new DocumentUpdateFailedError('Failed to insert new document');
        }

        const insertId = insertResult.insertedId.toHexString();
        const insertedEntry = await this.get(insertId);

        const embedResult = await this._createEmbeds(insertedEntry);
        if (!embedResult) {
          await session.abortTransaction();
          throw new DocumentUpdateFailedError(`Failed to add embeds for document ${insertId}`);
        }

        return insertId;
      }));

    return result;
  }
  /**
   * A placeholder to be overridden on sub-classes
   * @returns true if the embed was successful, `null` if schema validation failed,
   * or false otherwise
   */
  async _createEmbeds(newDocument: T): Promise<boolean> {
    return true;
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
  async get(documentId: string): Promise<T> {
    const docId = ObjectId.createFromHexString(documentId);
    // seems like Filter doesn't infer correctly on generics
    const result = await this.findOne({ _id: docId } as Filter<BeforeId<T>>);
    if (result === null) throw new DocumentNotFoundError({ _id: docId });
    return result;
  }
  /**
   * Find a document from any of its properties. An empty object matches the first document.
   * To find by name, pass { name: <documentName> }
   * See https://www.mongodb.com/docs/drivers/node/current/fundamentals/crud/query-document/#std-label-node-fundamentals-query-document
   * @param query A MongoDB query
   */
  async findOne<Q extends Filter<BeforeId<T>>>(query: Q): Promise<T | null> {
    const result = await this.collection.findOne(query);
    if (result === null) return null;

    return this._recordToObject(result);
  }
  /**
   * Find all document matching a query object. An empty object matches all documents.
   * To find by name, pass { name: <documentName> }
   * See https://www.mongodb.com/docs/drivers/node/current/fundamentals/crud/query-document/#std-label-node-fundamentals-query-document
   * @param query A MongoDB query
   */
  async findMany(query: Filter<BeforeId<T>>, maxCount?: number): Promise<T[]> {
    const resultCursor = this.collection.find(query);
    if (maxCount) resultCursor.limit(maxCount);
    const records = await resultCursor.toArray();
    return records.map(this._recordToObject, this);
  }
  /**
   * Updates an existing record
   * @returns true if a record was updated, or false otherwise
   */
  async update(partialEntry: PartialWithStringId<T>): Promise<boolean> {
    const validated = this._validateUpdate(partialEntry);
    // if (validated === null) return null;

    const { id, ...rest } = validated;
    const updates = { ...rest, updatedAt: Date.now() };
    const filter = { _id: ObjectId.createFromHexString(id) } as Filter<BeforeId<T>>;
    const result = await this.collection.updateOne(filter, [{ $set: updates }]);
    return result.modifiedCount > 0;
  }
  /**
   * Updates the passed key on a record, if it exists. Fetches the document and
   * validates it with the updates against the schema before attempting to update.
   * @returns `true` if a record was updated, `null` if the keyPath 
   * or newValue is invalid, or `false` otherwise
   */
  async updateKeySafe(
    id: string,
    keyPath: string,
    newValue: unknown,
  ): Promise<boolean | null> {
    if (keyPath.length === 0) return null;
    // transform the updates into an object of nested properties
    const parsed = this._keyPathToObject(keyPath, newValue);
    // console.log({parsed})
    const original = await this.get(id);
    if (!original) return null;

    const merged = merge(original, parsed);
    // console.log({merged})
    const validated = this._validateUpdate(merged);
    if (validated === null) return null;

    const { id: _, ...rest } = validated;
    const updates = { ...rest, updatedAt: Date.now() };

    const filter = {
      _id: ObjectId.createFromHexString(id),
      [keyPath]: { $exists: true }
    } as Filter<BeforeId<T>>;

    const result = await this.collection.updateOne(filter, [{ $set: updates }]);
    return result.modifiedCount > 0;
  }
  /**
   * Updates the passed key on a record, if it exists. Use with caution, as it
   *  could result in invalid schema! Try `updateKeySafe` first.
   * @returns `true` if a record was updated, `null` if the keyPath 
   * or newValue is invalid, or `false` otherwise
   */
  private async updateKey(
    id: string,
    keyPath: string,
    newValue: unknown,
  ): Promise<boolean> {
    const updates = { [keyPath]: newValue } as MatchKeysAndValues<BeforeId<T>>;
    // transform the updates into an object of nested properties
    // fetch the original document
    // create an updated document of WithId<T> and validate the schema safely, returning null if it fails
    // else call this.update
    const filter = {
      _id: ObjectId.createFromHexString(id),
      [keyPath]: { $exists: true }
    } as Filter<BeforeId<T>>;
    const result = await this.collection.updateOne(filter, { $set: updates });
    return result.modifiedCount > 0;
  }
  /**
   * Pushes to an array within a record
   * @returns true if a record was updated, or false otherwise
   */
  async push(id: string, keyPath: string, newEntry: unknown) {
    const op = { [keyPath]: newEntry } as PushOperator<BeforeId<T>>;

    const filter = {
      _id: ObjectId.createFromHexString(id),
      [keyPath]: { $exists: true }
    } as Filter<BeforeId<T>>;

    const result = await this.collection.updateOne(filter, { $push: op });
    return result.modifiedCount > 0;
  }
  /**
   * Removes an element from an array within a record
   * @returns true if a record was updated, or false otherwise
   */
  async pull(id: string, keyPath: string, toDelete: unknown) {
    const filter = {
      _id: ObjectId.createFromHexString(id),
      [keyPath]: { $exists: true }
    } as Filter<BeforeId<T>>;
    
    const op = { [keyPath]: toDelete } as PullOperator<BeforeId<T>>;
    const result = await this.collection.updateOne(filter, { $pull: op });
    return result.modifiedCount > 0;
  }
  /**
   * (WIP) Updates an element on an array inside a record
   * @param searchObj An object of properties to filter elements by
   * @param updateObj A partial object of properties to overwrite on the 
   * @returns true if a record was updated, or false otherwise
   */
  async updateElement(id: string, keyPath: string, searchObj: PartialWithStringId<T>, updateObj: object) {
    const validated = this._validateUpdate(searchObj);
    if (validated === null) return null;
    
    const { id: _, ...rest } = validated;
    
    const filter = {
      _id: ObjectId.createFromHexString(id),
      ...rest,
      [keyPath]: { $exists: true }
    } as Filter<BeforeId<T>>;
    
    const op = { [`${keyPath}.$`]: updateObj } as MatchKeysAndValues<BeforeId<T>>;
    const result = await this.collection.updateOne(filter, { $set: op });
    return result.modifiedCount > 0;
  }
  /**
   * Deletes an existing record
   * @returns true if a record was deleted, or false otherwise
   */
  async delete(documentId: string): Promise<boolean> {
    const filter = { _id: ObjectId.createFromHexString(documentId)};
    const result = await this.collection.deleteOne(filter as Filter<BeforeId<T>>);
    if (!result.deletedCount) {
      throw new DocumentUpdateFailedError(`Failed to delete document with id ${documentId}`);
    }

    return true;
  }

  /**
   * Parses a key path string into an update object
   * @param keyPath A dot-separated string representing nested properties
   * @param newValue The value to assign to the parsed key
   */
  _keyPathToObject<V, T extends Record<string, T | V>>(keyPath: string, newValue: V) {
    const segments = keyPath.split('.');
    const accumulator = {} as T;
    let ptr = accumulator;
    const result = segments.reduce((acc, segment, i) => {
      const newInner = i === segments.length - 1 ? newValue : {};
      Object.assign(ptr, { [segment]: newInner });
      if (ptr[segment] !== newValue) {
        ptr = ptr[segment] as T;
      }

      return acc;
    }, accumulator);

    return result;
  }

  _getCollection(collectionName: EstuaryMongoCollectionName) {
    const validated = estuaryMongoCollectionNameSchema.parse(collectionName);
    return this.repository.client.db().collection(validated);
  }
  async _withSession<R = any>(cb: WithSessionCallback<R>): Promise<R> {
    return this.repository.client.withSession(cb);
  }
}
