export const experimentGQLSchema = /* GraphQL */ `
  scalar DefinedTreatments

  scalar MetricDataType

  scalar ConditionReference

  enum ExperimentStatus {
    draft
    active
    paused
    completed
  }

  enum ExperimentType {
    Experiment
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
    attributes: [String!]!
    proportion: Float!
  }

  input EnrollmentInput {
    attributes: [String!]!
    proportion: Float!
  }

  type Metric {
    fieldName: String!
    type: MetricDataType!
  }

  input MetricInput {
    fieldName: String!
    type: MetricDataType!
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

  type Hypothesis {
    id: ID!
    dependentName: String!
    analysis: String!
    compareValue: TextPrimitive!
    compareOperator: String!
    baseConditionRef: ConditionReference!
    testConditionRef: ConditionReference!
  }

  input HypothesisInput {
    id: ID!
    dependentName: String!
    analysis: String!
    compareValue: TextPrimitive!
    compareOperator: String!
    baseConditionRef: ConditionReference!
    testConditionRef: ConditionReference!
  }

  type Experiment {
    id: ID!
    createdAt: Float!
    updatedAt: Float!
    name: String!
    environmentName: String!
    status: ExperimentStatus!
    type: ExperimentType!
    description: String
    hypothesis: String
    startTimestamp: Float
    endTimestamp: Float
    groups: [ExperimentGroup!]!
    enrollment: Enrollment!
    flagIds: [String!]!
    definedTreatments: DefinedTreatments!
    dependents: [Metric!]!
    hypotheses: [Hypothesis!]!
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
    definedTreatments: DefinedTreatments
    dependents: [MetricInput!]
    hypotheses: [HypothesisInput!]
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
    hypotheses: [HypothesisInput!]!
  }
`;
