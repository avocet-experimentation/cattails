import { clientPropDefGQLSchema } from './clientPropDefGQLSchema.js';
import { featureFlagGQLSchema } from './featureFlagGQLSchema.js';
import { environmentGQLSchema } from './environmentGQLSchema.js';
import { experimentGQLSchema } from './experimentGQLSchema.js';
import { sdkConnectionGQLSchema } from './sdkConnectionGQLSchema.js';
import { userGQLSchema } from './userGQLSchema.js';

const directiveSchemas = /* GraphQL */ `
  directive @oneOf(value: String!) on FIELD_DEFINITION
`;

const querySchemas = /* GraphQL */ `
  type Query {
    FeatureFlag(id: ID!): FeatureFlag
    allFeatureFlags(limit: Int, offset: Int): [FeatureFlag!]!
    experiment(id: ID!): Experiment
    allExperiments(limit: Int, offset: Int): [Experiment!]!
    environment(id: ID!): Environment
    allEnvironments(limit: Int, offset: Int): [Environment!]!
    findMatchingEnvironments(
      partial: PartialEnvironment
      limit: Int
    ): [Environment!]!
    sdkConnection(id: ID!): SDKConnection
    allSDKConnections(limit: Int, offset: Int): [SDKConnection!]!
    clientPropDef(id: ID!): ClientPropDef
    allClientPropDefs(limit: Int, offset: Int): [ClientPropDef!]!
    user(id: ID!): User
    allUsers(limit: Int, offset: Int): [User!]!
  }
`;

const mutationSchemas = /* GraphQL */ `
  type Mutation {
    createFeatureFlag(newEntry: FeatureFlagDraft!): FeatureFlag!
    updateFeatureFlag(
      partialEntry: PartialFeatureFlagWithStringId!
    ): FeatureFlag
    deleteFeatureFlag(id: ID!): ID

    createExperiment(newEntry: ExperimentDraft!): Experiment!
    updateExperiment(partialEntry: PartialExperimentWithId!): Experiment
    deleteExperiment(id: ID!): Boolean

    createEnvironment(newEntry: EnvironmentDraft!): Environment!
    updateEnvironment(partialEntry: PartialEnvironmentWithId!): Environment
    deleteEnvironment(id: ID!): Boolean

    createSDKConnection(newEntry: SDKConnectionDraft!): SDKConnection!
    updateSDKConnection(
      partialEntry: PartialSDKConnectionWithId!
    ): SDKConnection
    deleteSDKConnection(id: ID!): ID

    createClientPropDef(newEntry: ClientPropDefDraft!): ClientPropDef!
    updateClientPropDef(
      partialEntry: PartialClientPropDefWithId!
    ): ClientPropDef
    deleteClientPropDef(id: ID!): ID

    createUser(newEntry: UserDraft!): User!
    updateUser(partialEntry: PartialUserWithId!): User
    deleteUser(id: ID!): ID
  }
`;

export const schema = /* GraphQL */ `
  ${directiveSchemas}
  ${querySchemas}
  ${mutationSchemas}
  ${featureFlagGQLSchema}
  ${experimentGQLSchema}
  ${environmentGQLSchema}
  ${sdkConnectionGQLSchema}
  ${clientPropDefGQLSchema}
  ${userGQLSchema}
`;

// ${featureFlagSchema}
