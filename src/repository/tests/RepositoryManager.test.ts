import { ObjectId } from 'mongodb';
import { afterAll, beforeAll, beforeEach, describe, expect, expectTypeOf, it } from 'vitest';
import { exampleFlagDrafts, getExampleFlag, staticFlagDrafts } from '../../testing/data/featureFlags.js';
import { FeatureFlagDraft, FlagValueDefImpl, ForcedValue, OverrideRuleUnion } from '@estuary/types';
import { randomUUID } from 'crypto';
import { printDetail } from '../../lib/index.js';
import {
  repoManager,
  insertFlags,
  eraseTestData,
} from '../../testing/testing-helpers.js';

beforeAll(eraseTestData);

describe('MongoRepository CRUD Methods', () => {
  
  describe('create', () => {
    beforeEach(eraseTestData);

    it("creates a flag and returns its `ObjectId` as a string if passed an object with no `.id`", async () => {
      const result = await repoManager.featureFlag.create(getExampleFlag());
      expect(typeof result).toBe('string');
    });

    it("throws an error if passed an object with a `.id`", async () => {
      const input = { ...getExampleFlag(), id: crypto.randomUUID() };
      expect(async () => await repoManager.featureFlag.create(input)).rejects.toThrow();
    });

    afterAll(eraseTestData);
  });

  describe('getMany', () => {
    beforeAll(async () => {
      await eraseTestData();
      const insertions = new Array(10)
        .fill(null)
        .map(() => repoManager.featureFlag.create(
          FeatureFlagDraft.template({
            name: `name-${randomUUID()}`,
            value: FlagValueDefImpl.templateBoolean(),
          })
        ));
      await Promise.all(insertions);
    });

    it("returns all flags if a `maxCount` isn't passed", async () => {
      const result = await repoManager.featureFlag.getMany();
      expect(result).toHaveLength(10);
    });

    it("returns `maxCount` flags if a valid number is passed <= collection size", async () => {
      const result = await repoManager.featureFlag.getMany(5);
      expect(result).toHaveLength(5);
    });

    it("returns all flags if `maxCount` >= collection size", async () => {
      const result = await repoManager.featureFlag.getMany(50);
      expect(result).toHaveLength(10);
    });

    afterAll(eraseTestData);
  });

  describe('get', () => {
    let insertResult: string;
    beforeAll(async () => {
    });

    it("returns a previously inserted flag if provided its ObjectId as a hex string", async () => {
      const toInsert = FeatureFlagDraft.template({
        name: 'get-test',
        value: FlagValueDefImpl.template('boolean'),
    });
      // printDetail({toInsert})
      insertResult = await repoManager.featureFlag.create(toInsert);
      const result = await repoManager.featureFlag.get(insertResult);
      const bareObj = JSON.parse(JSON.stringify((toInsert)));
      expect(result).toMatchObject(bareObj);
    });

    it("throws if provided an invalid ID", async () => {
      expect(repoManager.featureFlag.get('invalid-id')).rejects.toThrow();
    });

    it("throws if provided an incorrect ID", async () => {
      const randomObjectIdString = ObjectId.createFromTime(99).toHexString();
      expect(async () => await repoManager.featureFlag.get(randomObjectIdString)).rejects.toThrow();
    });
    
    afterAll(eraseTestData);
  });

  describe('findOne', () => {
    let insertResults: string[] = [];
    beforeAll(async () => insertFlags(insertResults, exampleFlagDrafts.slice(0, 3)));

    it("finds the right record from a query on its name", async () => {
      const first = insertResults[0];
      if (first === null) return;

      const result = await repoManager.featureFlag.findOne({ name: 'testing flag' });
      expect(result?.id).toEqual(first);
    });

    it("finds the right record from a substring match on description", async () => {
      const second = insertResults[1];
      if (second === null) return;

      const result = await repoManager.featureFlag.findOne({ description: { $regex: /server-sent events/ } });
      expect(result?.id).toEqual(second);
    });

    it("Returns null if no records match the query", async () => {
      const result = await repoManager.featureFlag.findOne({ name: 'asdfoasihgda'});
      expect(result).toBeNull();
    });
    
    afterAll(eraseTestData);
  });

  describe('update', () => {
    let insertResults: string[] = [];
    beforeAll(async () => insertFlags(insertResults, exampleFlagDrafts.slice(0, 3)));

    it("overwrites specified fields when passed a partial object", async () => {
      const first = insertResults[0];

      const updateObject = {
        id: first,
        value: {
          type: 'number' as const,
          initial: 3,
        },
      };
      const result = await repoManager.featureFlag.update(updateObject);
      expect(result).toBe(true);

      const updatedFirst = await repoManager.featureFlag.get(first);
      expect(updatedFirst).toMatchObject(updateObject);
    });

    it("doesn't modify fields not passed in the update object", async () => {
      const second = insertResults[1];
      const original = exampleFlagDrafts[1];

      const updateName = 'updated testing flag';
      const result = await repoManager.featureFlag.update({ id: second, name: updateName });
      expect(result).toBe(true);

      const updatedFirst = await repoManager.featureFlag.get(second);
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
      const updateObject = {
        id: ObjectId.createFromTime(1).toHexString(),
        name: 'asdfoasihgda',
      };
      const result = await repoManager.featureFlag.update(updateObject);

      const allFlags = await repoManager.featureFlag.getMany();

      expect(allFlags).not.toContainEqual(updateObject);
    });
    
    afterAll(eraseTestData);
  });

  // WIP
  describe('updateKeySafe', () => {
    let insertResults: string[] = [];
    beforeAll(async () => insertFlags(insertResults, exampleFlagDrafts.slice(0, 3)));

    it("Changes the value on a single property", async () => {
      const first = insertResults[0];

      const result = await repoManager.featureFlag.updateKeySafe(first, 'value.initial', true);
      expect(result).toBe(true);

      let updatedFirst = await repoManager.featureFlag.get(first);
      // expect(updatedFirst).not.toBeNull();
      expect(updatedFirst.value).toMatchObject({ type: 'boolean', initial: true });
    });
    

    it.skip("Rejects changes that break the schema", async () => {
      const first = insertResults[0];
      const firstDoc = await repoManager.featureFlag.get(first);
      // console.log(firstDoc);

      // const result = await repo.featureFlag.updateKey(first, 'value.initial', true);
      const result = await repoManager.featureFlag.updateKeySafe(first, 'value.type', 'number') // this might break the schema
      // expect(result).toBeFalsy();
      const updatedFirst = await repoManager.featureFlag.get(first);
      // console.log(updatedFirst)
      expect(updatedFirst.value).toMatchObject({ type: 'boolean', initial: true });
    });
    
    afterAll(eraseTestData);
  });

  // WIP
  describe('pushTo', () => {
    let insertResults: string[] = [];
    beforeAll(async () => insertFlags(insertResults, exampleFlagDrafts.slice(0, 3)));

    it("Adds an element to an array", async () => {
      const first = insertResults[0];
      // const firstDoc = await repo.featureFlag.get(first);
      // console.log(firstDoc);

      const newRule: ForcedValue = {
        id: randomUUID(),
        type: 'ForcedValue',
        description: null,
        startTimestamp: null,
        endTimestamp: null,
        status: 'draft',
        value: true,
        environmentName: 'dev',
        enrollment: {
          attributes: [],
          proportion: 1,
        }
      };
      const result = await repoManager.featureFlag.pushTo('environments.staging.overrideRules', newRule, first);
      expect(result.acknowledged).toBe(true);

      const updatedFirst = await repoManager.featureFlag.get(first);
      expect(updatedFirst.environments.staging.overrideRules).toContainEqual(newRule);
    });
    
    afterAll(eraseTestData);
  });

  // WIP
  describe('pull', () => {
    let insertResults: string[] = [];

    beforeAll(async () => {
      const result = await insertFlags(insertResults, staticFlagDrafts.slice(0, 1));
      // const result = await repo.featureFlag.create(staticFlagDrafts[0]);
      // insertResults.push(result);
    });

    it("Removes an element from an array given a partial version of it", async () => {
      const firstId = insertResults[0];
      const forcedValueRule: OverrideRuleUnion = staticFlagDrafts[0].environments.prod.overrideRules[0];
      const firstDoc = await repoManager.featureFlag.get(firstId);
      const { environments, id, name, ...matcher } = firstDoc;

      const result = await repoManager.featureFlag.pull(
        'environments.prod.overrideRules', 
        forcedValueRule, 
        matcher,
      );
      expect(result.acknowledged).toBe(true);

      const updatedFirst = await repoManager.featureFlag.get(firstId);
      expect(updatedFirst.environments.dev.overrideRules).not.toContainEqual(forcedValueRule);
    });

    it('Removes an element from multiple documents', async () => {
      const forcedValueRule = staticFlagDrafts[0].environments.prod.overrideRules[0];

      const matcher = {
        'value.type': 'boolean'
      };

      const result = await repoManager.featureFlag.pull(
        'environments.prod.overrideRules', 
        forcedValueRule, 
        matcher,
      );
      expect(result.acknowledged).toBe(true);
    });
    
    afterAll(eraseTestData);
  });

  // WIP
  describe('pullFrom', () => {
    let insertResults: (string | null)[] = [];
    beforeAll(async () => {
      const result = await repoManager.featureFlag.create(staticFlagDrafts[0]);
      insertResults.push(result);
    });

    it("Removes an element from an array given the document's ID", async () => {
      const firstId = insertResults[0];
      if (firstId === null) return;
      const firstDoc = await repoManager.featureFlag.get(firstId);
      // console.log(firstDoc);

      const ruleToRemove = staticFlagDrafts[0].environments.dev.overrideRules[0];

      const result = await repoManager.featureFlag.pullFrom('environments.dev.overrideRules', ruleToRemove, firstId);
      expect(result.acknowledged).toBe(true);

      const updatedFirst = await repoManager.featureFlag.get(firstId);
      expect(updatedFirst.environments.dev.overrideRules).not.toContainEqual(ruleToRemove);
    });

    afterAll(eraseTestData);
  });

  describe('delete', () => {
    let insertResults: string[] = [];
    beforeAll(async () => insertFlags(insertResults, exampleFlagDrafts.slice(0, 3)));

    it("deletes the right record given a valid id", async () => {
      const first = insertResults[0];

      const result = await repoManager.featureFlag.delete(first);
      expect(result).toBe(true);
      expect(async () => await repoManager.featureFlag.get(first)).rejects.toThrow();
    });

    it("Throws an error if no records matches the passed id", async () => {
      const fakeId = ObjectId.createFromTime(0).toHexString();
      expect(async () => await repoManager.featureFlag.delete(fakeId)).rejects.toThrow();
    });
    
    afterAll(eraseTestData);
  });
});

describe('MongoRepository Helper Methods', () => {
  describe('keyPathToObject', () => {
    it('Creates a nested object given a dot-separated keyPath', () => {
      const path = 'environments.prod.enabled';
      const newValue = false;
      const result = repoManager.featureFlag._keyPathToObject(path, newValue);
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