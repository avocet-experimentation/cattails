export const featureFlagSchema = /* GraphQL */ `
  type FlagValueDef {
    type: String!
    initial: String! | Float! | Boolean!
  }  

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

  type EnvironmentNames {
    
  }

  type OverrideRules {
    type: String!
    id: String!
    value: String! | Float! | Boolean!
    description: String!
    status: ExperimentStatus!
    environmentName: String!
    startTimeStamp: Float!
    endTimeStamp: Float!
    enrollment: Enrollment!
  }
`;
