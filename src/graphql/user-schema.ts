export const userGQLSchema = /* GraphQL */ `
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
    SDKConnection: PermissionLevel!
  }

  input UserPermissionsInput {
    FeatureFlag: PermissionLevel!
    Experiment: PermissionLevel!
    Environment: PermissionLevel!
    User: PermissionLevel!
    ClientPropDef: PermissionLevel!
    SDKConnection: PermissionLevel!
  }

  type User {
    id: ID!
    createdAt: Float!
    updatedAt: Float!
    identifier: String!
    permissions: UserPermissions!
  }

  input PartialUserWithId {
    id: ID!
    identifier: String
    permissions: UserPermissionsInput
  }

  input UserDraft {
    identifier: String!
    permissions: UserPermissionsInput!
  }
`;
