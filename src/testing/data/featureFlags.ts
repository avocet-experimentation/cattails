import {
  FeatureFlag,
  FeatureFlagDraft,
  ForcedValue,
  ExperimentReference,
  OverrideRuleUnion,
  FlagValueDefImpl,
  FlagValueTypeDef,
} from '@avocet/core';
import { ObjectId } from 'mongodb';

export const flagEnvironmentInit = () =>
  ['prod', 'dev', 'testing', 'staging'].reduce(
    (acc: FeatureFlagDraft['environmentNames'], curr) =>
      Object.assign(acc, { [curr]: true }),
    {},
  );

export const getExampleFlag = (() => {
  let count = 1;

  return (
    name: string = `example-flag-${count}`,
    description: string = '',
    valueType: FlagValueTypeDef = 'boolean',
  ): FeatureFlagDraft => {
    const flag = FeatureFlagDraft.template({
      name,
      description,
      value: FlagValueDefImpl.template(valueType),
      environmentNames: flagEnvironmentInit(),
      overrideRules: [],
    });

    count += 1;
    return Object.freeze(flag);
  };
})();

export const exampleFlagDrafts: FeatureFlagDraft[] = [
  getExampleFlag('testing flag'),
  FeatureFlagDraft.template({
    name: 'live update',
    description: 'refreshes charts automatically using server-sent events',
    value: {
      type: 'boolean',
      initial: true,
    },
  }),
];

export const booleanForcedValue1 = ForcedValue.template({
  environmentName: 'production',
  value: true,
  enrollment: {
    attributes: ['id'],
    proportion: 1,
  },
});

export const booleanForcedValue2 = ForcedValue.template({
  description: 'Always sets this flag to true',
  environmentName: 'production',
  value: true,
  enrollment: {
    attributes: ['id'],
    proportion: 1,
  },
});

export const numberForcedValue1 = ForcedValue.template({
  description: 'Sets volume to max',
  value: 1,
  environmentName: 'testing',
  enrollment: {
    attributes: [],
    proportion: 1,
  },
});

export const experimentRef1 = ExperimentReference.template({
  id: ObjectId.createFromTime(1).toHexString(),
  name: 'Example Experiment',
  environmentName: 'prod',
});

export const staticRules: OverrideRuleUnion[] = [
  booleanForcedValue1,
  booleanForcedValue1,
  experimentRef1,
  numberForcedValue1,
].map((rule) => Object.freeze(rule));

export const staticBooleanFlag: FeatureFlagDraft = {
  // id: '94328591069f921a07e5bd76',
  name: 'auto-update-ui',
  value: { type: 'boolean', initial: false },
  description:
    'Automatically update the page as new data is fetched. Long-lived flag',
  environmentNames: flagEnvironmentInit(),
  overrideRules: [booleanForcedValue1, experimentRef1],
};

export const staticBooleanFlag2 = FeatureFlagDraft.template({
  name: 'dark-mode',
  value: FlagValueDefImpl.template('boolean'),
});
staticBooleanFlag2.overrideRules.push(booleanForcedValue1);

export const staticNumberFlag = FeatureFlagDraft.template({
  name: 'default-volume',
  value: FlagValueDefImpl.template('number'),
});

export const staticFlagDrafts: FeatureFlagDraft[] = [
  staticBooleanFlag,
  staticBooleanFlag2,
  staticNumberFlag,
].map((flag) => Object.freeze(flag));

// completed records. Only insert these by directly using Mongo
export const staticFlags: FeatureFlag[] = [
  {
    ...FeatureFlagDraft.templateBoolean({
      name: 'use-new-database',
      description: 'use new database',
    }),
    id: '67328591069f921a07e5bd76',
    environmentNames: flagEnvironmentInit(),
    overrideRules: [booleanForcedValue1],
    createdAt: 1731364209327,
    updatedAt: 1731364209327,
  },
  {
    ...FeatureFlagDraft.templateBoolean({
      name: 'auto-update-ui',
      description:
        'Automatically update the page as new data is fetched. Long-lived flag',
    }),
    id: '94328591069f921a07e5bd76',
    environmentNames: flagEnvironmentInit(),
    overrideRules: [booleanForcedValue1],
    createdAt: 1,
    updatedAt: 1731364204812,
  },
].map((flag) => Object.freeze(flag));
