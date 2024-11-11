import { FeatureFlag, FlagValue } from "@estuary/types";
import { BeforeId } from "../repository/MongoRepository.types.js";

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
