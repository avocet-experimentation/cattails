export const clientPropDefSchema = `
  type ClientPropDef {
    id: ID!          
    name: String!            
    description: String      
    dataType: ClientPropValue
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
  ${clientPropDefSchema}
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
