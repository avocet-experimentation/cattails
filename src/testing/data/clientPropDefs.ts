import { ClientPropDefDraft } from '@avocet/core';

export const staticClientPropDefs: ClientPropDefDraft[] = [
  ClientPropDefDraft.template({
    name: 'id',
    dataType: 'string',
    isIdentifier: true,
  }),
  ClientPropDefDraft.template({
    name: 'version',
    dataType: 'number',
  }),
];
