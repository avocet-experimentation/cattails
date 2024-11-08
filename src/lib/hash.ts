// const crypto = require('crypto')
import { ClientSessionAttribute } from '@estuary/types';
import crypto from 'node:crypto';
/*
MD5 vs DJB2:
- MD5 is more collision resistant so it is prefereable to be used for larget data sets.
- DJB2 is faster and more lightweight, as it relies on bitwise operations and some arithmetic. Ideal for frequent hashing. MD5 is has greater computation costs
- MD5 produces a larger range of values (128bit hash) (less collision resistance) than DJB2 (32bit hash)

- MD5 is better suited where more collision resistance is needed, DJB2 is ideal for fast hash computations
- MD5 adds more dependency by use of crypto module, DJB2 has no depdencies.

*/

// function hashIdentifiers <T extends boolean | string | number> (identifiers: { [attributeName: string]: string }, flagValues: Set<T>): T {
//

type Identifier = ClientSessionAttribute;

// }
//DJB2 Hash function.
export function hashIdentifiers(identifiers: readonly Identifier[]) {
  const sortedIdentifiers = identifiers.toSorted((a, b) => (a.name > b.name) ? 1 : -1);
  let string = '';

  sortedIdentifiers.forEach(({ name, dataType, value }) => {
    string += name + value;
  });
  
  let hash = 0;
  //iterate over the string, use bitwise left shift operator, which is essentially multiply the value by 32 -- increases significance of the current hash value.
  // subtract the hash from the result
  //Add the utf char value
  for (let i = 0; i < string.length; i++) {
    hash = (hash << 5) - hash + string.charCodeAt(i); 
    hash |= 0; // Convert to 32bit integer -- bitwise OR operator(?)
  }
  // console.log({stringIdentifiers});
  // return stringIdentifiers;
  return hash;
}

/**
 * Hash identifiers for pseudo-random assignment to one of many options
 * todo:
 * - change assignment options to Array<{ id: string, weight: proportion }>
 * @param identifiers An array of values to use collectively as a unique identifier for the client
 * @param assignmentOptions An array of IDs for possible assignments
 * @returns one of the options passed in
 */
export function hashAndAssign(identifiers: readonly Identifier[], assignmentOptions: readonly string[]): string {
  const hash = hashIdentifiers(identifiers);
  const sortedOptions = [...assignmentOptions].sort();
  const index = Math.abs(hash) % sortedOptions.length;
  return sortedOptions[index];
}

// const flagValues = ['active', 'inactive', 'pending', 'suspended'];

// console.log(hashAndAssign({z: 'z',  az: 'a', ab: 'ab', bc: 'b', email: 'sean.a.mentele@gmail.com', name: 'sean'}, flagValues) === hashAndAssign({ email: 'sean.a.mentele@gmail.com', name: 'sean', z: 'z',  az: 'a', ab: 'ab', bc: 'b'}, flagValues));
// console.log(hashAndAssign({name: 'sean', email: 'sean.a.mentele@gmail.com'}, flagValues) ===  hashAndAssign({email: 'sean.a.mentele@gmail.com', name: 'sean'}, flagValues))
// console.log(hashAndAssign({userId: "12345", userName: "john_doe"}, flagValues));
// console.log(hashAndAssign({name: 'sean', email: 'sean.a.mentele@gmail.com'}, flagValues));

// function hashIdentifiersMD5(identifiers: Identifier[]) {
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

// function hashAndAssignMD5(identifiers: Identifier[], flagValues=['Control', 'Variant']) {
//   const hashInt = hashIdentifiersMD5(identifiers);
//   const flagArray = Array.from(flagValues).sort();

//   const index = Number(hashInt % BigInt(flagArray.length))

//   return flagArray[index];
// }

// console.log(hashAndAssignMD5({z: 'z',  az: 'a', ab: 'ab', bc: 'b', email: 'sean.a.mentele@gmail.com', name: 'sean'}, flagValues));