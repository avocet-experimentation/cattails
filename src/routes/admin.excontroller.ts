import { FastifyReply, FastifyRequest } from "fastify";
import { Experiment } from "@estuary/types";
import { FlagIdParam, FlagNameParam } from "./routes.types.js";
import MongoAPI, { DraftRecord, WithMongoStringId } from "../lib/MongoAPI.js";
import env from "../envalid.js";
import { PartialUpdate } from "../repository/MongoRepository.types.js";
import { getAdminRepos } from "../repository/index.js";
import exp from "constants";

// Note: `Params` field in the generics of the request object represent the path parameters we will extract from the URL

// const mongoApi = new MongoAPI(env.MONGO_ADMIN_URI);

const { experimentRepo } = getAdminRepos();

export const createExperimentHandler = async (
  request: FastifyRequest<{ Body: DraftRecord<Experiment> }>,
  reply: FastifyReply
): Promise<string> => {

  const documentId = await experimentRepo.create(request.body);
  if (!documentId) {
    return reply
      .code(409)
      .send({ error: { code: 409, message: "Experiment already exists" } }); // return null due to duplicate key (name) error
  }
  return reply.code(201).send(documentId);
};

// might remove this in favor of using patch only
export const updateExperimentHandler = async (
  request: FastifyRequest<{
    Params: FlagIdParam;
    Body: WithMongoStringId<Experiment>;
  }>,
  reply: FastifyReply
): Promise<string> => {

  const experimentId = request.params.experimentId;
  if (experimentId !== request.body.id) {
    return reply
      .code(422)
      .send({ error: { code: 422, message: "inconsistent request" } });
  }
  const resultDocId = await experimentRepo.update(request.body);
  if (!resultDocId) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "Experiment not found" } });
  }
  return reply.code(200).send(resultDocId);
};

export const patchExperimentHandler = async (
  request: FastifyRequest<{
    Params: FlagIdParam;
    Body: PartialUpdate<Experiment>;
  }>,
  reply: FastifyReply
): Promise<boolean> => {
  const { experimentId } = request.params.experimentId;
  if (experimentId !== request.body.id) {
    return reply
      .code(422)
      .send({ error: { code: 422, message: "inconsistent request" } });
  }
  const updatedId = await experimentRepo.update(request.body);
  if (!updatedId) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "Experiment not found" } });
  }
  return updatedId;
};

export const deleteExperimentHandler = async (
  request: FastifyRequest<{
    Params: FlagIdParam;
  }>,
  reply: FastifyReply
): Promise<void> => {
  const { experimentId } = request.params.experimentId;
  const succeeded = await experimentRepo.delete(experimentId);
  if (!succeeded) {
    return reply
      .code(404)
      .send({ error: {
        code: 404,
        message: `An experiment with id ${experimentId} was not found or could not be deleted`,
      } });
  }
  await reply.code(204).send();
};

export const getExperimentByIdHandler = async (
  request: FastifyRequest<{ Params: FlagIdParam }>,
  reply: FastifyReply
): Promise<Experiment> => {
  const { experimentId } = request.params;
  const fflag = await experimentRepo.get(experimentId);
  if (!fflag) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "Experiment not found" } });
  }
  return fflag;
};

export const getExperimentByNameHandler = async (
  request: FastifyRequest<{ Params: FlagNameParam }>,
  reply: FastifyReply
): Promise<Experiment> => {
  const experimentName = request.params.experimentName;
  const experiment = await experimentRepo.find({ name: experimentName });
  if (!experiment) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "Experiment not found" } });
  }
  return experiment;
};

export const getAllExperimentsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<Experiment[]> => {
  const experiments = await experimentRepo.getMany();
  if (!experiments) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "Experiments not found" } });
  }
  return experiments;
};
