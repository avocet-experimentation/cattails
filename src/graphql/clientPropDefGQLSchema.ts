export const clientPropDefGQLSchema = /* GraphQL */ `
  scalar ClientPropValue

  type ClientPropDef {
    id: ID!
    createdAt: Float!
    updatedAt: Float!
    name: String!
    description: String
    dataType: ClientPropValue!
    isIdentifier: Boolean!
  }

  input ClientPropDefDraft {
    name: String!
    description: String
    dataType: ClientPropValue!
    isIdentifier: Boolean!
  }

  input PartialClientPropDefWithId {
    id: ID!
    name: String
    description: String
    dataType: ClientPropValue
    isIdentifier: Boolean
  }
`;
