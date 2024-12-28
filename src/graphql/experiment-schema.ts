export const experimentGQLSchema = /* GraphQL */ `
  scalar DefinedTreatments

  scalar MetricDataType

  enum ExperimentStatus {
    draft
    active
    paused
    completed
  }

  type ExperimentGroup {
    id: ID!
    name: String!
    description: String
    proportion: Float!
    sequence: [String!]!
    cycles: Float!
  }

  input ExperimentGroupInput {
    id: ID!
    name: String!
    description: String
    proportion: Float!
    sequence: [String!]!
    cycles: Float!
  }

  type Enrollment {
    attributes: [String]
    proportion: Float
  }

  input EnrollmentInput {
    attributes: [String!]
    proportion: Float
  }

  type Metric {
    fieldName: String
    fieldDataType: String
  }

  input MetricInput {
    fieldName: String
    fieldDataType: String
  }

  type FlagState {
    id: ID!
    value: String!
  }

  input FlagStateInput {
    id: ID!
    value: String!
  }

  type Treatment {
    id: ID!
    name: String!
    duration: Float!
    flagStates: [FlagState!]!
  }

  input TreatmentInput {
    id: ID!
    name: String!
    duration: Float!
    flagStates: [FlagStateInput!]!
  }

  type Experiment {
    id: ID!
    createdAt: Float!
    updatedAt: Float!
    name: String!
    environmentName: String!
    status: ExperimentStatus!
    type: String!
    description: String
    hypothesis: String
    startTimestamp: Float
    endTimestamp: Float
    groups: [ExperimentGroup!]!
    enrollment: Enrollment!
    flagIds: [String!]!
    dependents: [Metric!]!
    definedTreatments: DefinedTreatments!
  }

  input PartialExperimentWithId {
    id: ID!
    createdAt: Float
    updatedAt: Float
    name: String
    environmentName: String
    status: ExperimentStatus
    type: String
    description: String
    hypothesis: String
    startTimestamp: Float
    endTimestamp: Float
    groups: [ExperimentGroupInput!]
    enrollment: EnrollmentInput
    flagIds: [String!]
    dependents: [MetricInput!]
    definedTreatments: DefinedTreatments
  }

  input ExperimentDraft {
    name: String!
    environmentName: String!
    status: ExperimentStatus!
    type: String!
    description: String
    hypothesis: String
    startTimestamp: Float
    endTimestamp: Float
    groups: [ExperimentGroupInput!]!
    enrollment: EnrollmentInput!
    flagIds: [String!]!
    dependents: [MetricInput!]!
    definedTreatments: DefinedTreatments!
  }
`;
