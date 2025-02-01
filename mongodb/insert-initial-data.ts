import { ClientPropDefDraft, EnvironmentDraft } from '@avocet/core';
import { Insert } from '@avocet/mongo-client';
import cfg from '../src/envalid.js';

const insert = new Insert(cfg.MONGO_ADMIN_URI);

const defaultEnvironments: EnvironmentDraft[] = [
  EnvironmentDraft.template({ name: 'testing' }),
  EnvironmentDraft.template({ name: 'production', pinToLists: true }),
  EnvironmentDraft.template({ name: 'staging' }),
  EnvironmentDraft.template({
    name: 'dev',
    defaultEnabled: true,
    pinToLists: true,
  }),
];

await insert.environments(defaultEnvironments);

const defaultClientPropDefs: ClientPropDefDraft[] = [
  ClientPropDefDraft.template({
    name: 'id',
    dataType: 'string',
    isIdentifier: true,
  }),
];

await insert.clientPropDefs(defaultClientPropDefs);

// eslint-disable-next-line no-console
console.log('initial data inserted');
process.exit(0);
