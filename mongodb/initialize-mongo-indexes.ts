import RepositoryManager from "../src/repository/RepositoryManager.js";
import cfg from "../src/envalid.js";

const colls = new RepositoryManager(cfg.MONGO_ADMIN_URI);

await colls.featureFlag.collection.createIndex({ 'name': 1 }, { unique: true });
// if changing flag schema:
await colls.featureFlag.collection.createIndex({ 'environmentNames': 1 });
await colls.featureFlag.collection.createIndex({ 'overrideRules.environmentName': 1 });
  
await colls.experiment.collection.createIndex({ 'name': 1 }, { unique: true });
await colls.experiment.collection.createIndex({ 'groups.id': 1 }, { unique: true });
await colls.experiment.collection.createIndex({ 'definedTreatments.id': 1 }, { unique: true });

await colls.environment.collection.createIndex({ 'name': 1 }, { unique: true });
await colls.clientPropDef.collection.createIndex({ 'name': 1 }, { unique: true });

console.log('Indexes created');
process.exit(0);