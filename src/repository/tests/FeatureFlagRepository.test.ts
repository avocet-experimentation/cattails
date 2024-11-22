import { MongoClient, ObjectId } from 'mongodb';
import cfg from '../../envalid.js';
import { afterAll, beforeAll, beforeEach, describe, expect, expectTypeOf, it } from 'vitest';
import { exampleFlagDrafts, getExampleFlag, numberForcedValue1, staticFlagDrafts, staticFlags, staticNumberFlag, staticRules } from '../../testing/data/featureFlags.js';
import { EstuaryMongoCollectionName, FeatureFlagDraft, ForcedValue, OverrideRuleUnion } from '@estuary/types';
import RepositoryManager from '../RepositoryManager.js';
import { printDetail } from '../../lib/index.js';
import {
  repoManager,
  insertFlags,
  eraseTestData,
} from '../../testing/testing-helpers.js';

beforeAll(eraseTestData);

describe('Rule methods', () => {
  
  describe('addRule', () => {
    let insertResults: string[] = [];
    beforeEach(async () => {
      await eraseTestData();
      await insertFlags(insertResults, staticFlagDrafts.slice(0, 3));
    });

    it("returns true and adds a rule with valid input", async () => {
      const { environments, ...matcher } = staticNumberFlag;
      const acknowledged = await repoManager.featureFlag.addRule(numberForcedValue1, matcher);
      const updatedFlag = await repoManager.featureFlag.findOne({ name: staticNumberFlag.name });
      // printDetail({updatedFlag});
      if (updatedFlag === null) throw new Error('Flag should exist!');

      expect(acknowledged).toBe(true);
      const { overrideRules } = updatedFlag.environments.testing;
      expect(overrideRules).toContainEqual(numberForcedValue1);
    });

    afterAll(eraseTestData);
  });

  // WIP
  describe('removeRule', () => {
    let insertResults: string[] = [];
    beforeEach(async () => {
      await eraseTestData();
      await insertFlags(insertResults, staticFlagDrafts.slice(0, 2));
    });

    it("returns true", async () => {
      const flag = staticFlagDrafts[0];
      const rule = flag.environments.prod.overrideRules[0];
      const { environments, ...matcher } = flag;
      const acknowledged = await repoManager.featureFlag.removeRule(rule, matcher);
      expect(acknowledged).toBe(true);
    });

    it("Removes all occurrences of a rule for its environment", async () => {
      const flag = staticFlagDrafts[0];
      const rule = flag.environments.prod.overrideRules[0];
      // console.log({rule});
      const acknowledged = await repoManager.featureFlag.removeRule(rule, {});
      // console.log({ruleAfter: rule})
      const updated = await repoManager.featureFlag.getMany();
      const updatedRules = [
        FeatureFlagDraft.getRules(updated[0]),
        FeatureFlagDraft.getRules(updated[1]),
      ];
      // printDetail({updatedRules});
      expect(updatedRules[0]).not.toContainEqual(rule);
      expect(updatedRules[1]).not.toContainEqual(rule);
    });

    it("Removes a rule given only a partial rule object", async () => {
      const flagDraft = staticFlagDrafts[0];
      const rule = flagDraft.environments.prod.overrideRules[0];
      // if (!rule) throw new Error('rule should exist!');
      
      const { status, enrollment, ...ruleMatcher } = rule;
      const { name, ...rest } = flagDraft;
      const acknowledged = await repoManager.featureFlag.removeRule(ruleMatcher, { name });
      const updatedFlagDoc = await repoManager.featureFlag.findOne({ name });
      if (!updatedFlagDoc) throw new Error('Flag should exist!');

      const remainingRules = FeatureFlagDraft.getRules(updatedFlagDoc);
      expect(remainingRules).not.toContainEqual(rule);
    });

    // remove?
    it.skip("Returns false (throws?) when ", async () => {
    });
    
    afterAll(eraseTestData);
  });

  describe.skip('getEnvironmentFlags', () => {
    beforeAll(async () => {
      await eraseTestData();
      const insertions = new Array(10)
        .fill(null)
        .map(() => repoManager.featureFlag.create(getExampleFlag()));
      await Promise.all(insertions);
    });

    it("", async () => {
    });


    afterAll(eraseTestData);
  });

  // WIP; might not implement
  describe.skip('updateRule', () => {
    let insertResults: string[] = [];
    beforeAll(async () => await insertFlags(insertResults, exampleFlagDrafts.slice(0, 2)));

    it("overwrites specified fields when passed a partial object", async () => {
      // const first = insertResults[0];

      // const updateObject = {
      //   id: first,
      //   value: {
      //     type: 'number' as const,
      //     initial: 3,
      //   },
      // };
      // const result = await repo.featureFlag.update(updateObject);
      // expect(result).not.toBeNull();

      // const updatedFirst = await repo.featureFlag.get(first);
      // expect(updatedFirst).not.toBeNull();
      // expect(updatedFirst).toMatchObject(updateObject);
    });

    it("doesn't modify fields not passed in the update object", async () => {
      // const second = insertResults[1];
      // const original = exampleFlags[1];
      // if (second === null) return;

      // const updateName = 'updated testing flag';
      // const result = await repo.featureFlag.update({ id: second, name: updateName });
      // expect(result).toBe(true);

      // const updatedFirst = await repo.featureFlag.get(second);
      // expect(updatedFirst).not.toBeNull();
      // if (updatedFirst === null) return;

      // const { createdAt, updatedAt, ...withoutTimeStamps } = updatedFirst;
      // expectTypeOf(createdAt).toBeNumber();
      // expectTypeOf(updatedAt).toBeNumber();
      // expect(updatedAt).toBeGreaterThanOrEqual(createdAt);

      // const reconstructed = { ...withoutTimeStamps, name: original.name };
      // expect(reconstructed).toStrictEqual({ id: second, ...original });
    });

    afterAll(eraseTestData);
  });

});

afterAll(eraseTestData);