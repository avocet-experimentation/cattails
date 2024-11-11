import { FeatureFlag, EnvironmentName, RuleStatus } from "@estuary/types";

// Outer-scope feature flag properties;
// these props will act as the configuration of how the test groups are tested, recorded, and distributed.

type FlagParams = {
  fflagId: string;
  fflagName: string;
}

type ExperimentParams = {
  experimentId: string;
  experimentName: string;
}

export type FlagIdParam = Pick<FlagParams, 'fflagId'>;

export type FlagNameParam = Pick<FlagParams, 'fflagName'>;

export type ExperimentIdParam = Pick<ExperimentParams, 'experimentId'>;

export type ExperimentNameParam = Pick<ExperimentParams, 'experimentName'>;

// need to finish
export type TrafficAllocation = {};

// export type CachingParam = {
//   environmentName: EnvironmentName;
// };

// export type CreateFFlagBodyRequest = FeatureFlag;

// export type CreateFFlagBodyResponse = AuditableFFlag & {
//   id: string;
// };

// export type UpdateFFlagBodyRequest = CreateFFlagBodyResponse;

// export type UpdateFFlagBodyResponse = UpdateFFlagBodyRequest;

// export type GetFFlagBodyResponse = UpdateFFlagBodyRequest;
