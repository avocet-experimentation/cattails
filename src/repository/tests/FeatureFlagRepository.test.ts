import {
  afterAll, beforeAll, beforeEach, describe, expect, it,
} from 'vitest';
import { FeatureFlagDraft } from '@estuary/types';
import {
  exampleFlagDrafts,
  getExampleFlag,
  numberForcedValue1,
  staticFlagDrafts,
  staticNumberFlag,
} from '../../testing/data/featureFlags.js';
import {
  repoManager,
  insertFlags,
  eraseTestData,
} from '../../testing/testing-helpers.js';

beforeAll(eraseTestData);

describe('Rule methods', () => {
  describe('addRule', () => {
    const insertResults: string[] = [];
    beforeEach(async () => {
      await eraseTestData();
      await insertFlags(insertResults, staticFlagDrafts.slice(0, 3));
    });

    it('returns true and adds a rule with valid input', async () => {
      const { environmentNames, overrideRules, ...matcher } = staticNumberFlag;
      const acknowledged = await repoManager.featureFlag.addRule(
        numberForcedValue1,
        matcher,
      );
      const updatedFlag = await repoManager.featureFlag.findOne({
        name: staticNumberFlag.name,
      });
      // printDetail({updatedFlag});
      if (updatedFlag === null) throw new Error('Flag should exist!');

      expect(acknowledged).toBe(true);
      expect(updatedFlag.overrideRules).toContainEqual(numberForcedValue1);
    });

    afterAll(eraseTestData);
  });

  // WIP
  describe('removeRule', () => {
    const insertResults: string[] = [];
    beforeEach(async () => {
      await eraseTestData();
      await insertFlags(insertResults, staticFlagDrafts.slice(0, 2));
    });

    it('returns true', async () => {
      const flag = staticFlagDrafts[0];
      const rule = FeatureFlagDraft.getEnvironmentRules(flag, 'prod')[0];
      const { environmentNames, ...matcher } = flag;
      const acknowledged = await repoManager.featureFlag.removeRule(
        rule,
        matcher,
      );
      expect(acknowledged).toBe(true);
    });

    it('Removes all occurrences of a rule for its environment', async () => {
      const flag = staticFlagDrafts[0];
      const rule = FeatureFlagDraft.getEnvironmentRules(flag, 'prod')[0];
      await repoManager.featureFlag.removeRule(rule, {});
      const updated = await repoManager.featureFlag.getMany();
      const updatedRules = [updated[0].overrideRules, updated[1].overrideRules];
      expect(updatedRules[0]).not.toContainEqual(rule);
      expect(updatedRules[1]).not.toContainEqual(rule);
    });

    it('Removes a rule given only a partial rule object', async () => {
      const flagDraft = staticFlagDrafts[0];
      const rule = FeatureFlagDraft.getEnvironmentRules(flagDraft, 'prod')[0];

      const { status, enrollment, ...ruleMatcher } = rule;
      const { name } = flagDraft;
      await repoManager.featureFlag.removeRule(ruleMatcher, { name });
      const updatedFlagDoc = await repoManager.featureFlag.findOne({ name });
      if (!updatedFlagDoc) throw new Error('Flag should exist!');

      const remainingRules = updatedFlagDoc.overrideRules;
      expect(remainingRules).not.toContainEqual(rule);
    });

    // remove?
    it.skip('Returns false (throws?) when ', async () => {});

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

    it('', async () => {});

    afterAll(eraseTestData);
  });

  // WIP; might not implement
  describe.skip('updateRule', () => {
    const insertResults: string[] = [];
    beforeAll(async () =>
      insertFlags(insertResults, exampleFlagDrafts.slice(0, 2)));

    it('overwrites specified fields when passed a partial object', async () => {
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
