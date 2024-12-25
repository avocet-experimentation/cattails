export const environmentGQLSchema = /* GraphQL */ `
  type Environment {
    id: ID!
    createdAt: Float!
    updatedAt: Float!
    name: String!
    defaultEnabled: Boolean!
    pinToLists: Boolean!
  }

  input EnvironmentDraft {
    name: String!
    defaultEnabled: Boolean!
    pinToLists: Boolean!
  }

  input PartialEnvironmentWithId {
    id: ID!
    createdAt: Float
    updatedAt: Float
    name: String
    defaultEnabled: Boolean
    pinToLists: Boolean
  }

  input PartialEnvironment {
    id: ID
    createdAt: Float
    updatedAt: Float
    name: String
    defaultEnabled: Boolean
    pinToLists: Boolean
  }
`;
