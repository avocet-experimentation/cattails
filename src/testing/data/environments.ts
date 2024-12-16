import { EnvironmentDraft } from '@avocet/core';

export const exampleEnvironmentArray: EnvironmentDraft[] = [
  EnvironmentDraft.template({
    name: 'testing',
    pinToLists: true,
  }),
  EnvironmentDraft.template({
    name: 'production',
  }),
  EnvironmentDraft.template({
    name: 'staging',
    pinToLists: true,
  }),
  EnvironmentDraft.template({
    name: 'development',
    defaultEnabled: true,
    pinToLists: true,
  }),
  EnvironmentDraft.template({
    name: 'canary',
    defaultEnabled: true,
  }),
  EnvironmentDraft.template({
    name: 'insider',
  }),
];
