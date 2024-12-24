import { ClientPropDefGQLSchema } from './ClientPropDefGQLSchema.js';
import { featureFlagGQLSchema } from './featureFlagSchema.js';
import { environmentGQLSchema } from './environmentGQLSchema.js';
import { experimentGQLSchema } from './experimentGQLSchema.js';
import { sdkConnectionGQLSchema } from './sdkConnectionGQLSchema.js';
import { userGQLSchema } from './userGQLSchema.js';

const querySchemas = /* GraphQL */ `
  type Query {
    clientPropDef(id: ID!): ClientPropDef
    allClientPropDefs(limit: Int, offset: Int): [ClientPropDef]
    environment(id: ID!): Environment
    allEnvironments(limit: Int, offset: Int): [Environment]
    findMatchingEnvironments(
      partial: PartialEnvironment
      limit: Int
    ): [Environment]
    sdkConnection(id: ID!): SDKConnection
    allSDKConnections(limit: Int, offset: Int): [SDKConnection]
    user(id: ID!): User
    allUsers(limit: Int, offset: Int): [User]
    experiment(id: ID!): Experiment
    allExperiments(limit: Int, offset: Int): [Experiment]
    FeatureFlag(id: ID!): FeatureFlag
    allFeatureFlags(limit: Int, offset: Int): [FeatureFlag]
  }
`;

const mutationSchemas = /* GraphQL */ `
  type Mutation {
    createClientPropDef(newEntry: ClientPropDefDraft!): ClientPropDef!
    updateClientPropDef(
      partialEntry: PartialClientPropDefWithId!
    ): ClientPropDef
    deleteClientPropDef(id: ID!): ID

    createSDKConnection(newEntry: SDKConnectionDraft!): SDKConnection!
    updateSDKConnection(
      partialEntry: PartialSDKConnectionWithId!
    ): SDKConnection
    deleteSDKConnection(id: ID!): ID

    createUser(newEntry: UserDraft!): User!
    updateUser(partialEntry: PartialUserWithId!): User
    deleteUser(id: ID!): ID

    createEnvironment(newEntry: EnvironmentDraft!): Environment!
    updateEnvironment(partialEntry: PartialEnvironmentWithId!): Environment
    deleteEnvironment(id: ID!): Boolean

    createExperiment(newEntry: ExperimentDraft!): Experiment!
    updateExperiment(partialEntry: PartialExperimentWithId!): Experiment
    deleteExperiment(id: ID!): Boolean

    createFeatureFlag(newEntry: FeatureFlagDraft!): FeatureFlag!
    updateFeatureFlag(
      partialEntry: PartialFeatureFlagWithStringId!
    ): FeatureFlag!
    deleteFeatureFlag(id: ID!): ID
  }
`;

export const schema = /* GraphQL */ `
  ${querySchemas}
  ${mutationSchemas}
  ${ClientPropDefGQLSchema}
  ${environmentGQLSchema}
  ${sdkConnectionGQLSchema}
  ${userGQLSchema}
  ${experimentGQLSchema}
  ${featureFlagGQLSchema}
`;
