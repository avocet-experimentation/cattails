/* eslint-disable no-console */
import Fastify from 'fastify';
import mercurius from 'mercurius';
import mercuriusLogging from 'mercurius-logging';
import cors from '@fastify/cors';
import { fastifyAuth0Verify } from 'fastify-auth0-verify';
import cfg from './envalid.js';
import { schema } from './graphql/schemas.js';
import { resolvers } from './graphql/resolvers.js';
import { getClientRoutes } from './routes/client.routes.js';

const server = Fastify({
  logger: true,
  disableRequestLogging: true,
});
// check if service is up during deployment; check on regular frequency
server.get('/healthcheck', async () => ({ status: 'OK' }));
// register routes for out flag entity
server.register(getClientRoutes, { prefix: 'api' });
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

await server.register(fastifyAuth0Verify, {
  audience: cfg.AUTH0_AUDIENCE,
  domain: cfg.AUTH0_DOMAIN,
  secret: cfg.AUTH0_CLIENT_SECRET,
});

// middleware to authorize all requests
server.addHook('onRequest', async (request, reply) => {
  try {
    console.log(request.headers.authorization);
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
