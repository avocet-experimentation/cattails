import { FastifyReply, FastifyRequest } from "fastify";
import { DraftRecord, FeatureFlag, OverrideRule, PartialUpdate } from "@estuary/types";
import { FlagIdParam, FlagNameParam } from "./routes.types.js";
import { getAdminRepos } from "../repository/index.js";
import { MongoRecordDraft, WithMongoStringId } from "../repository/MongoRepository.js";

// Note: `Params` field in the generics of the request object represent the path parameters we will extract from the URL

const { fflagRepo } = getAdminRepos();

export const createFFlagHandler = async (
  request: FastifyRequest<{ Body: DraftRecord<FeatureFlag> }>,
  reply: FastifyReply
) => {

  const documentId = await fflagRepo.create(request.body);
  if (!documentId) {
    return reply
      .code(409)
      .send({ error: { code: 409, message: "flag already exists" } }); // return null due to duplicate key (name) error
  }
  return reply.code(201).send({ fflagId: documentId });
};

export const getFFlagByIdHandler = async (
  request: FastifyRequest<{ Params: FlagIdParam }>,
  reply: FastifyReply
) => {
  const { fflagId } = request.params;
  const fflag = await fflagRepo.get(fflagId);
  if (!fflag) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flag not found" } });
  }
  return reply.code(200).send(fflag);
};

export const getFFlagByNameHandler = async (
  request: FastifyRequest<{ Params: FlagNameParam }>,
  reply: FastifyReply
): Promise<FeatureFlag> => {
  const fflagName = request.params.fflagName;
  const fflag = await fflagRepo.findOne({ name: fflagName });
  if (!fflag) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flag not found" } });
  }
  return reply.code(200).send(fflag);
};

export const getAllFFlagsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<FeatureFlag[]> => {
  const fflags = await fflagRepo.getMany();
  if (!fflags) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flags not found" } });
  }
  return reply.code(200).send(fflags);
};

// might remove this in favor of using patch only
export const updateFFlagHandler = async (
  request: FastifyRequest<{
    Params: FlagIdParam;
    Body: WithMongoStringId<FeatureFlag>;
  }>,
  reply: FastifyReply
) => {

  const fflagId = request.params.fflagId;
  if (fflagId !== request.body.id) {
    return reply
      .code(422)
      .send({ error: { code: 422, message: "inconsistent request" } });
  }
  const resultDocId = await fflagRepo.update(request.body);
  if (!resultDocId) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flag not found" } });
  }
  return reply.code(200).send({ fflagId: resultDocId });
};

export const patchFFlagHandler = async (
  request: FastifyRequest<{
    Params: FlagIdParam;
    Body: PartialUpdate<FeatureFlag>;
  }>,
  reply: FastifyReply
) => {
  const { fflagId } = request.params;
  if (fflagId !== request.body.id) {
    return reply
      .code(422)
      .send({ error: { code: 422, message: "inconsistent request" } });
  }
  const updatedId = await fflagRepo.update(request.body);
  if (!updatedId) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flag not found" } });
  }
  return reply.code(200).send({ fflagId: updatedId });
};

export const addRuleToFFlagHandler = async (
  request: FastifyRequest<{
    Params: FlagIdParam;
    Body: { environment: string, rule: OverrideRule };
  }>,
  reply: FastifyReply
) => {
  const { fflagId } = request.params;
  const { environment, rule } = request.body;
  return reply.code(500).send({ error: { code: 500, message: "Route under maintenance" } });
  // if (fflagId !== request.body.id) {
  //   return reply
  //     .code(422)
  //     .send({ error: { code: 422, message: "inconsistent request" } });
  // }
  const succeeded = await fflagRepo.addRule(fflagId, environment, rule);
  if (!succeeded) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flag not found" } });
  }
  return reply.code(200).send({ ruleAdded: succeeded });
};

export const deleteFFlagHandler = async (
  request: FastifyRequest<{
    Params: FlagIdParam;
  }>,
  reply: FastifyReply
) => {
  const { fflagId } = request.params;
  const succeeded = await fflagRepo.delete(fflagId);
  if (!succeeded) {
    return reply
      .code(404)
      .send({ error: {
        code: 404,
        message: `A flag with id ${fflagId} was not found or could not be deleted`,
      } });
  }
  return reply.code(204).send({ fflagId });
};
