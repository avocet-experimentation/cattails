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

const mutationSchema = `
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

export const schema = `
  ${mutationSchema}
  ${readPropDefSchema}
  ${environmentSchema}
  ${clientConnectionSchema}
  ${userSchema}
  
  type Query {
    clientPropDef(id: ID!): ClientPropDef
    allClientPropDefs(limit: Int, offset: Int): [ClientPropDef]
    environment(id: ID!): Environment
    allEnvironments(limit: Int, offset: Int): [Environment]
    clientConnection(id: ID!): ClientConnection
    allClientConnections(limit: Int, offset: Int): [ClientConnection]
    user(id: ID!): User
    allUsers(limit: Int, offset: Int): [User]
  }
`;
