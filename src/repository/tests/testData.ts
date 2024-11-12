import { FeatureFlag, FlagValue } from "@estuary/types";
import { BeforeId } from "../MongoRepository.types.js";
import { ObjectId } from "mongodb";

export const flagEnvironmentInit = () => ({
  prod: { name: 'prod', enabled: false, overrideRules: [], },
  dev: { name: 'dev', enabled: false, overrideRules: [], },
  testing: { name: 'testing', enabled: false, overrideRules: [], },
  staging: { name: 'staging', enabled: false, overrideRules: [], },
});

export const getExampleFlag = (
  name: string = 'test flag',
  description: string = '',
  value: FlagValue = {
    type: 'boolean',
    default: false,
  },
): BeforeId<FeatureFlag> => {
  const currentTimeMs = Date.now();
  
  const flag = {
    name,
    description,
    value,
    createdAt: currentTimeMs,
    updatedAt: currentTimeMs,
    environments: flagEnvironmentInit(),
  }

  return flag;
};

export const exampleFlags = [
  getExampleFlag('testing flag'),
  getExampleFlag(
    'live update', 
    'refreshes charts automatically using server-sent events',
    {
      type: 'boolean',
      default: true,
    },
  ),
];

export const staticFlags = [
  {
    id: '67328591069f921a07e5bd76',
    name: 'use-new-database',
    value: { type: 'boolean', default: false },
    description: 'use new database',
    environments: {
      prod: { name: 'prod', enabled: false, overrideRules: [] },
      dev: { name: 'dev', enabled: true, 
        overrideRules: [
          {
            id: '43328591069f921a07e5bd89',
            type: 'ForcedValue',
            description: 'Always sets this flag to true in the dev environment',
            status: 'active',
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
    value: { type: 'boolean', default: false },
    description: 'Automatically update the page as new data is fetched. Long-lived flag',
    environments: {
      prod: { name: 'prod', enabled: false, overrideRules: [
        {
          id: '58343391069f921a07e5bd89',
          type: 'ForcedValue',
          description: 'Always sets this flag to true',
          status: 'active',
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