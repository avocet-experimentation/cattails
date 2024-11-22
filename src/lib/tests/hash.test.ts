import { describe, it, expect, beforeAll, expectTypeOf, afterAll, beforeEach } from 'vitest';
import { hashStringDJB2, hashStringSet } from '../hash.js';
import { ObjectId } from 'mongodb';
import { randomUUID } from 'crypto';

const exampleObjectIds: readonly string[] = [
  ObjectId.createFromHexString('1c6c26e10000000000000000').toString(),
  ObjectId.createFromHexString('000003e80000000000000000').toString(),
  ObjectId.createFromHexString('02471b830000000000000000').toString(),
];

const exampleUUIDs: readonly string[] = [
  randomUUID(),
  randomUUID(),
  randomUUID(),
];
// WIP - need to test many more varied inputs

describe('HashStringDJB2', async () => {
  it('returns a hash given an empty string', async () => {
    const result = hashStringDJB2('');
    console.log({result})
  });
});

describe('Hashing sets of strings', async () => {
  it('', async () => {
    const hash = hashStringSet([]);
    console.log({hash})
    expect(hash).toBeGreaterThanOrEqual((-2) ** 31);
    expect(hash).toBeLessThanOrEqual((2 ** 31) - 1);
  });

  it('Returns a 32-bit integer given an array of strings representing ObjectIds', async () => {
    const hash = hashStringSet(exampleObjectIds);
    expect(hash).toBeGreaterThanOrEqual((-2) ** 31);
    expect(hash).toBeLessThanOrEqual((2 ** 31) - 1);
  });

  it('Returns a 32-bit integer given an array of UUIDs', async () => {
    const hash = hashStringSet(exampleUUIDs);
    expect(hash).toBeGreaterThanOrEqual((-2) ** 31);
    expect(hash).toBeLessThanOrEqual((2 ** 31) - 1);
  });

  it('Returns the same hash value given the same input', async () => {
    const hash = hashStringSet(exampleUUIDs);
    const hash2 = hashStringSet(exampleUUIDs);
    expect(hash).toEqual(hash2);
  });

  it('Returns different hash values given different inputs', async () => {
    const hash = hashStringSet(exampleObjectIds);
    const hash2 = hashStringSet(exampleUUIDs);
    expect(hash).not.toEqual(hash2);
  });
});
