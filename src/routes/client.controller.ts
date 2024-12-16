import { ClientPropMapping, FlagClientMapping } from '@avocet/core';
import { FastifyReply, FastifyRequest } from 'fastify';
import ClientFlagManager from '../lib/ClientFlagManager.js';

const clientFlagManager = new ClientFlagManager();

interface FetchFlagsClientBody {
  environmentName: string;
  clientProps: ClientPropMapping;
}

interface FetchFlagClientRequest extends FetchFlagsClientBody {
  flagName: string;
}

/**
 * Todo:
 * - pass client API key in body instead of environmentName
 * - use key to identify environment
 */
export const fetchFFlagHandler = async (
  request: FastifyRequest<{ Body: FetchFlagClientRequest }>,
  reply: FastifyReply,
): Promise<FlagClientMapping> => {
  const { environmentName, clientProps, flagName } = request.body;
  const currentValue = await clientFlagManager.getClientFlagValue(
    flagName,
    environmentName,
    clientProps,
  );

  return reply.code(200).send({ [flagName]: currentValue });
};

export const getEnvironmentFFlagsHandler = async (
  request: FastifyRequest<{ Body: FetchFlagsClientBody }>,
  reply: FastifyReply,
): Promise<FlagClientMapping> => {
  const { environmentName, clientProps } = request.body;
  const environmentValues = await clientFlagManager.environmentFlagValues(
    environmentName,
    clientProps,
  );

  return reply.code(200).send(environmentValues);
};
