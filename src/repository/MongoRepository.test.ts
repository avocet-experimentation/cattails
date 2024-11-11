import { MongoClient, ObjectId } from 'mongodb';
import env from '../envalid.js';
import { FFlagRepository, ExperimentRepository } from './';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { exampleFlags, getExampleFlag } from '../lib/testData.js';

const fflagRepo = new FFlagRepository(env.MONGO_TESTING_URI);
// const experimentRepo = new ExperimentRepository(env.MONGO_TESTING_URI);

const insertExampleFlags = async (resultsArray: (string | null)[]) => {
  const promises = [
    fflagRepo.create(exampleFlags[0]),
    fflagRepo.create(exampleFlags[1]),
  ];

  const resolved = await Promise.all(promises);
  resultsArray.splice(resultsArray.length, 0, ...resolved);
}

const eraseTestData = async () => {
  const client = new MongoClient(env.MONGO_TESTING_URI);
  await client.db().dropCollection('flags');
  await client.db().dropCollection('experiments');
}

beforeAll(eraseTestData);

describe('Feature Flags', () => {
  
  describe('create', () => {
    beforeEach(eraseTestData);

    it("creates a flag and returns its `ObjectId` as a string if passed an object with no `.id`", async () => {
      const result = await fflagRepo.create(getExampleFlag());
      expect(typeof result).toBe('string');
    });

    // it("rejects if passed an object with a `.id`", async () => {
    //   const input = { ...getExampleFlag(), id: crypto.randomUUID() };
    //   // const badInsert = async () => await db.createFlag(input);
    //   expect(async () => await fflagRepo.create(input)).rejects.toThrow();
    // });

    afterAll(eraseTestData);
  });

  describe('getMany', () => {
    beforeAll(async () => {
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

  describe('find', () => {
    let insertResults: (string | null)[] = [];
    beforeAll(async () => insertExampleFlags(insertResults));

    it("finds the right record from a query on its name", async () => {
      const first = insertResults[0];
      if (first === null) return;

      const result = await fflagRepo.find({ name: 'testing flag' });
      expect(result).not.toBeNull();
      expect(result?.id).toEqual(first);
    });

    it("finds the right record from a substring match on description", async () => {
      const second = insertResults[1];
      if (second === null) return;

      const result = await fflagRepo.find({ description: { $regex: /server-sent events/ } });
      expect(result).not.toBeNull();
      expect(result?.id).toEqual(second);
    });

    it("returns null if no records match the query", async () => {
      const result = await fflagRepo.find({ name: 'asdfoasihgda'});
      expect(result).toBeNull();
    });
    
    afterAll(eraseTestData);
  });

  // WIP
  describe('update', () => {
    let insertResults: (string | null)[] = [];
    beforeAll(async () => await insertExampleFlags(insertResults));

    it("overwrites specified fields", async () => {
      const first = insertResults[0];
      if (first === null) return;

      const updateObject = {
        id: first,
        value: {
          type: 'number' as const,
          default: 3,
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
      const reconstructed = { ...updatedFirst, name: original.name };
      expect(reconstructed).toStrictEqual({ id: second, ...original });
    });

    it("doesn't overwrite if no document matches the `id`", async () => {
      const result = await fflagRepo.find({ name: 'asdfoasihgda'});
      expect(result).toBeNull();
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

afterAll(eraseTestData);