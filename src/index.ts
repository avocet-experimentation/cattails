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
server.register(getClientRoutes, { prefix: 'api' });

server.register(fastifyAuth0Verify, {
  audience: cfg.AUTH0_AUDIENCE,
  domain: cfg.AUTH0_DOMAIN,
  secret: cfg.AUTH0_CLIENT_SECRET,
});

server.register((instance, opts, next) => {
  instance.addHook('onRequest', instance.authenticate);
  instance.register(mercurius, {
    schema,
    resolvers,
    graphiql: true,
  });

  server.register(mercuriusLogging);
  next();
});

// configure cors
await server.register(cors, {
  prefix: 'graphql',
  origin: cfg.DASHBOARD_URL,
  credentials: true,
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
});

server.listen({ port: cfg.SERVICE_PORT }, (error, address) => {
  if (error instanceof Error) {
    console.error(error);
    process.exit(1);
  }

  console.log(`\ncattails server ready at ${address}`);
});
