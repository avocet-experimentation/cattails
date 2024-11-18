import { FeatureFlag, FlagValueDef, BeforeId, FeatureFlagDraft, DraftRecord, FlagEnvironmentMapping } from "@estuary/types";

export const flagEnvironmentInit = (): FlagEnvironmentMapping => ({
  prod: { name: 'prod', enabled: false, overrideRules: [], },
  dev: { name: 'dev', enabled: false, overrideRules: [], },
  testing: { name: 'testing', enabled: false, overrideRules: [], },
  staging: { name: 'staging', enabled: false, overrideRules: [], },
});

export const getExampleFlag = (
  name: string = 'test flag',
  description: string = '',
  value: FlagValueDef = {
    type: 'boolean',
    initial: false,
  },
): DraftRecord<FeatureFlag> => {
  // const currentTimeMs = Date.now();
  
  const flag = {
    name,
    description,
    value,
    // createdAt: currentTimeMs,
    // updatedAt: currentTimeMs,
    environments: flagEnvironmentInit(),
  }

  return flag;
};

export const exampleFlags: FeatureFlagDraft[] = [
  getExampleFlag('testing flag'),
  getExampleFlag(
    'live update', 
    'refreshes charts automatically using server-sent events',
    {
      type: 'boolean',
      initial: true,
    },
  ),
];

export const staticFlagDrafts: FeatureFlagDraft[] = [
  {
    // id: '94328591069f921a07e5bd76',
    name: 'auto-update-ui',
    value: { type: 'boolean', initial: false },
    description: 'Automatically update the page as new data is fetched. Long-lived flag',
    environments: {
      prod: { name: 'prod', enabled: false, overrideRules: [
        {
          type: 'ForcedValue',
          status: 'active',
          value: true,
          environment: 'prod',
          enrollment: {
            attributes: ['id'],
            proportion: 1,
          },
        },
      ] },
      dev: { name: 'dev', enabled: true, overrideRules: [] },
      testing: { name: 'testing', enabled: true, overrideRules: [] },
      staging: { name: 'staging', enabled: false, overrideRules: [] }
    },
  },
];

export const staticFlags: FeatureFlag[] = [
  {
    id: '67328591069f921a07e5bd76',
    name: 'use-new-database',
    value: { type: 'boolean', initial: false },
    description: 'use new database',
    environments: {
      prod: { name: 'prod', enabled: false, overrideRules: [] },
      dev: { name: 'dev', enabled: true, 
        overrideRules: [
          {
            type: 'ForcedValue',
            status: 'active',
            value: true,
            environment: 'dev',
            enrollment: {
              attributes: ['id'],
              proportion: 1,
            },
          }
        ] 
      },
      testing: { name: 'testing', enabled: true, overrideRules: [] },
      staging: { name: 'staging', enabled: false, overrideRules: [] }
    },
    createdAt: 1731364209327,
    updatedAt: 1731364209327
  },
  {
    id: '94328591069f921a07e5bd76',
    name: 'auto-update-ui',
    value: { type: 'boolean', initial: false },
    description: 'Automatically update the page as new data is fetched. Long-lived flag',
    environments: {
      prod: { name: 'prod', enabled: false, overrideRules: [
        {
          // id: '58343391069f921a07e5bd89',
          type: 'ForcedValue',
          description: 'Always sets this flag to true',
          status: 'active',
          value: true,
          environment: 'prod',
          enrollment: {
            attributes: ['id'],
            proportion: 1,
          },
        },
      ] },
      dev: { name: 'dev', enabled: true, overrideRules: [] },
      testing: { name: 'testing', enabled: true, overrideRules: [] },
      staging: { name: 'staging', enabled: false, overrideRules: [] }
    },
    createdAt: 1,
    updatedAt: 1731364204812,
  },
];