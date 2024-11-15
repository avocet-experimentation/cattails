export const readPropDefSchema = `
  type ClientPropDef {
    id: ID!          
    name: String!            
    description: String      
    dataType: String
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

export const environmentSchema = `
type Environment {
  id: ID!                  
  name: EnvironmentName!
  description: String
  defaultEnabled: Boolean!
}

enum EnvironmentName {
  prod
  dev
  testing
  staging
}
`;

export const clientConnectionSchema = `
  # ClientConnection Type
  type ClientConnection {
    id: ID!            
    name: String!      
    environmentId: ID! 
    clientKeyHash: String  # Optional, as it is TBD in Zod schema??
  }
`;

const mutationSchemas = `
  type Mutation {
    updateClientPropDef(
      id: ID!,
      name: String,
      description: String,
      dataType: String,
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

    createUser(
      email: String,
      permissions: PermissionsLevel!
    ): User

    updateUser(
      id: ID!,
      email: String,
      permissions: PermissionsLevel
    ): User

    deleteUser(id: ID!): Boolean

    createEnvironment(
      name: EnvironmentName!,
      description: String,
      defaultEnabled: Boolean!
    ): Environment

    updateEnvironment(
      id: ID!,
      name: EnvironmentName,
      description: String,
      defaultEnabled: Boolean
    ): Environment

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
  }
`;

export const userSchema = `
  enum PermissionLevel {
    none
    view
    edit
    admin
  }

  type UserPermissions {
    fflags: PermissionLevel!
    experiments: PermissionLevel!
    environments: PermissionLevel!
    users: PermissionLevel!
    attributes: PermissionLevel!
    events: PermissionLevel!
  }

  # User Type
  type User {
    id: ID!                
    username: String!      
    email: String!         
    passwordHash: String!  
    permissions: UserPermissions!
  }
`;

const experimentSchema = `
  experiment(id: ID!): Experiment

  allExperiments(
    status: ExperimentStatus,    
    name: String,                                  
  ): [Experiment]


  experimentsByFlag(flagId: String!): [Experiment]

  enum ExperimentStatus {
    draft
    active
    paused
    completed
  }
`

export const schema = `
  ${mutationSchemas}
  ${readPropDefSchema}
  ${environmentSchema}
  ${clientConnectionSchema}
  ${userSchema}
  ${experimentSchema}
  
  type Query {
    clientPropDef(id: ID!): ClientPropDef
    allClientPropDefs(limit: Int, offset: Int): [ClientPropDef]
    environment(id: ID!): Environment
    allEnvironments(limit: Int, offset: Int): [Environment]
    clientConnection(id: ID!): ClientConnection
    allClientConnections(limit: Int, offset: Int): [ClientConnection]
    user(id: ID!): User
    allUsers(limit: Int, offset: Int): [User]
    experiment(id: ID!): Experiment
    allExperiments(name: String, status: ExperimentStatus): [Experiment]
  }
`;
