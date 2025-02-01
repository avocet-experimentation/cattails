import { ExperimentDraft, FeatureFlagDraft, ForcedValue } from '@avocet/core';
import { Insert } from '@avocet/mongo-client';
import cfg from '../src/envalid.js';

const insert = new Insert(cfg.MONGO_ADMIN_URI);
// assumes that default environments have already been inserted
const allEnvironments = await insert.manager.environment.getMany();

// verify the testing environment exists - update code below if testing
// environment is removed from initial data
if (!allEnvironments.find((env) => env.name === 'testing')) {
  throw new Error(
    'No environment exists with name "testing"! Update example data file',
  );
}

// #region FEATURE FLAGS
const forceTrueInTesting = ForcedValue.template({
  environmentName: 'testing',
  value: true,
});

const liveUpdateToggle = FeatureFlagDraft.template({
  name: 'live-update',
  description: 'toggles periodic fetching of weather data',
  value: { type: 'boolean', initial: false },
  environmentNames: { production: true, testing: true },
  overrideRules: [forceTrueInTesting],
});

const unitSystemFlag = FeatureFlagDraft.template({
  name: 'unit-system',
  description: 'Sets units of measurement to metric or imperial',
  value: { type: 'string', initial: 'metric' },
  environmentNames: { production: true, dev: true },
  overrideRules: [],
});

const exampleSiteThemeFlag = FeatureFlagDraft.template({
  name: 'example-site-theme',
  description: "sets the website's theme to light or dark",
  value: { type: 'string', initial: 'light' },
});

const exampleFeatureFlags: FeatureFlagDraft[] = [
  liveUpdateToggle,
  unitSystemFlag,
  exampleSiteThemeFlag,
];

await insert.featureFlags(exampleFeatureFlags);
// #endregion

// #region EXPERIMENTS
export const switchbackExperiment1 = ExperimentDraft.templateSwitchback({
  name: 'Example Switchback',
  description:
    'a simple switchback experiment with one group and two treatments',
  environmentName: 'production',
});

export const abExperiment1 = ExperimentDraft.templateAB({
  name: 'Example A/B Experiment',
  description:
    'A bivariate A/B test with two groups and two independent variables (flags)',
  environmentName: 'production',
});

export const exampleExperiments: ExperimentDraft[] = [
  switchbackExperiment1,
  abExperiment1,
];

await insert.experiments(exampleExperiments);
// #endregion

// eslint-disable-next-line no-console
console.log('example data inserted');
process.exit(0);
