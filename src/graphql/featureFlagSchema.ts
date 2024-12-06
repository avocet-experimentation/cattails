import { assertObject } from '@estuary/types';
import { GraphQLScalarType } from 'graphql';

const environmentRecordScalar = new GraphQLScalarType({
  name: 'EnvironmentNames',
  description: 'Record of environments to `true`',
  parseValue(value) {
    assertObject(value);
    return value;
  },
});

export const featureFlagSchema = /* GraphQL */ `
  scalar EnvironmentNames

  # union FlagValue = String | Float | Boolean

  type FlagBooleanValue {
    type: String!
    initial: Boolean!
  }

  type FlagStringValue {
    type: String!
    initial: String!
  }

  type FlagNumberValue {
    type: String!
    initial: Float!
  }

  union FlagValueDef = FlagBooleanValue | FlagStringValue | FlagNumberValue

  type FeatureFlag {
    id: ID!
    createdAt: Float!
    updatedAt: Float!
    name: String!
    value: FlagValueDef!
    description: String
    environmentNames: EnvironmentNames
    overrideRules: OverrideRules!
  }

  input PartialFeatureFlagWithStringId {
    id: ID!
    createdAt: Float
    updatedAt: Float
    name: String
    value: FlagValueDef
    description: String
    environmentNames: EnvironmentNames
    overrideRules: OverrideRules
  }

  input FeatureFlagDraft {
    name: String!
    value: FlagValueDef!
    description: String
    environmentNames: EnvironmentNames
    overrideRules: OverrideRules!
  }

  type OverrideRules {
    type: String!
    id: String!
    value: String!
    description: String!
    status: ExperimentStatus!
    environmentName: String!
    startTimeStamp: Float!
    endTimeStamp: Float!
    enrollment: Enrollment!
  }
`;
