/* eslint-disable no-console */

import { exampleFlagDrafts } from './data/featureFlags.js';
import { staticClientPropDefs } from './data/clientPropDefs.js';
import { staticSDKConnections } from './data/sdkConnections.js';
import { exampleEnvironmentArray } from './data/environments.js';
import { exampleExperiments } from './data/experiment-data.js';
import { staticUser } from './data/user.js';
import {
  colls,
  eraseTestData,
  insertSDKConnections,
  insertClientPropDefs,
  insertEnvironments,
  insertExperiments,
  insertFeatureFlags,
  insertUsers,
} from '../repository/insert-helpers.js';

await eraseTestData();
await insertUsers([staticUser]);
await insertExperiments(exampleExperiments);
await insertEnvironments(exampleEnvironmentArray);
await insertEnvironments(exampleEnvironmentArray);
await insertSDKConnections(staticSDKConnections);
await insertFeatureFlags([exampleFlagDrafts[0]]);
await insertClientPropDefs(staticClientPropDefs);

console.log('Flags:', await colls.featureFlag.findMany({}));
console.log('Client Connection:', await colls.sdkConnection.findMany({}));
console.log('Experiment:', await colls.experiment.findMany({}));
console.log('Environment:', await colls.environment.findMany({}));
console.log('Client Prop Defs: ', await colls.clientPropDef.findMany({}));
console.log('User:', await colls.user.findMany({}));
