/* eslint-disable no-bitwise */
import { ClientPropEntries, ClientPropValue, sortByKey } from '@estuary/types';
import { randomUUID } from 'node:crypto';

/**
 * DJB2 Hash function.
 * @param input
 * @returns a signed 32-bit integer
 */
export function hashStringDJB2(input: string) {
  const str = input.length === 0 ? randomUUID() : input;
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }

  return hash;
}

function hashIdentifiers(identifiers: ClientPropEntries, sort: boolean = true) {
  const sortedIdentifiers = sort ? identifiers.toSorted() : identifiers;
  let string = '';

  sortedIdentifiers.forEach(([name, value]) => {
    string += name + value;
  });

  return hashStringDJB2(string);
}

/**
 * Hash identifiers for pseudo-random assignment to one of many options
 * @param identifiers An array of values to use collectively as a unique identifier for the client
 * @returns one of the options passed in
 */
export function hashAndAssign(
  identifiers: [string, ClientPropValue][],
  assignmentOptions: readonly { id: string; weight: number }[],
  sort: boolean = true,
): string {
  const hash = hashIdentifiers(identifiers, sort);
  //
  const weightSum = assignmentOptions.reduce(
    (acc, option) => acc + option.weight,
    0,
  );
  const options = sort
    ? sortByKey([...assignmentOptions], 'id')
    : assignmentOptions;

  // map to weight + prev weight
  // iterating upwards, find the first one larger than the calculated hash
  const positionedOptions = options.reduce(
    (acc: { id: string; hash: number }[], option, i, arr) => {
      const previousWeight = i > 0 ? arr[i - 1].weight : 0;
      const newElement = {
        id: option.id,
        hash: option.weight + previousWeight,
      };
      acc.push(newElement);
      return acc;
    },
    [],
  );
  const hashModulo = hash % weightSum;
  const selected = positionedOptions.find(
    (option) => option.hash >= hashModulo,
  );
  if (!selected) {
    throw new Error(
      "The hash modulo was larger than all the options' hashes."
        + " This shouldn't happen",
    );
  }
  return selected.id;
}

export function hashAndCompare(
  identifiers: [string, ClientPropValue][],
  proportion: number,
): boolean {
  if (proportion === 0) return false;
  const hash = hashIdentifiers(identifiers);
  const compareValue = proportion * 2 ** 32 - 2 ** 31 - 1;
  return hash < compareValue;
}

/**
 * Combines a collection of strings presumed to be unique IDs.
 * Used for creating a hash of experiment, group, and block ID for sending to client
 */
function sortAndCombineIds(ids: readonly string[]): string {
  const sortedIds = ids.toSorted();
  const combined = sortedIds.join('');
  return combined;
}

export function hashStringSet(strings: readonly string[]) {
  const combined = sortAndCombineIds(strings);
  return hashStringDJB2(combined);
}
