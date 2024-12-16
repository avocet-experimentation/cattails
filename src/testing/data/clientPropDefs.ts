import { ClientPropDefDraft } from '@avocet/core';

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
