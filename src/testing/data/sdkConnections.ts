import { SDKConnectionDraft } from '@avocet/core';

export const staticSDKConnections: SDKConnectionDraft[] = [
  SDKConnectionDraft.template({
    name: 'test',
    environmentId: 'testing patch',
    description: 'testing',
  }),
];
