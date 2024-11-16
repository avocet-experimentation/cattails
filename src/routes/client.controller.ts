import {
  ClientPropMapping,
  flagClientValueSchema,
  FlagClientValue,
  FlagClientMapping,
} from "@estuary/types";
import { FastifyReply, FastifyRequest } from "fastify";
import { getClientRepos } from "../repository/index.js";
import { printDetail } from "../lib/index.js";
import ClientFlagManager from "../lib/ClientFlagManager.js";

const repos = getClientRepos();
const flagManager = new ClientFlagManager();
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
  // const featureFlag = await repos.featureFlag.findOne({ name: fflagName });
  // if (!featureFlag) {
  //   return reply
  //     .code(404)
  //     .send({ error: { code: 404, message: "flag not found" } });
  // }

  // const currentValue = currentFlagValue(featureFlag, PLACEHOLDER_ENVIRONMENT, clientProps);
  const currentValue = await flagManager.currentFlagValue(fflagName, PLACEHOLDER_ENVIRONMENT, clientProps);

  return flagClientValueSchema.parse(currentValue);
};

export const getEnvironmentFFlagsHandler = async (
  request: FastifyRequest<FetchFlagsClientBody>,
  reply: FastifyReply
): Promise<FlagClientMapping> => {
  const { environment, clientProps } = request.body;
  const featureFlags = await repos.featureFlag.getEnvironmentFlags(environment);
  if (!featureFlags) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flags not found" } });
  }

  // printDetail({ featureFlags });
  // console.log({ overrideRules: fflags[0].environments.dev?.overrideRules });

  let mapping: FlagClientMapping = {};
  for (let i = 0; i < featureFlags.length; i += 1) {
    const { name } = featureFlags[i];
    const value = await flagManager.currentFlagValue(name, PLACEHOLDER_ENVIRONMENT, clientProps);
    Object.assign(mapping, { [name]: value });

  }
  return mapping;
};
