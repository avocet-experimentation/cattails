export const featureFlagGQLSchema = /* GraphQL */ `
  scalar EnvironmentNames

  scalar FlagValueDef

  scalar TextPrimitive

  scalar OverrideRuleType

  interface OverrideRule {
    id: String!
    description: String
    startTimestamp: Float
    endTimestamp: Float
    environmentName: String!
    enrollment: Enrollment!
    type: OverrideRuleType!
  }

  type ExperimentReference implements OverrideRule {
    id: String!
    description: String
    startTimestamp: Float
    endTimestamp: Float
    environmentName: String!
    enrollment: Enrollment!
    type: OverrideRuleType!
    name: String!
    status: ExperimentStatus!
  }

  type ForcedValue implements OverrideRule {
    id: String!
    description: String
    startTimestamp: Float
    endTimestamp: Float
    environmentName: String!
    enrollment: Enrollment!
    type: OverrideRuleType!
    value: TextPrimitive!
  }

  union OverrideRuleUnion = ExperimentReference | ForcedValue

  input OverrideRuleInput {
    id: String!
    type: String!
    name: String
    value: TextPrimitive
    description: String
    status: ExperimentStatus
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
    environmentNames: EnvironmentNames!
    overrideRules: [OverrideRule!]!
  }

  input PartialFeatureFlagWithId {
    id: ID!
    createdAt: Float
    updatedAt: Float
    name: String
    value: FlagValueDef
    description: String
    environmentNames: EnvironmentNames
    overrideRules: [OverrideRuleInput!]
  }

  input FeatureFlagDraft {
    name: String!
    value: FlagValueDef!
    description: String
    environmentNames: EnvironmentNames!
    overrideRules: [OverrideRuleInput!]!
  }
`;
