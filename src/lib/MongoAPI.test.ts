import { describe, it, expect, beforeAll, expectTypeOf, afterAll } from 'vitest';
import MongoAPI from './MongoAPI';
import { FFlag } from '../fflags/fflags.types';

// create an API using a new database
const db = new MongoAPI(process.env.MONGO_TESTING_URI);

const currentTimeMs = Date.now()
const exampleFlag: FFlag = {
  name: 'test flag',
  description: '',
  createdAt: currentTimeMs,
  updatedAt: currentTimeMs,
  environments: {
    dev: {
      enabled: false,
      overrideRules: [],
    },
  },
};

describe('insertNewFlag', () => {
  it("creates a record and returns its `ObjectId` as a string if passed an object with no `id`", async () => {
    const result = await db.createFlag(exampleFlag);
    expectTypeOf(result).toBeString();
  });

  it("does not create a new record if the passed object has an `id`", async () => {
    const input = { ...exampleFlag, id: crypto.randomUUID() };
    expect(await db.createFlag(input)).toThrow();
  });
})
describe('getAllFlags', () => {
  beforeAll(async () => {
    const insertResult = await db.createFlag(exampleFlag);
  });

  it("returns all members of the collection if a `maxCount` isn't passed", async () => {
    const result = await db.getAllFlags();
    expect(result.length).toBe(1);
  });

  it.skip("returns `maxCount` members of the collection if a valid number is passed less than or equal to the collection size", async () => {

  });
});

afterAll(() => {
  // drop the test database
});