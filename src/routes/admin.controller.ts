import { FastifyReply, FastifyRequest } from "fastify";
import { FeatureFlag } from "@estuary/types";
import { FlagIdParam, FlagNameParam } from "./routes.types.js";
import MongoAPI, { DraftRecord, WithMongoStringId } from "../lib/MongoAPI.js";
import env from "../envalid.js";
import { PartialUpdate } from "../repository/MongoRepository.types.js";

// Note: `Params` field in the generics of the request object represent the path parameters we will extract from the URL

const mongoApi = new MongoAPI(env.MONGO_ADMIN_URI);

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

// might remove this in favor of using patch only
export const updateFFlagHandler = async (
  request: FastifyRequest<{
    Params: FlagIdParam;
    Body: WithMongoStringId<FeatureFlag>;
  }>,
  reply: FastifyReply
): Promise<string> => {

  const fflagId = request.params.fflagId;
  if (fflagId !== request.body.id) {
    return reply
      .code(422)
      .send({ error: { code: 422, message: "inconsistent request" } });
  }
  const resultDocId = await mongoApi.updateFlag(request.body);
  if (!resultDocId) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flag not found" } });
  }
  return reply.code(200).send(resultDocId);
};

export const patchFFlagHandler = async (
  request: FastifyRequest<{
    Params: FlagIdParam;
    Body: PartialUpdate<FeatureFlag>;
  }>,
  reply: FastifyReply
): Promise<string> => {
  const { fflagId } = request.params;
  if (fflagId !== request.body.id) {
    return reply
      .code(422)
      .send({ error: { code: 422, message: "inconsistent request" } });
  }
  const updatedId = await mongoApi.updateFlag(request.body);
  if (!updatedId) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flag not found" } });
  }
  return updatedId;
};

export const deleteFFlagHandler = async (
  request: FastifyRequest<{
    Params: FlagIdParam;
  }>,
  reply: FastifyReply
): Promise<void> => {
  const { fflagId } = request.params;
  const succeeded = await mongoApi.deleteFlag(fflagId);
  if (!succeeded) {
    return reply
      .code(404)
      .send({ error: {
        code: 404,
        message: `A flag with id ${fflagId} was not found or could not be deleted`,
      } });
  }
  await reply.code(204).send();
};

export const getFFlagByIdHandler = async (
  request: FastifyRequest<{ Params: FlagIdParam }>,
  reply: FastifyReply
): Promise<FeatureFlag> => {
  const { fflagId } = request.params;
  const fflag = await mongoApi.getFlag(fflagId);
  if (!fflag) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flag not found" } });
  }
  return fflag;
};

export const getFFlagByNameHandler = async (
  request: FastifyRequest<{ Params: FlagNameParam }>,
  reply: FastifyReply
): Promise<FeatureFlag> => {
  const fflagName = request.params.fflagName;
  const fflag = await mongoApi.findFlag({ name: fflagName });
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
