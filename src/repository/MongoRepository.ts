import {
  ObjectId,
  Collection,
  Filter,
  OptionalUnlessRequiredId,
  PushOperator,
  PullOperator,
  MatchKeysAndValues,
  WithId,
  WithTransactionCallback,
  UpdateResult,
} from 'mongodb';
import merge from 'deepmerge';
import {
  EstuarySchema,
  EstuaryMongoCollectionName,
  BeforeId,
  EstuaryMongoTypes,
  getPartialSchema,
  schemaOmit,
  DraftRecord,
  DocumentUpdateFailedError,
  DocumentNotFoundError,
  SchemaParseError,
  RequireOnly,
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
export default class MongoRepository<T extends EstuaryMongoTypes> {
  manager: RepositoryManager;
  collection: Collection<BeforeId<T>>;
  schema: EstuarySchema<T>;

  constructor(collectionName: EstuaryMongoCollectionName, schema: EstuarySchema<T>, repositoryManager: RepositoryManager) {
    this.manager = repositoryManager;
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
      const value = obj[key];
      return typeof value === 'string' && value.length === 0;
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
    const result = await this._withTransaction(async (session) => {
        const insertResult = await this.collection.insertOne(validated);
        // console.log({insertResult})
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
      });

    return result;
  }
  /**
   * A placeholder to be overridden on sub-classes
   */
  async _createEmbeds(newDocument: T): Promise<boolean> {
    return true;
  }

  /**
   * Get up to `maxCount` documents, or all if not specified
   * @returns a possibly empty array of documents
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
   * To find by name, pass { name: documentName }
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
   * Updates an existing record. Will be removed once the new implementation is validated.
   * @returns true if a record was updated, or false otherwise
   */
  // async updateOld(partialEntry: PartialWithStringId<T>): Promise<boolean> {
  //   const validated = this._validateUpdate(partialEntry);
  //   // if (validated === null) return null;

  //   const { id, ...rest } = validated;
  //   const updates = { ...rest, updatedAt: Date.now() };
  //   const filter = { _id: ObjectId.createFromHexString(id) } as Filter<BeforeId<T>>;
  //   const result = await this.collection.updateOne(filter, [{ $set: updates }]);
  //   return result.acknowledged;
  // }
  /**
   * Updates an existing record
   * @returns true if the update request was successful, or throws otherwise
   */
  async update(partialEntry: PartialWithStringId<T>): Promise<boolean> {
    const validated = this._validateUpdate(partialEntry);
    // if (validated === null) return null;

    const { id, ...rest } = validated;
    const updates = { ...rest, updatedAt: Date.now() };
    const filter = { _id: ObjectId.createFromHexString(id) } as Filter<BeforeId<T>>;
    // const result = await this.collection.updateOne(filter, [{ $set: updates }]);
    const result = this._withTransaction(async (session) => {
      const updateResult = await this.collection.updateOne(filter, [{ $set: updates }]);
      if (!updateResult.acknowledged) {
        await session.abortTransaction();
        throw new DocumentUpdateFailedError(`Failed to update document ${id}`);
      }

      const embedResult = await this._updateEmbeds(validated);
      if (!embedResult) {
        await session.abortTransaction();
        throw new DocumentUpdateFailedError(`Failed to update embeds for document ${id}`);
      }

      return true;
    });

    return result;
  }

  async _updateEmbeds(partialEntry: PartialWithStringId<T>): Promise<boolean> {
    return true;
  }
  /**
   * Updates the passed key on a record, if it exists. Fetches the document and
   * validates it with the updates against the schema before attempting to update.
   * @param keyPath a dot-separated string representing successively nested keys
   * @returns `true` if a record was updated, `null` if the keyPath 
   * or newValue is invalid, or `false` otherwise
   */
  async updateKeySafe(
    id: string,
    keyPath: string,
    newValue: unknown,
  ): Promise<boolean | null> {
    if (keyPath.length === 0) return null;
    const parsed = this._keyPathToObject(keyPath, newValue);
    const original = await this.get(id);
    if (!original) return null;

    const merged = merge(original, parsed);
    const validated = this._validateUpdate(merged);
    if (validated === null) return null;

    const { id: _, ...rest } = validated;
    const updates = { ...rest, updatedAt: Date.now() };

    const filter = {
      _id: ObjectId.createFromHexString(id),
      [keyPath]: { $exists: true }
    } as Filter<BeforeId<T>>;

    const result = await this.collection.updateOne(filter, [{ $set: updates }]);
    return result.acknowledged;
  }
  /**
   * Pushes to an array within all matching records
   * @param matcher a partial document to filter by, or an array of them
   * @returns the update result. Check .acknowledged to verify it succeeded
   */
  async push(
    keyPath: string,
    newEntry: Record<string, any>,
    matcher: Filter<T>
  ): Promise<UpdateResult<T>> {
    const op = { [keyPath]: newEntry } as PushOperator<BeforeId<T>>;

    const filter = {
      ...matcher,
      [keyPath]: { $exists: true }
    } as Filter<BeforeId<T>>;

    const result = await this.collection.updateMany(filter, { $push: op });
    return result;
  }

  /**
   * Pushes to an array on a document with the passed id
   */
  async pushTo(
    keyPath: string,
    newEntry: Record<string, any>,
    documentId: string,
  ): Promise<UpdateResult<T>> {
    const matcher = { _id: ObjectId.createFromHexString(documentId) } as Filter<T>;
    return this.push(keyPath, newEntry, matcher);
  }
  
  /**
   * Removes an element from an array within all matching records
   * @param [documentMatcher={}] a partial document to filter by, or an array of them
   * @returns the updateResult
   */
  async pull(
    keyPath: string,
    toDeleteMatcher: Record<string, any>,
    documentMatcher: Filter<T> = {},
  ): Promise<UpdateResult<T>> {
    const op = { [keyPath]: toDeleteMatcher } as PullOperator<BeforeId<T>>;
  
    const filter = {
      ...documentMatcher,
      [keyPath]: { $exists: true }
    } as Filter<BeforeId<T>>;
      
    const result = await this.collection.updateMany(filter, { $pull: op });
    return result;
  }
  /**
   * Pulls from an array on a document with the passed id
   */
  async pullFrom(
    keyPath: string,
    toDelete: Record<string, any>,
    documentId: string,
  ): Promise<UpdateResult<T>> {
    const matcher = { _id: ObjectId.createFromHexString(documentId) } as Filter<T>;
    return this.pull(keyPath, toDelete, matcher);
  }
  
  /**
   * (WIP) Updates an element on an array inside a record
   * @param searchObj An object of properties to filter elements by
   * @param updateObj A partial object of properties to overwrite on the 
   * @returns true if the query was successful
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
    return result.acknowledged;
  }
  /**
   * Deletes an existing record
   * @returns true if a record was deleted, or throws otherwise
   */
  async delete(documentId: string): Promise<boolean> {
    const filter = { _id: ObjectId.createFromHexString(documentId)};
    const result = this._withTransaction(async (session) => {
      // const existingDocument = await this.get(documentId);
      const deleteResult = await this.collection.deleteOne(filter as Filter<BeforeId<T>>);
      if (!deleteResult.deletedCount) {
        throw new DocumentUpdateFailedError(
          `Failed to delete document with id ${documentId}`
        );
      }

      const embedDeleteResult = await this._deleteEmbeds(documentId);
      if (!embedDeleteResult) {
        await session.abortTransaction();
        throw new DocumentUpdateFailedError(
          `Failed to delete embeds for document with id ${documentId}`
        );

      }
      return embedDeleteResult;
    });

    return result;
  }

  /**
   * A placeholder to be overridden on sub-classes
   */
  async _deleteEmbeds(documentId: string): Promise<boolean> {
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

  async _withTransaction<R = any>(cb: WithTransactionCallback<R>): Promise<R> {
    return this.manager.client.withSession(async (session) => session.withTransaction(cb));
  }
}
