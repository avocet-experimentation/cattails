import { MongoClient, ObjectId } from 'mongodb';
import env from '../../envalid.js';
import { afterAll, beforeAll, beforeEach, describe, expect, expectTypeOf, it } from 'vitest';
import { exampleFlags, getExampleFlag, staticFlags } from '../../testing/data/featureFlags.js';
import FeatureFlagRepository from '../FeatureFlagRepository.js'
import { EstuaryMongoCollectionName, ForcedValue, OverrideRule } from '@estuary/types';
// import ExperimentRepository from '../FeatureFlagRepository.js'

const fflagRepo = new FeatureFlagRepository(env.MONGO_TESTING_URI);
// const experimentRepo = new ExperimentRepository(env.MONGO_TESTING_URI);

const eraseClientDb = new MongoClient(env.MONGO_TESTING_URI).db();

const insertExampleFlags = async (resultsArray: (string | null)[]) => {
  const promises = [
    fflagRepo.create(exampleFlags[0]),
    fflagRepo.create(exampleFlags[1]),
  ];

  const resolved = await Promise.all(promises);
  resultsArray.splice(resultsArray.length, 0, ...resolved);
}

const eraseCollection = async (collectionName: EstuaryMongoCollectionName) => await eraseClientDb.dropCollection(collectionName);
const eraseTestData = async () => {
  await eraseCollection('FeatureFlag');
  await eraseCollection('Experiment');
}

beforeAll(eraseTestData);

describe('MongoRepository CRUD Methods', () => {
  
  describe('create', () => {
    beforeEach(eraseTestData);

    it("creates a flag and returns its `ObjectId` as a string if passed an object with no `.id`", async () => {
      const result = await fflagRepo.create(getExampleFlag());
      expect(typeof result).toBe('string');
    });

    it("returns null if passed an object with a `.id`", async () => {
      const input = { ...getExampleFlag(), id: crypto.randomUUID() };
      const result = await fflagRepo.create(input);
      expect(result).toBeNull();
    });

    afterAll(eraseTestData);
  });

  describe('getMany', () => {
    beforeAll(async () => {
      await eraseTestData();
      const insertions = new Array(10).fill(null).map(() => fflagRepo.create(getExampleFlag())
        // .then((value) => console.log(value))
      );
      await Promise.all(insertions);
    });

    it("returns all flags if a `maxCount` isn't passed", async () => {
      const result = await fflagRepo.getMany();
      expect(result).toHaveLength(10);
    });

    it("returns `maxCount` flags if a valid number is passed <= collection size", async () => {
      const result = await fflagRepo.getMany(5);
      expect(result).toHaveLength(5);
    });

    it("returns all flags if `maxCount` >= collection size", async () => {
      const result = await fflagRepo.getMany(50);
      expect(result).toHaveLength(10);
    });

    afterAll(eraseTestData);
  });

  describe('get', () => {
    let insertResult: string | null;
    beforeAll(async () => {
      insertResult = await fflagRepo.create(getExampleFlag());
    });

    it("returns a previously inserted flag if provided its ObjectId as a hex string", async () => {
      expect(insertResult).not.toBeNull();
      if (insertResult === null) return;
      const result = await fflagRepo.get(insertResult);
      expect(result).not.toBeNull();
    });

    it("throws if provided an invalid ID", async () => {
      expect(fflagRepo.get('invalid-id')).rejects.toThrow();
    });

    it("returns null if provided an incorrect ID", async () => {
      const randomObjectId = ObjectId.createFromTime(99);
      const result = await fflagRepo.get(randomObjectId.toHexString());
      console
      expect(result).toBeNull();
    });
    
    afterAll(eraseTestData);
  });

  describe('findOne', () => {
    let insertResults: (string | null)[] = [];
    beforeAll(async () => insertExampleFlags(insertResults));

    it("finds the right record from a query on its name", async () => {
      const first = insertResults[0];
      if (first === null) return;

      const result = await fflagRepo.findOne({ name: 'testing flag' });
      expect(result).not.toBeNull();
      expect(result?.id).toEqual(first);
    });

    it("finds the right record from a substring match on description", async () => {
      const second = insertResults[1];
      if (second === null) return;

      const result = await fflagRepo.findOne({ description: { $regex: /server-sent events/ } });
      expect(result).not.toBeNull();
      expect(result?.id).toEqual(second);
    });

    it("returns null if no records match the query", async () => {
      const result = await fflagRepo.findOne({ name: 'asdfoasihgda'});
      expect(result).toBeNull();
    });
    
    afterAll(eraseTestData);
  });

  describe('update', () => {
    let insertResults: (string | null)[] = [];
    beforeAll(async () => await insertExampleFlags(insertResults));

    it("overwrites specified fields when passed a partial object", async () => {
      const first = insertResults[0];
      if (first === null) return;

      const updateObject = {
        id: first,
        value: {
          type: 'number' as const,
          initial: 3,
        },
      };
      const result = await fflagRepo.update(updateObject);
      expect(result).not.toBeNull();

      const updatedFirst = await fflagRepo.get(first);
      expect(updatedFirst).not.toBeNull();
      expect(updatedFirst).toMatchObject(updateObject);
    });

    it("doesn't modify fields not passed in the update object", async () => {
      const second = insertResults[1];
      const original = exampleFlags[1];
      if (second === null) return;

      const updateName = 'updated testing flag';
      const result = await fflagRepo.update({ id: second, name: updateName });
      expect(result).toBeTruthy();

      const updatedFirst = await fflagRepo.get(second);
      expect(updatedFirst).not.toBeNull();
      if (updatedFirst === null) return;

      const { createdAt, updatedAt, ...withoutTimeStamps } = updatedFirst;
      expectTypeOf(createdAt).toBeNumber();
      expectTypeOf(updatedAt).toBeNumber();
      expect(updatedAt).toBeGreaterThanOrEqual(createdAt);

      const reconstructed = { ...withoutTimeStamps, name: original.name };
      expect(reconstructed).toStrictEqual({ id: second, ...original });
    });

    it("doesn't overwrite if no document matches the `id`", async () => {
      const result = await fflagRepo.findOne({ name: 'asdfoasihgda'});
      expect(result).toBeNull();
    });
    
    afterAll(eraseTestData);
  });

  // WIP
  describe('updateKeySafe', () => {
    let insertResults: (string | null)[] = [];
    beforeAll(async () => await insertExampleFlags(insertResults));

    it("Changes the value on a single property", async () => {
      const first = insertResults[0];
      if (first === null) return;

      const result = await fflagRepo.updateKeySafe(first, 'value.initial', true);
      expect(result).toBeTruthy();

      const updatedFirst = await fflagRepo.get(first);
      expect(updatedFirst).not.toBeNull();
      expect(updatedFirst?.value).toMatchObject({ type: 'boolean', initial: true });
    });
    

    it.skip("Rejects changes that break the schema", async () => {
      const first = insertResults[0];
      if (first === null) return;
      const firstDoc = await fflagRepo.get(first);
      // console.log(firstDoc);

      // const result = await fflagRepo.updateKey(first, 'value.initial', true);
      const result = await fflagRepo.updateKeySafe(first, 'value.type', 'number') // this might break the schema
      // expect(result).toBeFalsy();
      const updatedFirst = await fflagRepo.get(first);
      console.log(updatedFirst)
      expect(updatedFirst?.value).toMatchObject({ type: 'boolean', initial: true });
    });
    
    afterAll(eraseTestData);
  });

  // WIP
  describe('push', () => {
    let insertResults: (string | null)[] = [];
    beforeAll(async () => await insertExampleFlags(insertResults));

    it("Adds an element to an array", async () => {
      const first = insertResults[0];
      if (first === null) return;
      const firstDoc = await fflagRepo.get(first);
      // console.log(firstDoc);

      const newRule: ForcedValue = {
        type: 'ForcedValue',
        status: 'draft',
        value: true,
        environment: 'dev',
        enrollment: {
          attributes: [],
          proportion: 1,
        }
      };
      const result = await fflagRepo.push(first, 'environments.staging.overrideRules', newRule);
      expect(result).toBeTruthy();

      const updatedFirst = await fflagRepo.get(first);
      expect(updatedFirst?.environments.staging?.overrideRules).toContainEqual(newRule);
    });
    
    afterAll(eraseTestData);
  });

  // WIP
  describe('pull', () => {
    let insertResults: (string | null)[] = [];
    beforeAll(async () => {
      const result = await fflagRepo.collection.insertOne(staticFlags[0]);
      insertResults.push(result.insertedId?.toHexString() ?? null);
    });

    it("Removes an element from an array", async () => {
      const firstId = insertResults[0];
      if (firstId === null) return;
      const firstDoc = await fflagRepo.get(firstId);
      // console.log(firstDoc);

      const ruleToRemove = staticFlags[0].environments.dev?.overrideRules[0];
      const result = await fflagRepo.pull(firstId, 'environments.dev.overrideRules', ruleToRemove);
      expect(result).toBeTruthy();

      const updatedFirst = await fflagRepo.get(firstId);
      expect(updatedFirst?.environments.dev?.overrideRules).not.toContainEqual(ruleToRemove);
    });
    
    afterAll(eraseTestData);
  });

  describe('delete', () => {
    let insertResults: (string | null)[] = [];
    beforeAll(async () => insertExampleFlags(insertResults));

    it("deletes the right record given a valid id", async () => {
      const first = insertResults[0];
      if (first === null) return;

      const result = await fflagRepo.delete(first);
      expect(result).toBeTruthy();
      const search = await fflagRepo.get(first);
      expect(search).toBeNull();
    });

    it("returns a falsy value if no records matches the passed id", async () => {
      const fakeId = ObjectId.createFromTime(0).toHexString();
      const result = await fflagRepo.delete(fakeId);
      expect(result).toBeFalsy();
    });
    
    afterAll(eraseTestData);
  });
});

describe('MongoRepository Helper Methods', () => {
  describe('keyPathToObject', () => {
    it('Creates a nested object given a dot-separated keyPath', () => {
      const path = 'environments.prod.enabled';
      const newValue = false;
      const result = fflagRepo._keyPathToObject(path, newValue);
      expect(result).toMatchObject({
        environments: {
          prod: {
            enabled: false,
          },
        },
      });
    });

    it.skip('Creates an object given a keyPath with just one key', () => {

    });

    it.skip('Handles empty strings', () => {

    });
  });
});

afterAll(eraseTestData);