import { UserDraft } from '@avocet/core';

export const staticUser = new UserDraft({
  identifier: 'testuser@example.com',
  permissions: {
    featureFlag: 'view',
    experiment: 'edit',
    environment: 'none',
    clientPropDef: 'full',
    sdkConnection: 'view',
    user: 'edit',
  },
});
