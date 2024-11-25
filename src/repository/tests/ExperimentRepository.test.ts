import { afterAll, beforeAll, beforeEach, describe, expect, expectTypeOf, it } from 'vitest';
import { exampleFlagDrafts, staticFlagDrafts } from '../../testing/data/featureFlags.js';
import { staticExperiments } from '../../testing/data/experiment-data.js';
import {
  repoManager,
  eraseTestData,
  insertFlags,
  insertExperiments,
} from '../../testing/testing-helpers.js';
import { printDetail } from '../../lib/index.js';
import { ObjectId } from 'mongodb';
import { ExperimentGroup, ExperimentReference, FeatureFlagDraft, FlagValueDefImpl, idMap, Treatment } from '@estuary/types';

beforeAll(eraseTestData);

const setupExperimentRepoTests = async (insertResults: string[]) => {
  await eraseTestData();
  await insertFlags(insertResults, staticFlagDrafts.slice(0, 2));
  await insertExperiments(insertResults, staticExperiments);
  // console.log('---- FINISHED INSERTING SETUP DATA -----');
};


describe('Embed methods', () => {
  describe('createEmbeds', () => {
    let insertResults: string[] = [];
    beforeEach(async () => {
      await eraseTestData();
      await insertFlags(insertResults, staticFlagDrafts.slice(0, 2));
      await insertExperiments(insertResults, staticExperiments);
      // console.log('---- FINISHED INSERTING SETUP DATA -----')
    });

    it("creates an embedded ExperimentReference on a flag given valid input", async () => {
      const expDraft = { ...staticExperiments[0] };
      const flags = await repoManager.featureFlag.getMany(2);
      if (!flags.length) throw new Error('Flags should exist!');
      
      const { groups, environmentName } = expDraft;
      const expDoc = await repoManager.experiment.findOne({ name: expDraft.name });
      if (!expDoc) throw new Error(`Experiment ${expDraft.name} should exist!`);

      expDoc.flagIds.push(flags[0].id);
      // printDetail({expDoc});
      const embedsCreated = await repoManager.experiment._createEmbeds(expDoc);
      expect(embedsCreated).toBe(true);

      const findQuery = { _id: ObjectId.createFromHexString(expDoc.flagIds[0]) };
      const updatedFlags = await repoManager.featureFlag.findMany(findQuery);
      // printDetail({ updatedFlag: updatedFlags[0] })
      expect(updatedFlags).toHaveLength(1);
      const updatedRules = updatedFlags[0].overrideRules;
      // printDetail({updatedRules});
      const { startTimestamp, endTimestamp, ...rest } = new ExperimentReference(expDoc);
      const match = updatedRules.find((rule) => 'id' in rule && rule.id === expDoc.id);
      expect(match).toMatchObject(rest);

    });

    it.skip("returns true if passed a valid experiment with an empty flagIds array", async () => {
    });

    it.skip("throws an error if any IDs on `flagIds` match no flags", async () => {
    });

    afterAll(eraseTestData);
  });

  describe('startExperiment', () => {
    let insertResults: string[] = [];
    beforeEach(async () => setupExperimentRepoTests(insertResults));

    it("creates an embedded ExperimentReference on a flag given valid input", async () => {
      const now = Date.now();
      const expDraft = { ...staticExperiments[0] };
      const flags = await repoManager.featureFlag.getMany(2);
      if (!flags.length) throw new Error('Flags should exist!');
      
      const { groups, environmentName } = expDraft;
      const expDoc = await repoManager.experiment.findOne({ name: expDraft.name });
      if (!expDoc) throw new Error(`Experiment ${expDraft.name} should exist!`);

      const newFlag = FeatureFlagDraft.template({
        name: 'new-feature-toggle',
        value: FlagValueDefImpl.template('boolean'),
      });

      const newFlagId = await repoManager.featureFlag.create(newFlag);

      // printDetail({ beforeStarting: expDoc });

      // add the flag and a group with two treatments
      const treatments = [
        Treatment.template({ name: 'Control', flagStates: [{ id: newFlagId, value: false }] }),
        Treatment.template({ name: 'Experimental', flagStates: [{ id: newFlagId, value: true }] }),
      ];
      const group = ExperimentGroup.template({ name: 'Users', sequence: [], cycles: 2 });
      expDoc.flagIds.push(newFlagId);
      expDoc.definedTreatments = idMap(treatments);
      expDoc.groups.push(group);

      const updateResult = await repoManager.experiment.update(expDoc);
      if (!updateResult) throw new Error('Update failed');
      
      const startResult = await repoManager.experiment.startExperiment(expDoc.id);
      expect(startResult).toBe(true);
      
      const updatedExpDoc = await repoManager.experiment.get(expDoc.id);
      // printDetail({updatedExpDoc});

      expect(updatedExpDoc.status).toBe('active');
      expect(typeof updatedExpDoc.startTimestamp).toBe('number');
      expect(updatedExpDoc.startTimestamp).toBeGreaterThanOrEqual(now);
      expect(updatedExpDoc.startTimestamp).toBeLessThanOrEqual(Date.now());


      // expDoc.flagIds.push(flags[0].id);
      // // printDetail({expDoc});
      // const embedsCreated = await repoManager.experiment._createEmbeds(expDoc);
      // expect(embedsCreated).toBe(true);

      // const findQuery = { _id: ObjectId.createFromHexString(expDoc.flagIds[0]) };
      // const updatedFlags = await repoManager.featureFlag.findMany(findQuery);
      // // printDetail({ updatedFlag: updatedFlags[0] })
      // expect(updatedFlags).toHaveLength(1);
      // const updatedRules = updatedFlags[0].environments[environmentName].overrideRules;
      // // printDetail({updatedRules});
      // const { startTimestamp, endTimestamp, ...rest } = new ExperimentReference(expDoc);
      // const match = updatedRules.find((rule) => 'id' in rule && rule.id === expDoc.id);
      // expect(match).toMatchObject(rest);

    });

    it.skip("returns true if passed a valid experiment with an empty flagIds array", async () => {
    });

    it.skip("throws an error if any IDs on `flagIds` match no flags", async () => {
    });

    afterAll(eraseTestData);
  });

  // WIP
  describe('deleteEmbeds', () => {
    let insertResults: string[] = [];
    beforeEach(async () => {
      await eraseTestData();
      const flagInsertResults: string[] = [];
      await insertFlags(flagInsertResults, staticFlagDrafts.slice(0, 2));
      
      const expWithFlag = { ...staticExperiments[0] };
      expWithFlag.flagIds.push(flagInsertResults[0], flagInsertResults[1]);

      await insertExperiments(insertResults, [expWithFlag]);
      // console.log('---- FINISHED INSERTING SETUP DATA -----');
    });

    it("Removes matching embeds from all flags, and returns true", async () => {
      const experimentId = insertResults[0];
      // console.log({experimentId})
      const originalFlags = await repoManager.featureFlag.getMany();
      // printDetail({originalFlags})
      // const experimentDoc = await repoManager.experiment.get(experimentId);
      const embedDeleteResult = await repoManager.experiment._deleteEmbeds(experimentId);
      expect(embedDeleteResult).toBe(true);
      // const insertedExperiment = await repoManager.experiment.get(insertResults[0]);
      const updatedFlags = await repoManager.featureFlag.getMany();
      // printDetail({updatedFlags})
      const ruleSets = updatedFlags.map((flag) => flag.overrideRules);
      expect(ruleSets).toHaveLength(2);
      // printDetail({deleteRuleSets: ruleSets});

      // printDetail({insertedExperiment});
      expect(ruleSets[0].find((rule) => rule.id === experimentId)).toBeUndefined();
      expect(ruleSets[1].find((rule) => rule.id === experimentId)).toBeUndefined();
      expect(embedDeleteResult).toBe(true);
    });

    it.skip("Returns false (throws?) when ", async () => {
    });
    
    afterAll(eraseTestData);
  });

  describe('updateEmbeds', () => {
    let insertResults: string[] = [];
    beforeEach(async () => {
      await eraseTestData();
      const flagInsertResults: string[] = [];
      await insertFlags(flagInsertResults, staticFlagDrafts.slice(0, 2));
      
      const expWithFlag = { ...staticExperiments[0] };
      expWithFlag.flagIds.push(flagInsertResults[0], flagInsertResults[1]);

      await insertExperiments(insertResults, [expWithFlag]);
      // console.log('---- FINISHED INSERTING SETUP DATA -----');
    });

    it("overwrites the specified fields on embeds", async () => {
      const experimentDoc = await repoManager.experiment.get(insertResults[0]);
      const flagsWithEmbed = await repoManager.experiment._getDocumentsWithEmbeds(experimentDoc.id);
      // printDetail({flagsWithEmbed})
      const ruleSets = flagsWithEmbed.map((flag) => flag.overrideRules);
      // printDetail({updateRuleSets: ruleSets});
      // const ruleMatcher = { id: experimentDoc.id };
      // expect([ { id: 1, name: 'test' } ]).toMatchObject({ id: 1 })
      expect(ruleSets).toHaveLength(2);
      expect(ruleSets[0].find((rule) => rule.id === experimentDoc.id)).not.toBeUndefined();
      expect(ruleSets[1].find((rule) => rule.id === experimentDoc.id)).not.toBeUndefined();

      const currentEmbedReference = ruleSets[0].find((rule) => rule.id === experimentDoc.id);
      if (!currentEmbedReference) throw new Error('rule should exist!');
      if (currentEmbedReference.type !== 'ExperimentReference') {
        throw new Error('rule should be an ExperimentReference!');
      }

      const partialUpdate = {
        id: experimentDoc.id,
        startTimestamp: Date.now(),
      }
      
      const updateResult = await repoManager.experiment._updateEmbeds(partialUpdate);
      
      expect(updateResult).toBe(true);
      
      const updatedFlagsWithEmbed = await repoManager.featureFlag
        .findMany({ _id: { $in: experimentDoc.flagIds.map(ObjectId.createFromHexString) }});

      console.log({ experimentId: experimentDoc.id })
      printDetail({updatedFlagsWithEmbed})
      const updatedEmbedReferences = updatedFlagsWithEmbed
        .map((flag) => flag.overrideRules)
        .map((ruleSet) => ruleSet.filter((rule) => rule.id === experimentDoc.id))
        .flat();
      
      console.log({ expId: experimentDoc.id })
      expect(updatedEmbedReferences).toHaveLength(2);
      printDetail({updatedEmbedReferences});
      expect(typeof updatedEmbedReferences[0].startTimestamp).toEqual('number');
      expect(typeof updatedEmbedReferences[1].startTimestamp).toEqual('number');


      
    });

    it("doesn't modify fields on embeds that were not passed", async () => {
      // const second = insertResults[1];
      // const original = exampleFlagDrafts[1];
      // if (second === null) return;

      // const updateName = 'updated testing flag';
      // const result = await repo.featureFlag.update({ id: second, name: updateName });
      // expect(result).toBeTruthy();

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

    it.skip("Makes no changes if no embed matches", async () => {
      // const result = await repo.featureFlag.update({ id: ObjectId.createFromTime(1).toHexString(), name: 'asdfoasihgda'});
      // expect(result).toBeFalsy();
    });
    
    afterAll(eraseTestData);
  });
  // might not implement this method
  describe.skip('getEmbeds', () => {
    let insertResults: string[] = [];
    beforeAll(async () => {
      await eraseTestData();
      // const insertions = new Array(10)
      //   .fill(null)
      //   .map(() => repo.featureFlag.create(getExampleFlag()));
      // await Promise.all(insertions);
      await insertFlags(insertResults, exampleFlagDrafts);
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

});

afterAll(eraseTestData);