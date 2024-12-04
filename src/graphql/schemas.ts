const readPropDefSchema = /* GraphQL */ `
  enum ClientPropValueType {
    boolean
    string
    number
  }

  type ClientPropDef {
    id: ID!
    createdAt: Float!
    updatedAt: Float!
    name: String!
    description: String
    dataType: ClientPropValue!
    isIdentifier: Boolean!
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

  type Experiment {
    id: ID!
    createdAt: Float!
    updatedAt: Float!
    name: String!
    status: ExperimentStatus!
    enrollmentAttributes: [String]!
    enrollmentProportion: Float!
    flagId: String!
    description: String
    hypothesis: String
    startTimestamp: Float
    endTimestamp: Float
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

const environmentSchema = /* GraphQL */ `
  type Environment {
    id: ID!
    createdAt: Float!
    updatedAt: Float!
    name: String!
    defaultEnabled: Boolean!
  }

  input EnvironmentDraft {
    name: String!
    defaultEnabled: Boolean!
  }

  input PartialEnvironment {
    id: ID
    createdAt: Float
    updatedAt: Float
    name: String
    defaultEnabled: Boolean
  }

  input PartialEnvironmentWithId {
    id: ID!
    createdAt: Float
    updatedAt: Float
    name: String
    defaultEnabled: Boolean
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

const featureFlagSchema = /* GraphQL */ `
  type FeatureFlag {
    id: ID!
    createdAt: Float!
    updatedAt: Float!
    name: String!
    description: String
    environmentNames: [String]!
  }

  input CreateFeatureFlagInput {
    name: String!
    description: String
    enabled: Boolean!
    environment: String!
  }

  input UpdateFeatureFlagInput {
    id: ID!
    name: String
    description: String
    enabled: Boolean
    environment: String
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
    FeatureFlag(id: ID!): FeatureFlag
    allFeatureFlags(limit: Int, offset: Int): [FeatureFlag]
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

    updateEnvironment(partialEntry: PartialEnvironment!): Environment

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

    createFeatureFlag(input: CreateFeatureFlagInput!): FeatureFlag!
    updateFeatureFlag(input: UpdateFeatureFlagInput!): FeatureFlag!
    deleteFeatureFlag(id: ID!): ID
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
  ${featureFlagSchema}
`;
