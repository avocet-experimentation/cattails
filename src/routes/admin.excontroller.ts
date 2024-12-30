import { FastifyReply, FastifyRequest } from 'fastify';
import { DraftRecord, Experiment, PartialUpdate } from '@avocet/core';
import { ExperimentIdParam, ExperimentNameParam } from './routes.types.js';
import RepositoryManager from '../repository/RepositoryManager.js';
import cfg from '../envalid.js';
import { PartialWithStringId } from '../repository/repository-types.js';

const repository = new RepositoryManager(cfg.MONGO_ADMIN_URI);

export const createExperimentHandler = async (
  request: FastifyRequest<{ Body: DraftRecord<Experiment> }>,
  reply: FastifyReply,
): Promise<string> => {
  try {
    const documentId = await repository.experiment.create(request.body);
    return await reply.code(201).send(documentId);
  } catch (e) {
    return reply
      .code(409)
      .send({ error: { code: 409, message: 'Experiment already exists' } });
  }
};

// might remove this in favor of using patch only
export const updateExperimentHandler = async (
  request: FastifyRequest<{
    Params: ExperimentIdParam;
    Body: PartialWithStringId<Experiment>;
  }>,
  reply: FastifyReply,
): Promise<string> => {
  const { experimentId } = request.params;
  if (experimentId !== request.body.id) {
    return reply
      .code(422)
      .send({ error: { code: 422, message: 'inconsistent request' } });
  }
  const resultDocId = await repository.experiment.update(request.body);
  if (!resultDocId) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: 'Experiment not found' } });
  }
  return reply.code(200).send(resultDocId);
};

export const patchExperimentHandler = async (
  request: FastifyRequest<{
    Params: ExperimentIdParam;
    Body: PartialUpdate<Experiment>;
  }>,
  reply: FastifyReply,
): Promise<boolean> => {
  const { experimentId } = request.params;
  if (experimentId !== request.body.id) {
    return reply
      .code(422)
      .send({ error: { code: 422, message: 'inconsistent request' } });
  }
  const updatedId = await repository.experiment.update(request.body);
  if (!updatedId) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: 'Experiment not found' } });
  }
  return updatedId;
};

export const deleteExperimentHandler = async (
  request: FastifyRequest<{
    Params: ExperimentIdParam;
  }>,
  reply: FastifyReply,
): Promise<void> => {
  const { experimentId } = request.params;
  const succeeded = await repository.experiment.delete(experimentId);
  if (!succeeded) {
    return reply.code(404).send({
      error: {
        code: 404,
        message: `An experiment with id ${experimentId} was not found or could not be deleted`,
      },
    });
  }
  return reply.code(200).send({ deleted: succeeded });
};

export const getExperimentByIdHandler = async (
  request: FastifyRequest<{ Params: ExperimentIdParam }>,
  reply: FastifyReply,
): Promise<Experiment> => {
  const { experimentId } = request.params;
  const foundExperiment = await repository.experiment.get(experimentId);
  if (!foundExperiment) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: 'Experiment not found' } });
  }
  return foundExperiment;
};

export const getExperimentByNameHandler = async (
  request: FastifyRequest<{ Params: ExperimentNameParam }>,
  reply: FastifyReply,
): Promise<Experiment> => {
  const { experimentName } = request.params;
  const foundExperiment = await repository.experiment.findOne({
    name: experimentName,
  });
  if (!foundExperiment) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: 'Experiment not found' } });
  }
  return foundExperiment;
};

export const getAllExperimentsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<Experiment[]> => {
  const foundExperiments = await repository.experiment.getMany();
  if (!foundExperiments) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: 'Experiments not found' } });
  }
  return foundExperiments;
};

export const startExperimentHandler = async (
  request: FastifyRequest<{ Params: ExperimentIdParam }>,
  reply: FastifyReply,
): Promise<Experiment> => {
  const { experimentId } = request.params;
  const foundExperiment = await repository.experiment.get(experimentId);
  if (!foundExperiment) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: 'Experiment not found' } });
  }
  const updatedStatus = await repository.experiment.start(experimentId);
  if (!updatedStatus) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: 'Unable to start experiment' } });
  }
  return foundExperiment;
};
