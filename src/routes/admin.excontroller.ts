import { FastifyReply, FastifyRequest } from "fastify";
import { Experiment, PartialUpdate } from "@estuary/types";
import { ExperimentIdParam, ExperimentNameParam } from "./routes.types.js";
import { DraftRecord, WithMongoStringId } from "../lib/MongoAPI.js";
import { getAdminRepos } from "../repository/index.js";

// Note: `Params` field in the generics of the request object represent the path parameters we will extract from the URL

// const mongoApi = new MongoAPI(env.MONGO_ADMIN_URI);

const { experiment } = getAdminRepos();

export const createExperimentHandler = async (
  request: FastifyRequest<{ Body: DraftRecord<Experiment> }>,
  reply: FastifyReply
): Promise<string> => {

  const documentId = await experiment.create(request.body);
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
    Params: ExperimentIdParam;
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
  const resultDocId = await experiment.update(request.body);
  if (!resultDocId) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "Experiment not found" } });
  }
  return reply.code(200).send(resultDocId);
};

export const patchExperimentHandler = async (
  request: FastifyRequest<{
    Params: ExperimentIdParam;
    Body: PartialUpdate<Experiment>;
  }>,
  reply: FastifyReply
): Promise<boolean> => {
  const { experimentId } = request.params;
  if (experimentId !== request.body.id) {
    return reply
      .code(422)
      .send({ error: { code: 422, message: "inconsistent request" } });
  }
  const updatedId = await experiment.update(request.body);
  if (!updatedId) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "Experiment not found" } });
  }
  return updatedId;
};

export const deleteExperimentHandler = async (
  request: FastifyRequest<{
    Params: ExperimentIdParam;
  }>,
  reply: FastifyReply
): Promise<void> => {
  const { experimentId } = request.params;
  const succeeded = await experiment.delete(experimentId);
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
  request: FastifyRequest<{ Params: ExperimentIdParam }>,
  reply: FastifyReply
): Promise<Experiment> => {
  const { experimentId } = request.params;
  const fflag = await experiment.get(experimentId);
  if (!fflag) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "Experiment not found" } });
  }
  return fflag;
};

export const getExperimentByNameHandler = async (
  request: FastifyRequest<{ Params: ExperimentNameParam }>,
  reply: FastifyReply
): Promise<Experiment> => {
  const { experimentName } = request.params;
  const foundExperiment = await experiment.findOne({ name: experimentName });
  if (!foundExperiment) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "Experiment not found" } });
  }
  return foundExperiment;
};

export const getAllExperimentsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<Experiment[]> => {
  const foundExperiments = await experiment.getMany();
  if (!foundExperiments) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "Experiments not found" } });
  }
  return foundExperiments;
};
