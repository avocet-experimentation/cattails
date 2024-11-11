import {
  ClientPropMapping,
  flagClientValueSchema,
  FlagClientValue,
  FlagClientMapping
} from "@estuary/types";
import { FastifyReply, FastifyRequest } from "fastify";
import MongoAPI from "../lib/MongoAPI.js";
import env from "../envalid.js";
import { currentFlagValue } from "../lib/flagValue.js";

const mongoApi = new MongoAPI(env.MONGO_API_URI);
// until we have API keys corresponding to environments
const PLACEHOLDER_ENVIRONMENT = 'dev';

type FetchFlagRequestParams = { 
  Params: { fflagName: string, }, 
  Body: { environment: string, clientSessionAttributes: ClientPropMapping},
}

/**
 * Todo:
 * - pass client API key in body
 * - use key to identify environment
 */
export const fetchFFlagHandler = async (
  request: FastifyRequest<FetchFlagRequestParams>,
  reply: FastifyReply
): Promise<FlagClientValue> => {
  const { fflagName } = request.params;
  const { clientSessionAttributes } = request.body;
  const fflag = await mongoApi.findFlag({ name: fflagName });
  if (!fflag) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flag not found" } });
  }

  const currentValue = currentFlagValue(fflag, PLACEHOLDER_ENVIRONMENT, clientSessionAttributes);

  return flagClientValueSchema.parse(currentValue);
};

export const getEnvironmentFFlagsHandler = async (
  request: FastifyRequest<{ Params: { environmentName: string } }>,
  reply: FastifyReply
): Promise<FlagClientMapping> => {
  const { environmentName } = request.params;
  const fflags = await mongoApi.findMatchingFlags({
    environmentName
  });
  if (!fflags) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flags not found" } });
  }

  const mapping = fflags.reduce((acc, el) => {
    Object.assign(acc, { [el.name]: el });
    return acc;
  }, {});
  return mapping;
};
