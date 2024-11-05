import { FastifyReply, FastifyRequest } from "fastify";
import {
  CachingParams,
  CreateFFlagBodyRequest,
  CreateFFlagBodyResponse,
  FlagIdParams,
  FlagNameParams,
  GetFFlagBodyResponse,
  UpdateFFlagBodyRequest,
  UpdateFFlagBodyResponse,
} from "./fflags.types.js";
import MongoAPI, { DraftRecord } from "../lib/MongoAPI.js";
import { FeatureFlag } from "@fflags/types";
import env from "../envalid.js";
// import * as fflagService from "./fflags.service.js";

// Note: `Params` field in the generics of the request object represent the path parameters we will extract from the URL
const mongoApi = new MongoAPI(env.MONGO_TESTING_URI);

export const createFFlagHandler = async (
  request: FastifyRequest<{ Body: DraftRecord<FeatureFlag> }>,
  reply: FastifyReply
): Promise<string> => {
  const documentId = await mongoApi.createFlag(request.body);
  if (!documentId) {
    return reply
      .code(409)
      .send({ error: { code: 409, message: "flag already exists" } }); // return null due to duplicate key (name) error
  }
  return reply.code(201).send(documentId);
};

export const updateFFlagHandler = async (
  request: FastifyRequest<{
    Params: FlagIdParams;
    Body: UpdateFFlagBodyRequest;
  }>,
  reply: FastifyReply
): Promise<UpdateFFlagBodyResponse> => {
  const fflagId = request.params.fflagId;
  if (fflagId !== request.body.id) {
    return reply
      .code(422)
      .send({ error: { code: 422, message: "inconsistent request" } });
  }
  const fflag = await mongoApi.updateFFlag(request.body);
  if (!fflag) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flag not found" } });
  }
  return fflag;
};

export const deleteFFlagHandler = async (
  request: FastifyRequest<{
    Params: FlagIdParams;
    Body: UpdateFFlagBodyRequest;
  }>,
  reply: FastifyReply
): Promise<void> => {
  const fflagId = request.params.fflagId;
  await fflagService.deleteFFlag(fflagId);
  await reply.code(204).send();
};

export const getFFlagByIdHandler = async (
  request: FastifyRequest<{ Params: FlagIdParams }>,
  reply: FastifyReply
): Promise<FeatureFlag> => {
  const fflagId = request.params.fflagId;
  const fflag = await mongoApi.getFlag(fflagId);
  if (!fflag) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flag not found" } });
  }
  return fflag;
};

export const getFFlagByNameHandler = async (
  request: FastifyRequest<{ Params: FlagNameParams }>,
  reply: FastifyReply
): Promise<GetFFlagBodyResponse> => {
  const fflagName = request.params.fflagName;
  const fflag = await fflagService.getFFlagByName(fflagName);
  if (!fflag) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flag not found" } });
  }
  return fflag;
};

export const getAllFFlagsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FeatureFlag[]> => {
  const fflags = await mongoApi.getFlags();
  if (!fflags) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flags not found" } });
  }
  return fflags;
};

export const getAllFFlagsWithFilterHandler = async (
  request: FastifyRequest<{ Params: CachingParams }>,
  reply: FastifyReply
): Promise<ClientFlagMapping> => {
  const { environmentName, stateName } = request.query as {
    environmentName: EnvironmentName;
    stateName: State;
  };
  const fflags = await fflagService.getAllFFlagsWithFilter(
    environmentName,
    stateName
  );
  if (!fflags) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flags not found" } });
  }
  return fflags;
};
