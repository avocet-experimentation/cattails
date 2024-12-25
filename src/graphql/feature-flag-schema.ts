export const featureFlagGQLSchema = /* GraphQL */ `
  scalar EnvironmentNames

  scalar FlagValueDef

  enum OverrideRuleType {
    Experiment
    ForcedValue
  }

  interface OverrideRule {
    id: String!
    status: ExperimentStatus!
    description: String
    startTimestamp: Float
    endTimestamp: Float
    environmentName: String!
    enrollment: Enrollment!
    type: OverrideRuleType!
  }

  type ExperimentReference implements OverrideRule {
    id: String!
    status: ExperimentStatus!
    description: String
    startTimestamp: Float
    endTimestamp: Float
    environmentName: String!
    enrollment: Enrollment!
    type: OverrideRuleType!
    name: String!
  }

  type ForcedValue implements OverrideRule {
    id: String!
    status: ExperimentStatus!
    description: String
    startTimestamp: Float
    endTimestamp: Float
    environmentName: String!
    enrollment: Enrollment!
    type: OverrideRuleType!
    value: String!
  }

  union OverrideRuleUnion = ExperimentReference | ForcedValue

  input OverrideRuleInput {
    id: String!
    type: String!
    name: String
    value: String
    description: String
    status: ExperimentStatus!
    environmentName: String!
    startTimestamp: Float
    endTimestamp: Float
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
    overrideRules: [OverrideRule!]!
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
