import RepositoryManager from '../src/repository/RepositoryManager.js';
import cfg from '../src/envalid.js';

const colls = new RepositoryManager(cfg.MONGO_ADMIN_URI);

// ensure documents have unique names
await colls.featureFlag.collection.createIndex({ name: 1 }, { unique: true });
await colls.experiment.collection.createIndex({ name: 1 }, { unique: true });
await colls.environment.collection.createIndex({ name: 1 }, { unique: true });
await colls.clientPropDef.collection.createIndex({ name: 1 }, { unique: true });
await colls.sdkConnection.collection.createIndex({ name: 1 }, { unique: true });

// ensure only one user account exists per email address
await colls.user.collection.createIndex({ email: 1 }, { unique: true });

// for efficient lookup of which flags are enabled on a given environment
await colls.featureFlag.collection.createIndex({ 'environmentNames.$**': 1 });
await colls.featureFlag.collection.createIndex({
  'overrideRules.environmentName': 1,
});

// ensure groups have unique IDs
await colls.experiment.collection.createIndex(
  { 'groups.id': 1 },
  { unique: true },
);

// for efficient lookup of treatments by their IDs
await colls.experiment.collection.createIndex({ 'definedTreatments.$**': 1 });

// eslint-disable-next-line no-console
console.log('Indexes created');
process.exit(0);
