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

interface FetchFlagsBody { 
  Body: { environment: string, clientSessionAttributes: ClientPropMapping},
}

interface FetchFlagRequest extends FetchFlagsBody { 
  Params: { fflagName: string, }, 
  // Body: { environment: string, clientSessionAttributes: ClientPropMapping},
}

/**
 * Todo:
 * - pass client API key in body
 * - use key to identify environment
 */
export const fetchFFlagHandler = async (
  request: FastifyRequest<FetchFlagRequest>,
  reply: FastifyReply
): Promise<FlagClientValue> => {
  const { fflagName } = request.params;
  const { environment, clientSessionAttributes } = request.body;
  const featureFlag = await fflagRepo.findOne({ name: fflagName });
  if (!featureFlag) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flag not found" } });
  }

  const currentValue = currentFlagValue(featureFlag, PLACEHOLDER_ENVIRONMENT, clientSessionAttributes);

  return flagClientValueSchema.parse(currentValue);
};

export const getEnvironmentFFlagsHandler = async (
  request: FastifyRequest<FetchFlagsBody>,
  reply: FastifyReply
): Promise<FlagClientMapping> => {
  const { environment, clientSessionAttributes } = request.body;
  const featureFlags = await fflagRepo.getEnvironmentFlags(environment);
  if (!featureFlags) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flags not found" } });
  }

  // printDetail({ featureFlags });
  // console.log({ overrideRules: fflags[0].environments.dev?.overrideRules });

  const mapping = featureFlags.reduce((acc, featureFlag) => {
    Object.assign(acc, { [featureFlag.name]: currentFlagValue(featureFlag, PLACEHOLDER_ENVIRONMENT, clientSessionAttributes) });
    return acc;
  }, {} as FlagClientMapping);
  return mapping;
};
