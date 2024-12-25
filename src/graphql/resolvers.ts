/* eslint-disable no-underscore-dangle */
import {
  Environment,
  BeforeId,
  stripKeysWithUndefined,
  featureFlagSchema,
  clientPropValueSchema,
  OverrideRuleUnion,
} from '@avocet/core';
import { Filter } from 'mongodb';
import { IResolvers } from 'mercurius';
import { GraphQLScalarType } from 'graphql';
import RepositoryManager from '../repository/RepositoryManager.js';
import cfg from '../envalid.js';
import { mutationResolvers } from './mutationResolvers.js';

const repos = new RepositoryManager(cfg.MONGO_ADMIN_URI);

const scalarResolvers: IResolvers = {
  OverrideRule: {
    resolveType(obj: OverrideRuleUnion) {
      const mapping = {
        Experiment: 'ExperimentReference',
        ForcedValue: 'ForcedValue',
      };

      const gqlType = mapping[obj.type];
      console.log({ gqlType });
      if (!gqlType) throw new TypeError(`type ${obj.type} not accounted for!`);
      return gqlType;
    },
  },
  EnvironmentNames: new GraphQLScalarType({
    name: 'EnvironmentNames',
    parseValue(value) {
      return featureFlagSchema.shape.environmentNames.parse(value);
    },
  }),
  FlagValueDef: new GraphQLScalarType({
    name: 'FlagValueDef',
    parseValue(value) {
      return featureFlagSchema.shape.value.parse(value);
    },
  }),
  ClientPropValue: new GraphQLScalarType({
    name: 'ClientPropValue',
    parseValue(value) {
      return clientPropValueSchema.parse(value);
    },
  }),
};

const queryResolvers: IResolvers = {
  Query: {
    FeatureFlag: async (_, { id }: { id: string }) => repos.featureFlag.get(id),
    allFeatureFlags: async (_, { limit }: { limit?: number }) =>
      repos.featureFlag.getMany(limit),
    experiment: async (_, { id }: { id: string }) => repos.experiment.get(id),
    allExperiments: async (_, { limit }: { limit?: number }) =>
      repos.experiment.getMany(limit),
    environment: async (_, { id }: { id: string }) => repos.environment.get(id),
    allEnvironments: async (
      _,
      { limit, offset }: { limit?: number; offset?: number },
    ) => repos.environment.getMany(limit, offset),
    findMatchingEnvironments: async (
      _,
      {
        partial,
        limit,
      }: { partial?: Filter<BeforeId<Environment>>; limit?: number },
    ) => {
      const query = partial ? stripKeysWithUndefined(partial) : {};
      return repos.environment.findMany(query, limit);
    },
    sdkConnection: async (_, { id }: { id: string }) =>
      repos.sdkConnection.get(id),
    allSDKConnections: async (_, { limit }: { limit?: number }) =>
      repos.sdkConnection.getMany(limit),
    clientPropDef: async (_, { id }: { id: string }) =>
      repos.clientPropDef.get(id),
    allClientPropDefs: async (_, { limit }: { limit?: number }) =>
      repos.clientPropDef.getMany(limit),
    user: async (_, { id }: { id: string }) => repos.user.get(id),
    allUsers: async (_, { limit }: { limit?: number }) =>
      repos.user.getMany(limit),
  },
};

export const resolvers: IResolvers = {
  ...scalarResolvers,
  ...queryResolvers,
  ...mutationResolvers,
};
