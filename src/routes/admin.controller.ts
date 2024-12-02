import { FastifyReply, FastifyRequest } from "fastify";
import { DraftRecord, FeatureFlag, OverrideRuleUnion, PartialUpdate } from "@estuary/types";
import { FlagIdParam, FlagNameParam } from "./routes.types.js";
import { PartialWithStringId } from "../repository/MongoRepository.js";
import RepositoryManager from "../repository/RepositoryManager.js";
import cfg from "../envalid.js";

// Note: `Params` field in the generics of the request object represent the path parameters we will extract from the URL
const repository = new RepositoryManager(cfg.MONGO_ADMIN_URI);

export const createFFlagHandler = async (
  request: FastifyRequest<{ Body: DraftRecord<FeatureFlag> }>,
  reply: FastifyReply
) => {

  const documentId = await repository.featureFlag.create(request.body);
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
  const fflag = await repository.featureFlag.get(fflagId);
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
  const fflag = await repository.featureFlag.findOne({ name: fflagName });
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
  const fflags = await repository.featureFlag.getMany();
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
    Body: PartialWithStringId<FeatureFlag>;
  }>,
  reply: FastifyReply
) => {

  const fflagId = request.params.fflagId;
  if (fflagId !== request.body.id) {
    return reply
      .code(422)
      .send({ error: { code: 422, message: "inconsistent request" } });
  }
  const resultDocId = await repository.featureFlag.update(request.body);
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
  const updatedId = await repository.featureFlag.update(request.body);
  if (updatedId === null) {
    return reply
      .code(404)
      .send({ error: { code: 400, message: "the input failed validation" } });
    
  } if (updatedId === false) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flag not found" } });
  }
  return reply.code(200).send({ fflagId: updatedId });
};

export const addRuleToFFlagHandler = async (
  request: FastifyRequest<{
    Params: FlagIdParam;
    Body: { rule: OverrideRuleUnion };
  }>,
  reply: FastifyReply
) => {
  const { fflagId } = request.params;
  const { rule } = request.body;
  const succeeded = await repository.featureFlag.addRuleToId(rule, fflagId);
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
  const succeeded = await repository.featureFlag.delete(fflagId);
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
