import { environmentSchema } from './environmentSchema.js';
// import { featureFlagSchema } from './featureFlagSchema.js';

const readPropDefSchema = /* GraphQL */ `
  enum ClientPropValueType {
    boolean
    string
    number
  }

  type ClientPropDef {
    id: ID!
    name: String!
    description: String
    dataType: ClientPropValue!
    isIdentifier: Boolean!
    createdAt: Float
    updatedAt: Float
  }

  union ClientPropValue = BooleanValue | StringValue | NumberValue

  type BooleanValue {
    value: Boolean
  }

  type StringValue {
    value: String
  }

  type NumberValue {
    value: Float
  }

  input BooleanValueInput {
    value: Boolean
  }

  input StringValueInput {
    value: String
  }

  input NumberValueInput {
    value: Float
  }

  input ClientPropValueInput {
    booleanValue: BooleanValueInput
    stringValue: StringValueInput
    numberValue: NumberValueInput
  }
`;

const experimentSchema = /* GraphQL */ `
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
    proportion: Float
    sequence: [String]
    cycles: Float
  }

  type Enrollment {
    attributes: [String]
    proportion: Float
  }

  type Metric {
    fieldName: String
    fieldDataType: String
  }

  type FlagState {
    id: ID!
    value: String!
  }

  type Treatments {
    id: ID!
    name: String
    duration: Float
    flagStates: [FlagState]
  }

  type DefinedTreatments {
    name: Treatments
  }

  type Experiment {
    id: ID!
    name: String!
    environmentName: String!
    status: ExperimentStatus
    type: String
    description: String
    hypothesis: String
    startTimestamp: Float
    endTimestamp: Float
    groups: [ExperimentGroup]
    enrollment: Enrollment
    flagIds: [String]
    dependents: [Metric]
    definedTreatments: DefinedTreatments
    createdAt: Float
    updatedAt: Float
  }
`;

const userSchema = /* GraphQL */ `
  enum PermissionLevel {
    none
    view
    edit
    full
  }

  type UserPermissions {
    FeatureFlag: PermissionLevel!
    Experiment: PermissionLevel!
    Environment: PermissionLevel!
    User: PermissionLevel!
    ClientPropDef: PermissionLevel!
    ClientConnection: PermissionLevel!
  }

  input UserPermissionsInput {
    FeatureFlag: PermissionLevel!
    Experiment: PermissionLevel!
    Environment: PermissionLevel!
    User: PermissionLevel!
    ClientPropDef: PermissionLevel!
    ClientConnection: PermissionLevel!
  }

  type User {
    id: ID!
    createdAt: Float!
    updatedAt: Float!
    email: String!
    permissions: UserPermissions!
  }
`;

const clientConnectionSchema = /* GraphQL */ `
  type ClientConnection {
    id: ID!
    createdAt: Float!
    updatedAt: Float!
    name: String!
    environmentId: ID!
    description: String!
  }
`;

const querySchemas = /* GraphQL */ `
  type Query {
    clientPropDef(id: ID!): ClientPropDef
    allClientPropDefs(limit: Int, offset: Int): [ClientPropDef]
    environment(id: ID!): Environment
    allEnvironments(limit: Int, offset: Int): [Environment]
    findMatchingEnvironments(
      partial: PartialEnvironment
      limit: Int
    ): [Environment]
    clientConnection(id: ID!): ClientConnection
    allClientConnections(limit: Int, offset: Int): [ClientConnection]
    user(id: ID!): User
    allUsers(limit: Int, offset: Int): [User]
    experiment(id: ID!): Experiment
    allExperiments(limit: Int, offset: Int): [Experiment]
    # FeatureFlag(id: ID!): FeatureFlag
    # allFeatureFlags(limit: Int, offset: Int): [FeatureFlag]
  }
`;

const mutationSchemas = /* GraphQL */ `
  type Mutation {
    updateClientPropDef(
      id: ID!
      name: String
      description: String
      dataType: String
      isIdentifier: Boolean
    ): ClientPropDef

    createClientPropDef(
      name: String!
      description: String
      dataType: String
      isIdentifier: Boolean
    ): ID

    deleteClientPropDef(id: ID!): ID

    createClientConnection(
      name: String!
      description: String
      environmentId: ID!
    ): ClientConnection

    updateClientConnection(
      id: ID!
      name: String
      description: String
      environmentId: ID
    ): ClientConnection

    deleteClientConnection(id: ID!): ID

    createUser(email: String!, permissions: UserPermissionsInput!): User

    updateUser(id: ID!, email: String, permissions: UserPermissionsInput!): User

    deleteUser(id: ID!): ID

    createEnvironment(newEntry: EnvironmentDraft!): Environment

    updateEnvironment(partialEntry: PartialEnvironmentWithId!): Environment

    deleteEnvironment(id: ID!): Boolean

    createExperiment(
      name: String!
      status: ExperimentStatus!
      enrollmentAttributes: [String]!
      enrollmentProportion: Float!
      flagId: String!
      description: String
      hypothesis: String
      startTimestamp: Float
      endTimestamp: Float
    ): Experiment

    updateExperiment(
      id: ID!
      name: String
      status: ExperimentStatus
      enrollmentAttributes: [String]
      enrollmentProportion: Float
      flagId: String
      description: String
      hypothesis: String
      startTimestamp: Float
      endTimestamp: Float
    ): Experiment

    deleteExperiment(id: ID!): Boolean

    # createFeatureFlag(input: FeatureFlagDraft!): FeatureFlag!
    # updateFeatureFlag(input: PartialFeatureFlagWithStringId!): FeatureFlag!
    # deleteFeatureFlag(id: ID!): ID
  }
`;

export const schema = /* GraphQL */ `
  ${querySchemas}
  ${mutationSchemas}
  ${readPropDefSchema}
  ${environmentSchema}
  ${clientConnectionSchema}
  ${userSchema}
  ${experimentSchema}
`;
