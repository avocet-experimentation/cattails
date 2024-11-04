import { MongoClient, ObjectId, Document, WithId, Collection, Db } from 'mongodb';
import { cast, MinLength, ReflectionClass, is, assert } from '@deepkit/type';
import env from '../envalid.js';
// import { Experiment } from '../experiments/experiments.types.js';
import { FFlag } from '../fflags/fflags.types.js';




//#region TEMPORARY TYPE DEFINITIONS
interface Scope {
  name: string;
  version: string;
}

// context for a span, such as the route followed, current configuration, etc
// possible candidate for storing flag/experiment statuses as well
interface SpanStringAttribute {
  key: string; // e.g., http.route
  value: {
    stringValue: string; // e.g., '/'
  }
}

interface SpanIntAttribute {
  key: string; // e.g., http.route
  value: {
	intValue: string; // e.g., '/'
  }
}

type SpanPrimitiveAttribute = SpanStringAttribute | SpanIntAttribute;

// SpanArrayAttribute is adistributive conditional type. See https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types
type ToArray<T> = T extends any ? T[] : never;
type SpanArrayAttribute = ToArray<SpanPrimitiveAttribute>;

type SpanAttribute = SpanArrayAttribute | SpanPrimitiveAttribute;

// "span" is a catch-all term for units of work or operations. See [Observability primer | OpenTelemetry](https://opentelemetry.io/docs/concepts/observability-primer/)
interface Span {
  traceId: string; // uniquely identifies the path taken by a request through various system components
  spanId: string;
  parentSpanId: string; // seems spans can be nested
  name: string;
  kind: number;
  startTimeUnixNano: string; // Unix timestamp?
  endTimeUnixNano: string;
  attributes: SpanAttribute[];
  status: object;
}

interface ScopeSpan {
  scope: Scope;
  spans: Span[];
}

interface ResourceSpan {
  resource: {
    attributes: SpanAttribute[];
  };
  scopeSpans: ScopeSpan[];
}

export type Attribute = ['id', 'name'][number]; // => 'id' | 'name'

interface OverrideRule {
  id: string;
  description: string;
  ruleType: 'experiment' | 'force' | 'rollout';
  status: "in_test" | "completed" | "archived" | "active";
  startTimestamp?: number; // unix timestamp | undefined if never enabled
  endTimestamp?: number;
  enrollment: {
	attributes: Attribute[]; // keys for the values sent to the experimentation server and consistently hashed for random assignment
	proportion: number; // 0 < proportion <= 1
  };
}

// for supporting multivariate experiments later
interface Intervention { [flagId: string]: string }

// a block defines an intervention for a group
interface ExperimentBlock {
  id: string;
  name: string;
  startTimestamp?: number; // unix timestamp
  endTimestamp?: number;
  flagValue: FeatureFlag['valueType']; // the intervention is defined here, by a specific flag value	
}

// a grouping of users to be subjected to a sequence of experiment blocks
interface ExperimentGroup {
  id: string;
  name: string;
  proportion: number; // default 1 for switchbacks
  blocks: ExperimentBlock[];
  gap: number; // tentative - a time gap between blocks to mitigate across-block effects
}

// spans, traces, etc
export type EventTelemetry = Span // | Trace // or potentially more

interface Experiment extends OverrideRule {
  name: string; // unique experiment name
  groups: ExperimentGroup[];
  flagId: string;
  dependents: EventTelemetry[]; // all dependent variables
}

export type FlagEnvironments = { [key in EnvironmentName]: FlagEnvironment };
// if the one below this line is the same as the one above, use it instead
// type FlagEnvironments = Record<EnvironmentName, FlagEnvironment>;

export type FeatureFlag = {
  id?: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number; // default to the same as `createdAt`?
  environments: FlagEnvironments;
} & (
  | { valueType: "boolean"; defaultValue: boolean }
  | { valueType: "string"; defaultValue: string }
  | { valueType: "number"; defaultValue: number }
);
//#endregion




/*
- ObjectID() doc: https://mongodb.github.io/node-mongodb-native/Next/classes/BSON.ObjectId.html
*/

/**
 * Transformed record that stores a hex string representing an ObjectId on the `id` property
 */
export type MongoTypes = FeatureFlag | Experiment;
export type WithMongoStringId<T extends MongoTypes> = T & { id: string };

// export type ToArray<T> = T extends any ? T[] : never;
// export type MongoTypeArray = ToArray<MongoTypes>;

export type EnvironmentName = 'prod' | 'dev' | 'testing';

export type FlagEnvironment = {
  enabled: boolean;
  overrideRules: OverrideRule[];
}

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

const db = new MongoAPI(process.env.MONGO_TESTING_URI);
db._RecordToObject({ _id: ObjectId.createFromHexString('672554f934265b61cb05d5cf'), name: 'example record' });