import { MongoClient, ObjectId } from 'mongodb';
import cfg from '../../envalid.js';
import { afterAll, beforeAll, beforeEach, describe, expect, expectTypeOf, it } from 'vitest';
import { exampleFlags, getExampleFlag, staticFlags } from '../../testing/data/featureFlags.js';
import { EstuaryMongoCollectionName, ForcedValue } from '@estuary/types';
import RepositoryManager from '../RepositoryManager.js';

const repo = new RepositoryManager(cfg.MONGO_TESTING_URI);

const insertExampleFlags = async (resultsArray: string[]) => {
  const promises = [
    repo.featureFlag.create(exampleFlags[0]),
    repo.featureFlag.create(exampleFlags[1]),
  ];

  const resolved = await Promise.all(promises);
  resultsArray.splice(resultsArray.length, 0, ...resolved);
}

const eraseCollection = async (
  collectionName: EstuaryMongoCollectionName
) => await repo.client.db().dropCollection(collectionName);

const eraseTestData = async () => {
  await eraseCollection('FeatureFlag');
  await eraseCollection('Experiment');
}

beforeAll(eraseTestData);

describe('MongoRepository CRUD Methods', () => {
  
  describe('create', () => {
    beforeEach(eraseTestData);

    it("creates a flag and returns its `ObjectId` as a string if passed an object with no `.id`", async () => {
      const result = await repo.featureFlag.create(getExampleFlag());
      expect(typeof result).toBe('string');
    });

    it("throws an error if passed an object with a `.id`", async () => {
      const input = { ...getExampleFlag(), id: crypto.randomUUID() };
      expect(async () => await repo.featureFlag.create(input)).rejects.toThrow();
    });

    afterAll(eraseTestData);
  });

  describe('getMany', () => {
    beforeAll(async () => {
      await eraseTestData();
      const insertions = new Array(10)
        .fill(null)
        .map(() => repo.featureFlag.create(getExampleFlag()));
      await Promise.all(insertions);
    });

    it("returns all flags if a `maxCount` isn't passed", async () => {
      const result = await repo.featureFlag.getMany();
      expect(result).toHaveLength(10);
    });

    it("returns `maxCount` flags if a valid number is passed <= collection size", async () => {
      const result = await repo.featureFlag.getMany(5);
      expect(result).toHaveLength(5);
    });

    it("returns all flags if `maxCount` >= collection size", async () => {
      const result = await repo.featureFlag.getMany(50);
      expect(result).toHaveLength(10);
    });

    afterAll(eraseTestData);
  });

  describe('get', () => {
    let insertResult: string;
    beforeAll(async () => {
    });

    it("returns a previously inserted flag if provided its ObjectId as a hex string", async () => {
      const toInsert = getExampleFlag();
      insertResult = await repo.featureFlag.create(toInsert);
      const result = await repo.featureFlag.get(insertResult);
      expect(result).toMatchObject(toInsert);
    });

    it("throws if provided an invalid ID", async () => {
      expect(repo.featureFlag.get('invalid-id')).rejects.toThrow();
    });

    it("throws if provided an incorrect ID", async () => {
      const randomObjectIdString = ObjectId.createFromTime(99).toHexString();
      expect(async () => await repo.featureFlag.get(randomObjectIdString)).rejects.toThrow();
    });
    
    afterAll(eraseTestData);
  });

  describe('findOne', () => {
    let insertResults: string[] = [];
    beforeAll(async () => insertExampleFlags(insertResults));

    it("finds the right record from a query on its name", async () => {
      const first = insertResults[0];
      if (first === null) return;

      const result = await repo.featureFlag.findOne({ name: 'testing flag' });
      expect(result?.id).toEqual(first);
    });

    it("finds the right record from a substring match on description", async () => {
      const second = insertResults[1];
      if (second === null) return;

      const result = await repo.featureFlag.findOne({ description: { $regex: /server-sent events/ } });
      expect(result?.id).toEqual(second);
    });

    it("Returns null if no records match the query", async () => {
      const result = await repo.featureFlag.findOne({ name: 'asdfoasihgda'});
      expect(result).toBeNull();
    });
    
    afterAll(eraseTestData);
  });

  describe('update', () => {
    let insertResults: string[] = [];
    beforeAll(async () => await insertExampleFlags(insertResults));

    it("overwrites specified fields when passed a partial object", async () => {
      const first = insertResults[0];

      const updateObject = {
        id: first,
        value: {
          type: 'number' as const,
          initial: 3,
        },
      };
      const result = await repo.featureFlag.update(updateObject);
      expect(result).not.toBeNull();

      const updatedFirst = await repo.featureFlag.get(first);
      expect(updatedFirst).not.toBeNull();
      expect(updatedFirst).toMatchObject(updateObject);
    });

    it("doesn't modify fields not passed in the update object", async () => {
      const second = insertResults[1];
      const original = exampleFlags[1];
      if (second === null) return;

      const updateName = 'updated testing flag';
      const result = await repo.featureFlag.update({ id: second, name: updateName });
      expect(result).toBeTruthy();

      const updatedFirst = await repo.featureFlag.get(second);
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
      const result = await repo.featureFlag.update({ id: ObjectId.createFromTime(1).toHexString(), name: 'asdfoasihgda'});
      expect(result).toBeFalsy();
    });
    
    afterAll(eraseTestData);
  });

  // WIP
  describe('updateKeySafe', () => {
    let insertResults: string[] = [];
    beforeAll(async () => await insertExampleFlags(insertResults));

    it("Changes the value on a single property", async () => {
      const first = insertResults[0];

      const result = await repo.featureFlag.updateKeySafe(first, 'value.initial', true);
      expect(result).toBeTruthy();

      const updatedFirst = await repo.featureFlag.get(first);
      expect(updatedFirst).not.toBeNull();
      expect(updatedFirst?.value).toMatchObject({ type: 'boolean', initial: true });
    });
    

    it.skip("Rejects changes that break the schema", async () => {
      const first = insertResults[0];
      const firstDoc = await repo.featureFlag.get(first);
      // console.log(firstDoc);

      // const result = await repo.featureFlag.updateKey(first, 'value.initial', true);
      const result = await repo.featureFlag.updateKeySafe(first, 'value.type', 'number') // this might break the schema
      // expect(result).toBeFalsy();
      const updatedFirst = await repo.featureFlag.get(first);
      console.log(updatedFirst)
      expect(updatedFirst?.value).toMatchObject({ type: 'boolean', initial: true });
    });
    
    afterAll(eraseTestData);
  });

  // WIP
  describe('push', () => {
    let insertResults: string[] = [];
    beforeAll(async () => await insertExampleFlags(insertResults));

    it("Adds an element to an array", async () => {
      const first = insertResults[0];
      // const firstDoc = await repo.featureFlag.get(first);
      // console.log(firstDoc);

      const newRule: ForcedValue = {
        type: 'ForcedValue',
        status: 'draft',
        value: true,
        environmentName: 'dev',
        enrollment: {
          attributes: [],
          proportion: 1,
        }
      };
      const result = await repo.featureFlag.push(first, 'environments.staging.overrideRules', newRule);
      expect(result).toBeTruthy();

      const updatedFirst = await repo.featureFlag.get(first);
      expect(updatedFirst?.environments.staging?.overrideRules).toContainEqual(newRule);
    });
    
    afterAll(eraseTestData);
  });

  // WIP
  describe('pull', () => {
    let insertResults: (string | null)[] = [];
    beforeAll(async () => {
      const result = await repo.featureFlag.collection.insertOne(staticFlags[0]);
      insertResults.push(result.insertedId?.toHexString() ?? null);
    });

    it("Removes an element from an array", async () => {
      const firstId = insertResults[0];
      if (firstId === null) return;
      const firstDoc = await repo.featureFlag.get(firstId);
      // console.log(firstDoc);

      const ruleToRemove = staticFlags[0].environments.dev?.overrideRules[0];
      const result = await repo.featureFlag.pull(firstId, 'environments.dev.overrideRules', ruleToRemove);
      expect(result).toBeTruthy();

      const updatedFirst = await repo.featureFlag.get(firstId);
      expect(updatedFirst?.environments.dev?.overrideRules).not.toContainEqual(ruleToRemove);
    });
    
    afterAll(eraseTestData);
  });

  describe('delete', () => {
    let insertResults: string[] = [];
    beforeAll(async () => insertExampleFlags(insertResults));

    it("deletes the right record given a valid id", async () => {
      const first = insertResults[0];

      const result = await repo.featureFlag.delete(first);
      expect(result).toBeTruthy();
      expect(async () => await repo.featureFlag.get(first)).rejects.toThrow();
    });

    it("Throws an error if no records matches the passed id", async () => {
      const fakeId = ObjectId.createFromTime(0).toHexString();
      expect(async () => await repo.featureFlag.delete(fakeId)).rejects.toThrow();
    });
    
    afterAll(eraseTestData);
  });
});

describe('MongoRepository Helper Methods', () => {
  describe('keyPathToObject', () => {
    it('Creates a nested object given a dot-separated keyPath', () => {
      const path = 'environments.prod.enabled';
      const newValue = false;
      const result = repo.featureFlag._keyPathToObject(path, newValue);
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