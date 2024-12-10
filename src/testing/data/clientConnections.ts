import { ClientConnectionDraft } from '@estuary/types';

export const staticClientConnections: ClientConnectionDraft[] = [
  ClientConnectionDraft.template({
    name: 'test',
    environmentId: 'testing patch',
    description: 'testing',
  }),
];
