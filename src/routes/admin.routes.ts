import { FastifyInstance } from 'fastify';
import { fastifyJwt } from '@fastify/jwt';
import {
  createFFlagHandler,
  patchFFlagHandler,
  addRuleToFFlagHandler,
  deleteFFlagHandler,
  getAllFFlagsHandler,
  getFFlagByIdHandler,
  getFFlagByNameHandler,
} from './admin.controller.js';
import {
  createExperimentHandler,
  patchExperimentHandler,
  deleteExperimentHandler,
  getAllExperimentsHandler,
  getExperimentByIdHandler,
  getExperimentByNameHandler,
  startExperimentHandler,
} from './admin.excontroller.js';
import { jwtValidationObject } from '../validation.js';

export const getAdminRoutes = async (
  server: FastifyInstance,
): Promise<FastifyInstance> => {
  await server.register(fastifyJwt, jwtValidationObject);

  server.post('/fflags', createFFlagHandler); // create new flag, including its environment and respective user groups
  server.patch('/fflags/id/:fflagId', patchFFlagHandler);
  server.patch('/fflags/id/:fflagId/addRule', addRuleToFFlagHandler);
  server.delete('/fflags/id/:fflagId', deleteFFlagHandler); // delete entire flag record
  server.get('/fflags/id/:fflagId', getFFlagByIdHandler); // return flag by its id
  server.get('/fflags/name/:fflagName', getFFlagByNameHandler); // return flag by its name
  server.get('/fflags', getAllFFlagsHandler); // returns all flags

  server.post('/experiments', createExperimentHandler); // create new experiemnt, including its environment and respective user groups
  server.patch('/experiments/id/:experimentId', patchExperimentHandler);
  server.delete('/experiments/id/:experimentId', deleteExperimentHandler); // delete entire experiment record
  server.get('/experiments/id/:experimentId', getExperimentByIdHandler); // return experiment by its id
  server.get('/experiments/name/:experimentName', getExperimentByNameHandler); // return experiment by its name
  server.get('/experiments', getAllExperimentsHandler); // returns all experiments
  server.get('/experiments/id/:experimentId/start', startExperimentHandler); // start experiment

  server.get('/profile', async (request, reply) => {
    const token = request.headers.authorization;
    reply.send({ token });
  });

  return server;
};
