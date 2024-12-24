// import { featureFlagSchema } from './featureFlagSchema.js';

import { clientPropValueSchema } from '@avocet/core';
import { GraphQLScalarType } from 'graphql';

export const clientPropValueScalar = new GraphQLScalarType({
  name: 'ClientPropValue',
  parseValue(value) {
    return clientPropValueSchema.parse(value);
  },
});

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

  # union ClientPropValue = BooleanValue | StringValue | NumberValue

  # type BooleanValue {
  #   value: Boolean
  # }

  # type StringValue {
  #   value: String
  # }

  # type NumberValue {
  #   value: Float
  # }

  # input BooleanValueInput {
  #   value: Boolean
  # }

  # input StringValueInput {
  #   value: String
  # }

  # input NumberValueInput {
  #   value: Float
  # }

  # input ClientPropValueInput {
  #   booleanValue: BooleanValueInput
  #   stringValue: StringValueInput
  #   numberValue: NumberValueInput
  # }
`;
