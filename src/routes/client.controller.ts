import {
  ClientPropMapping,
  flagClientValueSchema,
  FlagClientValue,
  FlagClientMapping,
  EnvironmentName,
} from "@estuary/types";
import { FastifyReply, FastifyRequest } from "fastify";
import ClientFlagManager from "../lib/ClientFlagManager.js";

const clientFlagManager = new ClientFlagManager();

interface FetchFlagsClientBody { 
  Body: { environment: EnvironmentName, clientProps: ClientPropMapping},
}

interface FetchFlagClientRequest extends FetchFlagsClientBody { 
  Params: { flagName: string }, 
}

/**
 * Todo:
 * - pass client API key in body
 * - use key to identify environment
 */
export const fetchFFlagHandler = async (
  request: FastifyRequest<FetchFlagClientRequest>,
  reply: FastifyReply
): Promise<FlagClientValue> => {
  const { flagName } = request.params;
  const { environment, clientProps } = request.body;
  const currentValue = await clientFlagManager.currentFlagValue(flagName, environment, clientProps);

  // todo: change this parse to only strip out extra properties instead of throwing
  return reply.code(200).send(flagClientValueSchema.parse(currentValue));
};

export const getEnvironmentFFlagsHandler = async (
  request: FastifyRequest<FetchFlagsClientBody>,
  reply: FastifyReply
): Promise<FlagClientMapping> => {
  const { environment, clientProps } = request.body;
  const environmentValues = await clientFlagManager.environmentFlagValues(environment, clientProps);
  if (environmentValues === null) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flags not found" } });
  }

  return reply.code(200).send(environmentValues);
};
