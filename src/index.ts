/* eslint-disable no-console */
import { fastifyJwt } from '@fastify/jwt';
import Fastify from 'fastify';
import mercurius from 'mercurius';
import { schema } from './graphql/schemas.js';
import { resolvers } from './graphql/resolvers.js';
import cfg from './envalid.js';
import { getClientRoutes } from './routes/client.routes.js';
import { jwtValidationObject } from './validation.js';

const server = Fastify({
  logger: true,
});
// check if service is up during deployment; check on regular frequency
server.get('/healthcheck', async () => ({ status: 'OK' }));
// register routes for out flag entity
server.register(getClientRoutes, { prefix: 'api' });
// todo: replace '*' origin with environment variable referencing dashboard
server.register(cors, { prefix: 'graphql', origin: '*' });
server.register(mercurius, {
  schema,
  resolvers,
  graphiql: true,
});
server.register(mercuriusLogging);

// configure cors
await server.register(cors, {
  prefix: 'graphql',
  origin: cfg.DASHBOARD_URL,
  credentials: true,
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
});

// configure jwt auth
await server.register(fastifyJwt, jwtValidationObject);

// middleware to authorize all requests
server.addHook('onRequest', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (error) {
    console.log(error);
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

server.listen({ port: cfg.SERVICE_PORT }, (error, address) => {
  if (error instanceof Error) {
    console.error(error);
    process.exit(1);
  }

  console.log(`\ncattails server ready at ${address}`);
});
