import { describe, it, expect, beforeAll, expectTypeOf, afterAll } from 'vitest';
import env from '../envalid.js';
import { MongoClient } from 'mongodb';
import { FeatureFlag } from './placeholderTypes.js';
import MongoAPI from './MongoAPI';
// import { FFlag } from '../fflags/fflags.types';

// create an API for the testing database
const db = new MongoAPI(env.MONGO_TESTING_URI);

const getExampleFlag = (): FeatureFlag => {
  const currentTimeMs = Date.now();
  
  const example: FeatureFlag = {
    name: 'test flag',
    description: '',
    valueType: 'boolean',
    defaultValue: false,
    createdAt: currentTimeMs,
    updatedAt: currentTimeMs,
    environments: {
      prod: {
        enabled: false,
        overrideRules: [],
      },
      dev: {
        enabled: false,
        overrideRules: [],
      },
      testing: {
        enabled: false,
        overrideRules: [],
      },
    },
  }

  return example;
};

const eraseTestData = async () => {
  const client = new MongoClient(env.MONGO_TESTING_URI);
  client.db().dropCollection('flags');
  client.db().dropCollection('experiments');
}

beforeAll(eraseTestData);

describe('insertNewFlag', () => {
  it("creates a record and returns its `ObjectId` as a string if passed an object with no `id`", async () => {
    const result = await db.createFlag(getExampleFlag());
    console.log()
    expect(typeof result).toBe('string');
  });

  it("does not create a new record if the passed object has an `id`", async () => {
    const input = { ...getExampleFlag(), id: crypto.randomUUID() };
    // const badInsert = async () => await db.createFlag(input);
    expect(async () => await db.createFlag(input)).rejects.toThrow();
  });

  afterAll(eraseTestData);
});

describe('getAllFlags', () => {
  beforeAll(async () => {
    const insertResult = await db.createFlag(getExampleFlag());
  });

  it("returns all members of the collection if a `maxCount` isn't passed", async () => {
    const result = await db.getAllFlags();
    expect(result.length).toBe(1);
  });

  it.skip("returns `maxCount` members of the collection if a valid number is passed less than or equal to the collection size", async () => {

  });
});

afterAll(eraseTestData);