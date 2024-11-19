import { ClientIdentifier, ClientPropValue } from '@estuary/types';
import crypto from 'node:crypto';
/*
MD5 vs DJB2:
- MD5 is more collision resistant so it is prefereable to be used for larget data sets.
- DJB2 is faster and more lightweight, as it relies on bitwise operations and some arithmetic. Ideal for frequent hashing. MD5 is has greater computation costs
- MD5 produces a larger range of values (128bit hash) (less collision resistance) than DJB2 (32bit hash)

- MD5 is better suited where more collision resistance is needed, DJB2 is ideal for fast hash computations
- MD5 adds more dependency by use of crypto module, DJB2 has no depdencies.

*/


/**
 * Hash identifiers for pseudo-random assignment to one of many options
 * todo:
 * - change assignment options to Array<{ id: string, weight: proportion }>
 * @param identifiers An array of values to use collectively as a unique identifier for the client
 * @param assignmentOptions An array of IDs for possible assignments
 * @returns one of the options passed in
 */
export function hashAndAssign(
  identifiers: [string, ClientPropValue][],
  assignmentOptions: readonly string[]
): string {
  const hash = hashIdentifiers(identifiers);
  const sortedOptions = [...assignmentOptions].sort();
  const index = Math.abs(hash) % sortedOptions.length;
  return sortedOptions[index];
}

export function hashAndCompare(
  identifiers: [string, ClientPropValue][],
  proportion: number
): boolean {
  if (proportion === 0) return false;
  const hash = hashIdentifiers(identifiers);
  const compareValue = (proportion * 2 ** 32) - (2 ** 31) - 1;
  return hash < compareValue;
}

/**
 * DJB2 Hash function.
 * @param input 
 * @returns a signed 32-bit integer
 */
function hashStringDJB2(input: string) {
  let hash = 0;
  // iterate over the string, use bitwise left shift operator, which is essentially multiply the value by 32 -- increases significance of the current hash value.
  // subtract the hash from the result
  // Add the utf char value
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i); 
    // console.log('left shifted:', hash)
    hash |= 0; // Convert to 32bit integer -- bitwise OR operator(?)
    // console.log('converted to 32 bit:', hash)
  }

  return hash;
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

function hashIdentifiers(identifiers: ClientIdentifier[]) {
  const sortedIdentifiers = identifiers.toSorted();
  let string = '';

  sortedIdentifiers.forEach(([ name, value ]) => {
    string += name + value;
  });

  return hashStringDJB2(string);
}

// function hashIdentifiersMD5(identifiers: string[]) {
//   const sortedKeys = Object.keys(identifiers).sort();
//   let string = '';

//   sortedKeys.forEach((key) => {
//     string += identifiers[key];
//   });
  
//   //Create a new MD5 hash instance -> Produces 128bit hash value (32char hexadecimal string)
//   const hexString = crypto.createHash('md5')
//     .update(string) //Feed the input string into the hash instance
//     .digest('hex'); //Specify hex to return a hexidecimal string
//   const hash = BigInt('0x' + hexString); //Converts to BigInt

//   return hash;
// }

// function hashAndAssignMD5(identifiers: string[], flagValues=['Control', 'Variant']) {
//   const hashInt = hashIdentifiersMD5(identifiers);
//   const flagArray = Array.from(flagValues).sort();

//   const index = Number(hashInt % BigInt(flagArray.length))

//   return flagArray[index];
// }

// console.log(hashAndAssignMD5({z: 'z',  az: 'a', ab: 'ab', bc: 'b', email: 'sean.a.mentele@gmail.com', name: 'sean'}, flagValues));