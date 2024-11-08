import { Filter, Condition, WithId } from 'mongodb';
import { FeatureFlag, Experiment } from '@estuary/types';

/* TYPE DEFINITIONS FOR WORKING WITH MONGO RECORDS */

// these are a work in progress

/**
 * Base types that stores a hex string representing an ObjectId on the `id` property
 */
export type EstuaryBaseTypes = FeatureFlag | Experiment; // later: users, environments, event types, and attributes
/**
 * Version that is complete but not yet assigned an ObjectId by MongoDB
 */
export type BeforeId<T extends EstuaryBaseTypes> = Omit<T, 'id'>;
/**
 * Alias for mongodb.WithId for clarity
 */
export type WithObjectId<T extends BeforeId<EstuaryBaseTypes>> = WithId<T>;
/**
 * A partial object with only the minimum fields required to save it as a draft. Might replace this with per-type
 * draft definitions.
 */
export type DraftRecord<T extends EstuaryBaseTypes> = Partial<T> & Required<Pick<T, 'name'>>;
/**
 * Partial object used to update only the provided fields. ID is required.
 */
export type PartialUpdate<T extends EstuaryBaseTypes> = Partial<T> & Required<Pick<T, 'id'>>;

/**
 * todo: look for a mongo native type to replace this
 */
export type MongoRecord<T extends EstuaryBaseTypes> = WithObjectId<BeforeId<T>>;

/**
 * A function that transforms one type to another
 */
type Codec<I, O> = (input: I) => O;
/**
 * The type used for the _recordToObject method
 */
export type RecordToObjectCodec<T extends EstuaryBaseTypes> = Codec<MongoRecord<T>, T>;
// export type WithMongoStringId<T extends MongoTypes> = T & { id: string };

// temporary/WIP
type findFilter<T extends EstuaryBaseTypes> = { [P in keyof WithObjectId<T>]?: Condition<WithObjectId<T>[P]> | undefined; };
type findFilter2<T> = Filter<T>
type FlagFindFilter = findFilter<FeatureFlag>

// interface MongoRepository<T extends MongoTypes> {
//   // client: MongoClient;
//   // db: Db;
//   schema: EstuarySchema<T>;
//   collection: Collection<T>;
//   _recordToObject: RecordToObjectCodec<T>;
// }