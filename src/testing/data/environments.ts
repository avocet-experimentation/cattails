import { Environment, EnvironmentDraft } from "@estuary/types";

export const exampleEnvironment: EnvironmentDraft = {
  name: "prod",
  defaultEnabled: true,
}

export const exampleEnvironmentArray: EnvironmentDraft[] = [
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
    name: 'development',
    defaultEnabled: true,
  },
  {
    name: 'canary',
    defaultEnabled: true,
  },
  {
    name: 'insider',
    defaultEnabled: false,
  },
];
