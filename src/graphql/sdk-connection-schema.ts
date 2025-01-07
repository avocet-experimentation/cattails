export const sdkConnectionGQLSchema = /* GraphQL */ `
  type SDKConnection {
    id: ID!
    createdAt: Float!
    updatedAt: Float!
    name: String!
    environmentId: ID!
    description: String
    allowedOrigins: [String!]!
    apiKeyHash: String!
  }

  input PartialSDKConnectionWithId {
    id: ID!
    createdAt: Float
    updatedAt: Float
    name: String
    environmentId: ID
    description: String
    allowedOrigins: [String!]
    apiKeyHash: String
  }

  input SDKConnectionDraft {
    name: String!
    environmentId: ID!
    description: String
    allowedOrigins: [String!]!
    apiKeyHash: String!
  }
`;
