import { ClientConnectionDraft } from '@avocet/core';

export const staticClientConnections: ClientConnectionDraft[] = [
  ClientConnectionDraft.template({
    name: 'test',
    environmentId: 'testing patch',
    description: 'testing',
  }),
];
