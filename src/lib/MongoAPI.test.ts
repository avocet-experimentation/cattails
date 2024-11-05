import { describe, it, expect, beforeAll, expectTypeOf, afterAll, beforeEach } from 'vitest';
import env from '../envalid.js';
import { MongoClient, ObjectId } from 'mongodb';
import { FeatureFlag } from '@fflags/types';
import MongoAPI, { DraftRecord } from './MongoAPI.ts';

// create an API for the testing database
const api = new MongoAPI(env.MONGO_TESTING_URI);

const getExampleFlag = (): DraftRecord<FeatureFlag> => {
  const currentTimeMs = Date.now();
  
  const example = {
    name: 'test flag',
    description: '',
    valueType: 'boolean' as const,
    defaultValue: 'false',
    createdAt: currentTimeMs,
    updatedAt: currentTimeMs,
    environments: {
      prod: {
        name: 'prod',
        enabled: false,
        overrideRules: [],
      },
      dev: {
        name: 'dev',
        enabled: false,
        overrideRules: [],
      },
      testing: {
        name: 'testing',
        enabled: false,
        overrideRules: [],
      },
    },
  }

  return example;
};

const eraseTestData = async () => {
  const client = new MongoClient(env.MONGO_TESTING_URI);
  await client.db().dropCollection('flags');
  await client.db().dropCollection('experiments');
}

beforeAll(eraseTestData);

describe('Feature Flags', () => {
  
  describe('createFlag', () => {
    beforeEach(eraseTestData);

    it("creates a record and returns its `ObjectId` as a string if passed an object with no `.id`", async () => {
      const result = await api.createFlag(getExampleFlag());
      expect(typeof result).toBe('string');
    });

    it("rejects if passed an object with a `.id`", async () => {
      const input = { ...getExampleFlag(), id: crypto.randomUUID() };
      // const badInsert = async () => await db.createFlag(input);
      expect(async () => await api.createFlag(input)).rejects.toThrow();
    });

    afterAll(eraseTestData);
  });

  describe('getFlags', () => {
    beforeAll(async () => {
      const insertions = new Array(10).fill(null).map(() => api.createFlag(getExampleFlag()).then((value) => console.log(value)));
      await Promise.all(insertions);
    });

    it("returns all members of the collection if a `maxCount` isn't passed", async () => {
      const result = await api.getFlags();
      expect(result).toHaveLength(10);
    });

    it("returns `maxCount` documents if a valid number is passed <= collection size", async () => {
      const result = await api.getFlags(5);
      expect(result).toHaveLength(5);
    });

    it("returns all members of the collection if `maxCount` >= collection size", async () => {
      const result = await api.getFlags(50);
      expect(result).toHaveLength(10);
    });

    afterAll(eraseTestData);
  });

  describe('getFlag', () => {
    let insertResult: string | null;
    beforeAll(async () => {
      insertResult = await api.createFlag(getExampleFlag());
    });

    it("returns a previously inserted document if provided its ObjectId as a hex string", async () => {
      expect(insertResult).not.toBeNull();
      if (insertResult === null) return;
      const result = await api.getFlag(insertResult);
      expect(result).not.toBeNull();
      // if (result === null) return;
      // expect(result.length).toBe(1);
    });

    it("throws if provided an invalid ID", async () => {
      expect(api.getFlag('invalid-id')).rejects.toThrow();
    });

    it("returns null if provided an incorrect ID", async () => {
      const randomObjectId = ObjectId.createFromTime(99);
      const result = await api.getFlag(randomObjectId.toHexString());
      expect(result).toBeNull();
    });
    
    afterAll(eraseTestData);
  });

});

afterAll(eraseTestData);