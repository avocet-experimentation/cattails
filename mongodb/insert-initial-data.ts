import { ClientPropDefDraft, EnvironmentDraft } from '@estuary/types';
import { insertDrafts, repos } from '../src/repository/insert-helpers.js';

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

await insertDrafts(defaultEnvironments, repos.environment);

const defaultClientPropDefs: ClientPropDefDraft[] = [
  ClientPropDefDraft.template({
    name: 'id',
    dataType: 'string',
    isIdentifier: true,
  }),
];

await insertDrafts(defaultClientPropDefs, repos.clientPropDef);

// eslint-disable-next-line no-console
console.log('initial data inserted');
process.exit(0);
