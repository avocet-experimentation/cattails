import { clientPropDefGQLSchema } from './client-prop-def-schema.js';
import { featureFlagGQLSchema } from './feature-flag-schema.js';
import { environmentGQLSchema } from './environment-schema.js';
import { experimentGQLSchema } from './experiment-schema.js';
import { sdkConnectionGQLSchema } from './sdk-connection-schema.js';
import { userGQLSchema } from './user-schema.js';

const directiveSchemas = /* GraphQL */ `
  directive @oneOf(value: String!) on FIELD_DEFINITION
`;

const querySchemas = /* GraphQL */ `
  type Query {
    featureFlag(id: ID!): FeatureFlag
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
    updateFeatureFlag(partialEntry: PartialFeatureFlagWithId!): FeatureFlag
    deleteFeatureFlag(id: ID!): ID

    createExperiment(newEntry: ExperimentDraft!): Experiment!
    updateExperiment(partialEntry: PartialExperimentWithId!): Experiment
    deleteExperiment(id: ID!): ID
    startExperiment(id: ID!): Boolean
    pauseExperiment(id: ID!): Boolean
    completeExperiment(id: ID!): Boolean

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
