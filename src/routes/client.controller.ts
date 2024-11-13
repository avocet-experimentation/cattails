import {
  ClientPropMapping,
  flagClientValueSchema,
  FlagClientValue,
  FlagClientMapping,
} from "@estuary/types";
import { FastifyReply, FastifyRequest } from "fastify";
import { currentFlagValue } from "../lib/flagValue.js";
import { getClientRepos } from "../repository/index.js";
import { printDetail } from "../lib/index.js";

const { fflagRepo } = getClientRepos();
// until we have API keys corresponding to environments
const PLACEHOLDER_ENVIRONMENT = 'dev';

interface FetchFlagsClientBody { 
  Body: { environment: string, clientProps: ClientPropMapping},
}

interface FetchFlagClientRequest extends FetchFlagsClientBody { 
  Params: { fflagName: string, }, 
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
  const { fflagName } = request.params;
  const { environment, clientProps } = request.body;
  const featureFlag = await fflagRepo.findOne({ name: fflagName });
  if (!featureFlag) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flag not found" } });
  }

  const currentValue = currentFlagValue(featureFlag, PLACEHOLDER_ENVIRONMENT, clientProps);

  return flagClientValueSchema.parse(currentValue);
};

export const getEnvironmentFFlagsHandler = async (
  request: FastifyRequest<FetchFlagsClientBody>,
  reply: FastifyReply
): Promise<FlagClientMapping> => {
  const { environment, clientProps } = request.body;
  const featureFlags = await fflagRepo.getEnvironmentFlags(environment);
  if (!featureFlags) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flags not found" } });
  }

  // printDetail({ featureFlags });
  // console.log({ overrideRules: fflags[0].environments.dev?.overrideRules });

  const mapping = featureFlags.reduce((acc, featureFlag) => {
    Object.assign(acc, { [featureFlag.name]: currentFlagValue(featureFlag, PLACEHOLDER_ENVIRONMENT, clientProps) });
    return acc;
  }, {} as FlagClientMapping);
  return mapping;
};
