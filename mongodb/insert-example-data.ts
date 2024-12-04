import { ExperimentDraft, FeatureFlagDraft, ForcedValue } from '@estuary/types';
import RepositoryManager from '../src/repository/RepositoryManager.js';
import cfg from '../src/envalid.js';

const colls = new RepositoryManager(cfg.MONGO_ADMIN_URI);

// assumes that default environments have already been inserted
const allEnvironments = await colls.environment.getMany();

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

const exampleFeatureToggle = FeatureFlagDraft.template({
  name: 'example-feature-toggle',
  description: 'toggles the <insert feature here>',
  value: { type: 'boolean', initial: false },
  environmentNames: { production: true },
  overrideRules: [forceTrueInTesting],
});

const exampleSiteThemeFlag = FeatureFlagDraft.template({
  name: 'example-site-theme',
  description: "sets the website's theme to light or dark",
  value: { type: 'string', initial: 'light' },
});

const exampleFeatureFlags: FeatureFlagDraft[] = [
  exampleFeatureToggle,
  exampleSiteThemeFlag,
];

for (let i = 0; i < exampleFeatureFlags.length; i += 1) {
  await colls.featureFlag.create(exampleFeatureFlags[i]);
}
// #endregion

// #region EXPERIMENTS
export const switchbackExperiment1 = ExperimentDraft.templateSwitchback({
  name: 'Example Switchback',
  description:
    'a simple switchback experiment with one group and two treatments',
  environmentName: 'prod',
});

export const abExperiment1 = ExperimentDraft.templateAB({
  name: 'Example A/B Experiment',
  description:
    'A bivariate A/B test with two groups and two independent variables (flags)',
  environmentName: 'prod',
});

export const exampleExperiments: ExperimentDraft[] = [
  switchbackExperiment1,
  abExperiment1,
];

for (let i = 0; i < exampleExperiments.length; i += 1) {
  await colls.experiment.create(exampleExperiments[i]);
}
// #endregion

console.log('example data inserted');
process.exit(0);
