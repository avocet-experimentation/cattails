/* eslint-disable class-methods-use-this */
import {
  ObjectId,
  Collection,
  Filter,
  OptionalUnlessRequiredId,
  PushOperator,
  PullOperator,
  MatchKeysAndValues,
  WithTransactionCallback,
  UpdateResult,
  UpdateFilter,
} from 'mongodb';
import merge from 'deepmerge';
import {
  AvocetSchema,
  AvocetMongoCollectionName,
  BeforeId,
  AvocetMongoTypes,
  getPartialSchema,
  schemaOmit,
  DraftRecord,
  DocumentUpdateFailedError,
  DocumentNotFoundError,
  SchemaParseError,
} from '@avocet/core';
// eslint-disable-next-line import/no-cycle
import {
  IRepositoryManager,
  MongoRecord,
  PartialWithStringId,
} from './repository-types.js';

/**
 * Parent class for type-specific CRUD operations in Mongo.
 * Use subclasses instead of instantiating this directly.
 *
 * todo:
 * - solve filter type problem and remove the `as Filter...` assertions
 */
export default class MongoRepository<T extends AvocetMongoTypes> {
  manager: IRepositoryManager;

  collection: Collection<BeforeId<T>>;

  schema: AvocetSchema<T>;

  constructor(
    collectionName: AvocetMongoCollectionName,
    schema: AvocetSchema<T>,
    repositoryManager: IRepositoryManager,
  ) {
    this.manager = repositoryManager;
    this.collection = repositoryManager.client.db().collection(collectionName);
    this.schema = schema;
  }

  protected recordToObject(document: MongoRecord<T>): T {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { _id, ...rest } = document;
    // eslint-disable-next-line no-underscore-dangle
    const morphed = { id: document._id.toHexString(), ...rest };
    // todo: find a better solution for type checking without throwing
    return morphed as unknown as T;
  }

  protected validateNew(obj: object): OptionalUnlessRequiredId<BeforeId<T>> {
    if ('id' in obj) {
      throw new TypeError(
        'Attempted to create a document from an object that '
          + 'contains an id field! Does this document already exist?',
      );
    }

    const schemaWithoutId = schemaOmit(this.schema, ['id']);
    const safeParseResult = schemaWithoutId.safeParse(obj);

    if (!safeParseResult.success) {
      throw new SchemaParseError(safeParseResult);
    }
    const parsed = safeParseResult.data;

    if (this.holdsEmptyString(parsed, 'name')) {
      throw new TypeError('Attempted to create an object with an empty name!');
    }

    const { id, ...validated } = safeParseResult.data;
    return validated;
  }

  protected validateUpdate<U extends PartialWithStringId<T>>(obj: object): U {
    if (!('id' in obj) || typeof obj.id !== 'string') {
      throw new TypeError(
        'Attempted to update a document without including an id field!',
      );
    }

    const safeParseResult = getPartialSchema(this.schema).safeParse(obj);

    if (!safeParseResult.success) {
      throw new SchemaParseError(safeParseResult);
    }

    const parsed = safeParseResult.data;

    if (this.holdsEmptyString(parsed, 'name')) {
      throw new TypeError('Attempted to set an empty name!');
    }

    return parsed;
  }

  protected holdsEmptyString<O extends object, K extends keyof O>(
    obj: O,
    key: K,
  ): boolean {
    if (key in obj) {
      const value = obj[key];
      return typeof value === 'string' && value.length === 0;
    }
    return false;
  }

  /**
   * @returns a hex string representing the new record's ObjectId
   */
  async create(newEntry: DraftRecord<T>): Promise<string> {
    const now = Date.now();
    const withTimeStamps = {
      createdAt: now,
      updatedAt: now,
      ...newEntry,
    };
    const validated = this.validateNew(withTimeStamps);
    const result = await this.withTransaction(async (session) => {
      const insertResult = await this.collection.insertOne(validated);
      if (!insertResult.insertedId) {
        await session.abortTransaction();
        throw new DocumentUpdateFailedError('Failed to insert new document');
      }

      const insertId = insertResult.insertedId.toHexString();
      const insertedEntry = await this.get(insertId);

      const embedResult = await this.createEmbeds(insertedEntry);
      if (!embedResult) {
        await session.abortTransaction();
        throw new DocumentUpdateFailedError(
          `Failed to add embeds for document ${insertId}`,
        );
      }

      return insertId;
    });

    return result;
  }

  /**
   * A placeholder to be overridden on sub-classes
   */
  protected async createEmbeds(newDocument: T): Promise<boolean> {
    return !!newDocument;
  }

  /**
   * Get up to `maxCount` documents, or all if not specified
   * @returns a possibly empty array of documents
   */
  async getMany(maxCount?: number, offset?: number): Promise<T[]> {
    const resultCursor = this.collection.find({}, { skip: offset });
    if (maxCount) resultCursor.limit(maxCount);
    const documents = await resultCursor.toArray();
    const transformed = documents.map((doc) => this.recordToObject(doc), this);
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
   * Find a document from any of its properties.
   * @param query A MongoDB query. An empty object matches any document. To find by name, pass { name: documentName }. See [the documentation](https://www.mongodb.com/docs/drivers/node/current/fundamentals/crud/query-document/#std-label-node-fundamentals-query-document) for more
   */
  async findOne<Q extends Filter<BeforeId<T>>>(query: Q): Promise<T | null> {
    const result = await this.collection.findOne(query);
    if (result === null) return null;

    return this.recordToObject(result);
  }

  /**
   * Find all documents matching a query object.
   * @param query A MongoDB query. An empty object matches any document. To find by name, pass { name: documentName }. See [the documentation](https://www.mongodb.com/docs/drivers/node/current/fundamentals/crud/query-document/#std-label-node-fundamentals-query-document) for more
   */
  async findMany(query: Filter<BeforeId<T>>, maxCount?: number): Promise<T[]> {
    const resultCursor = this.collection.find(query);
    if (maxCount) resultCursor.limit(maxCount);
    const records = await resultCursor.toArray();
    return records.map(this.recordToObject, this);
  }

  /**
   * Updates an existing record
   * @returns true if the update request was successful, or throws otherwise
   */
  async update(
    partialEntry: PartialWithStringId<T>,
    mergeProps: boolean = false,
  ): Promise<boolean> {
    const validated = this.validateUpdate(partialEntry);

    const { id, ...rest } = validated;
    const updateObj = { $set: { ...rest, updatedAt: Date.now() } };

    const filter = {
      _id: ObjectId.createFromHexString(id),
    } as Filter<BeforeId<T>>;

    const updateFilter = mergeProps
      ? [updateObj]
      : (updateObj as UpdateFilter<BeforeId<T>>);

    const result = this.withTransaction(async (session) => {
      const updateResult = await this.collection.updateOne(
        filter,
        updateFilter,
      );
      if (!updateResult.acknowledged) {
        await session.abortTransaction();
        throw new DocumentUpdateFailedError(`Failed to update document ${id}`);
      }

      const embedResult = await this.updateEmbeds(validated);
      if (!embedResult) {
        await session.abortTransaction();
        throw new DocumentUpdateFailedError(
          `Failed to update embeds for document ${id}`,
        );
      }

      return true;
    });

    return result;
  }

  protected async updateEmbeds(
    partialEntry: PartialWithStringId<T>,
  ): Promise<boolean> {
    return !!partialEntry;
  }

  /**
   * Updates the passed key on a record, if it exists. Fetches the document and
   * validates it with the updates against the schema before attempting to update.
   * throws if `keyPath` or `newValue` is invalid
   * @param keyPath a dot-separated string representing successively nested keys
   * @returns `true` if a record was updated, or `false` otherwise
   */
  async updateKeySafe(
    id: string,
    keyPath: string,
    newValue: unknown,
  ): Promise<boolean> {
    if (keyPath.length === 0) {
      throw new TypeError('Key path cannot be an empty string!');
    }

    const parsed = this.keyPathToObject(keyPath, newValue);
    const original = await this.get(id);

    const merged = merge(original, parsed);
    const validated = this.validateUpdate(merged);

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { id: _, ...rest } = validated;
    const updates = { ...rest, updatedAt: Date.now() };

    const filter = {
      _id: ObjectId.createFromHexString(id),
      [keyPath]: { $exists: true },
    } as Filter<BeforeId<T>>;

    const result = await this.collection.updateOne(filter, [{ $set: updates }]);
    return result.modifiedCount > 0;
  }

  /**
   * Pushes to an array within all matching records
   * @param matcher a partial document to filter by, or an array of them
   * @returns the update result. Check .acknowledged to verify it succeeded
   */
  async push(
    keyPath: string,
    newEntry: object,
    matcher: Filter<T>,
  ): Promise<UpdateResult<T>> {
    const op = { [keyPath]: newEntry } as PushOperator<BeforeId<T>>;

    const filter = {
      ...matcher,
      [keyPath]: { $exists: true },
    } as Filter<BeforeId<T>>;

    const result = await this.collection.updateMany(filter, { $push: op });
    return result;
  }

  /**
   * Pushes to an array on a document with the passed id
   */
  async pushTo(
    keyPath: string,
    newEntry: object,
    documentId: string,
  ): Promise<UpdateResult<T>> {
    const matcher = {
      _id: ObjectId.createFromHexString(documentId),
    } as Filter<T>;
    return this.push(keyPath, newEntry, matcher);
  }

  /**
   * Removes an element from an array within all matching records
   * @param [documentMatcher={}] a partial document to filter by, or an array of them
   * @returns the updateResult
   */
  async pull(
    keyPath: string,
    toDeleteMatcher: object,
    documentMatcher: Filter<T> = {},
  ): Promise<UpdateResult<T>> {
    const op = { [keyPath]: toDeleteMatcher } as PullOperator<BeforeId<T>>;

    const filter = {
      ...documentMatcher,
      [keyPath]: { $exists: true },
    } as Filter<BeforeId<T>>;

    const result = await this.collection.updateMany(filter, { $pull: op });
    return result;
  }

  /**
   * Pulls from an array on a document with the passed id
   */
  async pullFrom(
    keyPath: string,
    toDelete: object,
    documentId: string,
  ): Promise<UpdateResult<T>> {
    const matcher = {
      _id: ObjectId.createFromHexString(documentId),
    } as Filter<T>;
    return this.pull(keyPath, toDelete, matcher);
  }

  /**
   * (WIP) Updates an element on an array inside a record
   * @param searchObj An object of properties to filter elements by
   * @param updateObj A partial object of properties to overwrite on the
   * @returns true if the query was successful
   */
  async updateElement(
    id: string,
    keyPath: string,
    searchObj: PartialWithStringId<T>,
    updateObj: object,
  ) {
    const validated = this.validateUpdate(searchObj);
    if (validated === null) return null;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { id: _, ...rest } = validated;

    const filter = {
      _id: ObjectId.createFromHexString(id),
      ...rest,
      [keyPath]: { $exists: true },
    } as Filter<BeforeId<T>>;

    const op = { [`${keyPath}.$`]: updateObj } as MatchKeysAndValues<
    BeforeId<T>
    >;
    const result = await this.collection.updateOne(filter, { $set: op });
    return result.acknowledged;
  }

  /**
   * Deletes an existing record
   * @returns true if a record was deleted, or throws otherwise
   */
  async delete(documentId: string): Promise<boolean> {
    const filter = { _id: ObjectId.createFromHexString(documentId) };
    const result = this.withTransaction(async (session) => {
      const deleteResult = await this.collection.deleteOne(
        filter as Filter<BeforeId<T>>,
      );
      if (!deleteResult.deletedCount) {
        throw new DocumentUpdateFailedError(
          `Failed to delete document with id ${documentId}`,
        );
      }

      const embedDeleteResult = await this.deleteEmbeds(documentId);
      if (!embedDeleteResult) {
        await session.abortTransaction();
        throw new DocumentUpdateFailedError(
          `Failed to delete embeds for document with id ${documentId}`,
        );
      }
      return embedDeleteResult;
    });

    return result;
  }

  /**
   * A placeholder to be overridden on sub-classes
   */
  protected async deleteEmbeds(documentId: string): Promise<boolean> {
    return !!documentId;
  }

  /**
   * Parses a key path string into an update object
   * @param keyPath A dot-separated string representing nested properties
   * @param newValue The value to assign to the parsed key
   */
  keyPathToObject<V, R extends Record<string, R | V>>(
    keyPath: string,
    newValue: V,
  ) {
    const segments = keyPath.split('.');
    const accumulator = {} as R;
    let ptr: R = accumulator;
    const result = segments.reduce((acc, segment, i) => {
      const newInner = i === segments.length - 1 ? newValue : {};
      Object.assign(ptr, { [segment]: newInner });
      if (ptr[segment] !== newValue) {
        ptr = ptr[segment] as R;
      }

      return acc;
    }, accumulator);

    return result;
  }

  /**
   * Executes a callback function that performs multiple MongoDB operations.
   * If the callback returns a falsy value or throws an error, all operations
   * are reversed/cancelled.
   */
  protected async withTransaction<R = unknown>(
    cb: WithTransactionCallback<R>,
  ): Promise<R> {
    return this.manager.client.withSession(async (session) =>
      session.withTransaction(cb));
  }
}
