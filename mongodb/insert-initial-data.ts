import {
  ClientPropDefDraft,
  DraftRecord,
  EnvironmentDraft,
  EstuaryMongoTypes,
} from '@estuary/types';
import RepositoryManager from '../src/repository/RepositoryManager.js';
import cfg from '../src/envalid.js';
import MongoRepository from '../src/repository/MongoRepository.js';

const colls = new RepositoryManager(cfg.MONGO_ADMIN_URI);

const insertArray = async <T extends EstuaryMongoTypes>(
  arr: DraftRecord<T>[],
  collection: MongoRepository<T>,
) => {
  for (let i = 0; i < arr.length; i += 1) {
    await collection.create(arr[i]);
  }
};
const defaultEnvironments: EnvironmentDraft[] = [
  {
    name: 'testing',
    defaultEnabled: false,
  },
  {
    name: 'production',
    defaultEnabled: false,
  },
  {
    name: 'staging',
    defaultEnabled: false,
  },
  {
    name: 'dev',
    defaultEnabled: true,
  },
];

await insertArray(defaultEnvironments, colls.environment);

const defaultClientPropDefs: ClientPropDefDraft[] = [
  ClientPropDefDraft.template({
    name: 'id',
    dataType: 'string',
    isIdentifier: true,
  }),
];

await insertArray(defaultClientPropDefs, colls.clientPropDef);

console.log('initial data inserted');
process.exit(0);
