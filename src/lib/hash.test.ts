import { describe, it, expect, beforeAll, expectTypeOf, afterAll, beforeEach } from 'vitest';
import { combineIds, hashIdentifiers, hashStringDJB2 } from './hash.js';
import { ObjectId } from 'mongodb';

const exampleObjectIds: readonly string[] = [
  ObjectId.createFromHexString('1c6c26e10000000000000000').toString(),
  ObjectId.createFromHexString('000003e80000000000000000').toString(),
  ObjectId.createFromHexString('02471b830000000000000000').toString(),
];

// WIP - need to test many more varied inputs
describe('hashStringDJB2', async () => {
  it('Returns a 32-bit integer given an array of strings representing ObjectIds', async () => {
    const combined = combineIds(exampleObjectIds);
    const hash = hashStringDJB2(combined);
    expect(hash).toBeGreaterThanOrEqual((-2) ** 31);
    expect(hash).toBeLessThanOrEqual((2 ** 31) - 1);
  })
});
