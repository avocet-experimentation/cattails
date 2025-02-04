import {
  ClientPropMapping,
  ClientSDKFlagMapping,
  ClientSDKFlagValue,
  Environment,
  Experiment,
  FeatureFlag,
  FeatureFlagDraft,
  ForcedValue,
  SDKFlagManager,
} from '@avocet/core';
import { FastifyReply, FastifyRequest } from 'fastify';
import { RepositoryManager } from '@avocet/mongo-client';
import cfg from '../envalid.js';

const repos = new RepositoryManager(cfg.MONGO_API_URI);

async function computeFlagValue(
  flag: FeatureFlag,
  environmentName: string,
  clientProps: ClientPropMapping,
): Promise<ClientSDKFlagValue> {
  const defaultReturn = {
    value: flag.value.initial,
    metadata: SDKFlagManager.singleIdString(flag.id),
  };

  const envRules = FeatureFlagDraft.getEnvironmentRules(flag, environmentName);
  const selectedRule = SDKFlagManager.enroll(envRules, clientProps);
  if (selectedRule === undefined) return defaultReturn;

  let fullRule: Experiment | ForcedValue;
  if (selectedRule.type === 'Experiment') {
    fullRule = await repos.experiment.get(selectedRule.id);
  } else {
    fullRule = selectedRule;
  }

  const ruleValue = SDKFlagManager.ruleValueAndMetadata(
    fullRule,
    flag.id,
    clientProps,
  );
  return ruleValue ?? defaultReturn;
}

const getEnvFromKey = async (apiKey: string): Promise<Environment> => {
  const connection = await repos.sdkConnection.findOne({ apiKeyHash: apiKey });
  if (!connection) throw new Error('No SDK connection found.');

  const environment = await repos.environment.get(connection.environmentId);
  if (!connection) throw new Error('No environment found.');

  return environment;
};

export const fetchFFlagHandler = async (
  request: FastifyRequest<{
    Body: {
      apiKey: string;
      clientProps: ClientPropMapping;
      flagName: string;
    };
  }>,
  reply: FastifyReply,
): Promise<ClientSDKFlagMapping> => {
  const { apiKey, clientProps, flagName } = request.body;

  try {
    const environment = await getEnvFromKey(apiKey);
    const environmentName = environment.name;

    let currentValue: ClientSDKFlagValue = {
      value: null,
      metadata: SDKFlagManager.defaultIdString(),
    };

    const flag = await repos.featureFlag.findOne({
      name: flagName,
    });
    if (flag && environmentName in flag.environmentNames) {
      currentValue = await computeFlagValue(flag, environmentName, clientProps);
    }
    return await reply.code(200).send({ [flagName]: currentValue });
  } catch (e) {
    return reply.code(404);
  }
};

export const getEnvironmentFFlagsHandler = async (
  request: FastifyRequest<{
    Body: {
      apiKey: string;
      clientProps: ClientPropMapping;
    };
  }>,
  reply: FastifyReply,
): Promise<ClientSDKFlagMapping> => {
  const { apiKey, clientProps } = request.body;

  try {
    const environment = await getEnvFromKey(apiKey);
    const environmentName = environment.name;

    const featureFlags = await repos.featureFlag.getEnvironmentFlags(environmentName);

    const resolve = await Promise.all(
      featureFlags.map((flag) =>
        computeFlagValue(flag, environmentName, clientProps).then((result) => [
          flag.name,
          result,
        ])),
    );
    const environmentFlagMapping = Object.fromEntries(resolve);
    return await reply.code(200).send(environmentFlagMapping);
  } catch (e: unknown) {
    if (e instanceof Error) {
      // eslint-disable-next-line no-console
      console.error(e);
    }

    return reply.code(404);
  }
};
