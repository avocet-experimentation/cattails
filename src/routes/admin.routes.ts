import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cfg from '../envalid.js';
import { fastifyJwt } from '@fastify/jwt';
import got from 'got';
import jwkToPem from 'jwk-to-pem';
import {
  createFFlagHandler,
  updateFFlagHandler,
  patchFFlagHandler,
  addRuleToFFlagHandler,
  deleteFFlagHandler,
  getAllFFlagsHandler,
  getFFlagByIdHandler,
  getFFlagByNameHandler,
} from './admin.controller.js';
import {
  createExperimentHandler,
  updateExperimentHandler,
  patchExperimentHandler,
  deleteExperimentHandler,
  getAllExperimentsHandler,
  getExperimentByIdHandler,
  getExperimentByNameHandler,
  startExperimentHandler,

} from './admin.excontroller.js';

export const getAdminRoutes = async (server: FastifyInstance): Promise<FastifyInstance> => {
  await server.register(cors, {
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });
  const jwksCache = new Map();

  async function getJWKS() {
    if (jwksCache.has('keys')) {
      return jwksCache.get('keys');
    }

    const response = await got.get(`${cfg.AUTH0_DOMAIN}.well-known/jwks.json`).json();

    const keys = response.keys.map(key => ({
      ...key,
      publicKey: jwkToPem(key),
    }));

    jwksCache.set('keys', keys);
    return keys;
  }

  await server.register(fastifyJwt, {
    decode: { complete: true },
    secret: async (request, token) => {
      const decoded = token.header;
      const keys = await getJWKS();
      const key = keys.find(k => k.kid === decoded.kid);

      if (!key) {
        throw new Error('Unknown key');
      }

      return key.publicKey || key;
    },
    verify: {
      allowedAud: cfg.AUTH0_AUDIENCE,
      allowedIss: cfg.AUTH0_DOMAIN,
      algorithms: ['RS256'],
    },
  });

  server.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (error) {
      console.log(error);
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });
  server.post('/fflags', createFFlagHandler); // create new flag, including its environment and respective user groups
  // server.put('/fflags/id/:fflagId', updateFFlagHandler); // update entire flag (do we need this?)
  server.patch('/fflags/id/:fflagId', patchFFlagHandler);
  server.patch('/fflags/id/:fflagId/addRule', addRuleToFFlagHandler);
  server.delete('/fflags/id/:fflagId', deleteFFlagHandler); // delete entire flag record
  server.get('/fflags/id/:fflagId', getFFlagByIdHandler); // return flag by its id
  server.get('/fflags/name/:fflagName', getFFlagByNameHandler); // return flag by its name
  server.get('/fflags', getAllFFlagsHandler); // returns all flags

  server.post('/experiments', createExperimentHandler); // create new experiemnt, including its environment and respective user groups
  // server.put('/experiments/id/:experimentId', updateExperimentHandler); update entire experiment
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
