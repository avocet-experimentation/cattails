import { ClientPropDefDraft } from '@estuary/types';

export const staticClientPropDefs: ClientPropDefDraft[] = [
  {
    name: 'id',
    dataType: 'string',
    isIdentifier: true,
    description: null,
  },
  {
    name: 'version',
    dataType: 'number',
    isIdentifier: false,
    description: null,
  },
];
