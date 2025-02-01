/* eslint-disable no-console */

import { Insert } from '@avocet/mongo-client';
import { exampleFlagDrafts } from './data/featureFlags.js';
import { staticClientPropDefs } from './data/clientPropDefs.js';
import { staticSDKConnections } from './data/sdkConnections.js';
import { exampleEnvironmentArray } from './data/environments.js';
import { exampleExperiments } from './data/experiment-data.js';
import { staticUser } from './data/user.js';
import cfg from '../envalid.js';

const insert = new Insert(cfg.MONGO_TESTING_URI);

await insert.eraseTestData();
await insert.users([staticUser]);
await insert.experiments(exampleExperiments);
await insert.environments(exampleEnvironmentArray);
await insert.SDKConnections(staticSDKConnections);
await insert.featureFlags([exampleFlagDrafts[0]]);
await insert.clientPropDefs(staticClientPropDefs);

console.log('Flags:', await insert.manager.featureFlag.findMany({}));
console.log(
  'Client Connection:',
  await insert.manager.sdkConnection.findMany({}),
);
console.log('Experiment:', await insert.manager.experiment.findMany({}));
console.log('Environment:', await insert.manager.environment.findMany({}));
console.log(
  'Client Prop Defs: ',
  await insert.manager.clientPropDef.findMany({}),
);
console.log('User:', await insert.manager.user.findMany({}));
