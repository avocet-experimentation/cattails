import { describe, it, expect } from 'vitest';
import { ObjectId } from 'mongodb';
import { Hash, HASH_MAX } from '@avocet/core';

const exampleObjectIds: readonly string[] = [
  ObjectId.createFromHexString('1c6c26e10000000000000000').toString(),
  ObjectId.createFromHexString('000003e80000000000000000').toString(),
  ObjectId.createFromHexString('02471b830000000000000000').toString(),
];

const exampleUUIDs: readonly string[] = [
  crypto.randomUUID(),
  crypto.randomUUID(),
  crypto.randomUUID(),
];
// WIP - need to test many more varied inputs

describe('HashStringDJB2', async () => {
  it('returns a hash given an empty string', async () => {
    const result = Hash.generate('');
    expect(result).toBe(0);
  });
});

describe('Hashing sets of strings', async () => {
  it('', async () => {
    const hash = Hash.strings([]);
    // console.log({hash})
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(hash).toBeLessThanOrEqual(HASH_MAX);
  });

  it('Returns a 32-bit unsigned integer given an array of strings representing ObjectIds', async () => {
    const hash = Hash.strings(exampleObjectIds);
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(hash).toBeLessThanOrEqual(HASH_MAX);
  });

  it('Returns a 32-bit unsigned integer given an array of UUIDs', async () => {
    const hash = Hash.strings(exampleUUIDs);
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(hash).toBeLessThanOrEqual(HASH_MAX);
  });

  it('Returns the same hash value given the same input', async () => {
    const hash = Hash.strings(exampleUUIDs);
    const hash2 = Hash.strings(exampleUUIDs);
    expect(hash).toEqual(hash2);
  });

  it('Returns different hash values given different inputs', async () => {
    // this isn't guaranteed
    const hash = Hash.strings(exampleObjectIds);
    const hash2 = Hash.strings(exampleUUIDs);
    expect(hash).not.toEqual(hash2);
  });
});
