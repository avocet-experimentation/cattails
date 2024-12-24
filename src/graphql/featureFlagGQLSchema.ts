import { featureFlagSchema } from '@avocet/core';
import { GraphQLScalarType } from 'graphql';

export const environmentRecordScalar = new GraphQLScalarType({
  name: 'EnvironmentNames',
  description: 'Record of environments to `true`',
  parseValue(value) {
    return featureFlagSchema.shape.environmentNames.parse(value);
  },
});

export const flagValueDefScalar = new GraphQLScalarType({
  name: 'FlagValueDef',
  description: "See FeatureFlag['value']",
  parseValue(value) {
    return featureFlagSchema.shape.value.parse(value);
  },
});

export const featureFlagGQLSchema = /* GraphQL */ `
  scalar EnvironmentNames

  scalar FlagValueDef

  # union FlagValue = String | Float | Boolean

  # type FlagBooleanValue {
  #   type: String!
  #   initial: Boolean!
  # }

  # type FlagStringValue {
  #   type: String!
  #   initial: String!
  # }

  # type FlagNumberValue {
  #   type: String!
  #   initial: Float!
  # }

  # union FlagValueDef = FlagBooleanValue | FlagStringValue | FlagNumberValue

  type OverrideRule {
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

  input OverrideRuleInput {
    type: String!
    id: String!
    value: String!
    description: String!
    status: ExperimentStatus!
    environmentName: String!
    startTimeStamp: Float!
    endTimeStamp: Float!
    enrollment: EnrollmentInput!
  }

  type FeatureFlag {
    id: ID!
    createdAt: Float!
    updatedAt: Float!
    name: String!
    value: FlagValueDef!
    description: String
    environmentNames: EnvironmentNames
    overrideRules: [OverrideRule]!
  }

  input PartialFeatureFlagWithStringId {
    id: ID!
    createdAt: Float
    updatedAt: Float
    name: String
    value: FlagValueDef
    description: String
    environmentNames: EnvironmentNames
    overrideRules: [OverrideRuleInput]
  }

  input FeatureFlagDraft {
    name: String!
    value: FlagValueDef!
    description: String
    environmentNames: EnvironmentNames
    overrideRules: [OverrideRuleInput]!
  }
`;
