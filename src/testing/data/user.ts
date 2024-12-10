import { UserDraft } from '@estuary/types';

export const staticUser = new UserDraft({
  email: 'testuser@example.com',
  permissions: {
    featureFlag: 'view',
    experiment: 'edit',
    environment: 'none',
    clientPropDef: 'full',
    clientConnection: 'view',
    user: 'edit',
  },
});
