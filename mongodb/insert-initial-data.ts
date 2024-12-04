import { ClientPropDefDraft, EnvironmentDraft } from '@estuary/types';
import { insertArray, repos } from './insert-helpers.js';

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

await insertArray(defaultEnvironments, repos.environment);

const defaultClientPropDefs: ClientPropDefDraft[] = [
  ClientPropDefDraft.template({
    name: 'id',
    dataType: 'string',
    isIdentifier: true,
  }),
];

await insertArray(defaultClientPropDefs, repos.clientPropDef);

// eslint-disable-next-line no-console
console.log('initial data inserted');
process.exit(0);
