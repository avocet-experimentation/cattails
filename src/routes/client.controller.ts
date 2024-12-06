import {
  ClientPropMapping,
  flagClientValueSchema,
  FlagClientValue,
  FlagClientMapping,
} from '@estuary/types';
import { FastifyReply, FastifyRequest } from 'fastify';
import ClientFlagManager from '../lib/ClientFlagManager.js';

const clientFlagManager = new ClientFlagManager();

interface FetchFlagsClientBody {
  Body: { environmentName: string; clientProps: ClientPropMapping };
}

interface FetchFlagClientRequest extends FetchFlagsClientBody {
  Params: { flagName: string };
}

/**
 * Todo:
 * - pass client API key in body instead of environmentName
 * - use key to identify environment
 */
export const fetchFFlagHandler = async (
  request: FastifyRequest<FetchFlagClientRequest>,
  reply: FastifyReply,
): Promise<FlagClientValue> => {
  const { flagName } = request.params;
  const { environmentName, clientProps } = request.body;
  const currentValue = await clientFlagManager.getClientFlagValue(
    flagName,
    environmentName,
    clientProps,
  );

  return reply
    .code(200)
    .send(flagClientValueSchema.passthrough().parse(currentValue));
};

export const getEnvironmentFFlagsHandler = async (
  request: FastifyRequest<FetchFlagsClientBody>,
  reply: FastifyReply,
): Promise<FlagClientMapping> => {
  const { environmentName, clientProps } = request.body;
  const environmentValues = await clientFlagManager.environmentFlagValues(
    environmentName,
    clientProps,
  );

  return reply.code(200).send(environmentValues);
};
