import { fastify, FastifyInstance } from "fastify";
import mercurius from "mercurius";
import cors from "@fastify/cors";
import { schema } from "./graphql/schemas.js"
import { resolvers } from "./graphql/resolvers.js";
import cfg from "./envalid.js";
import { getClientRoutes } from "./routes/client.routes.js";
import { getAdminRoutes } from "./routes/admin.routes.js";

export const buildServer = async (): Promise<FastifyInstance> => {
  const server = fastify({
    logger: true,
  });
  // check if service is up during deployment; check on regular frequency
  server.get("/healthcheck", async () => ({ status: "OK" }));
  // register routes for out flag entity
  await server.register(getClientRoutes, { prefix: "api" });
  await server.register(getAdminRoutes, { prefix: "admin" });
  // todo: replace '*' origin with environment variable referencing dashboard
  await server.register(cors, { prefix: 'graphql', origin: '*' });
  await server.register(mercurius, {
    schema,
    resolvers,
    graphiql: true,
  });
  return server;
};

const main = async (): Promise<void> => {
  const PORT = cfg.SERVICE_PORT;
  try {
    const server = await buildServer();
    await server.listen({ port: PORT });
    console.log(`cattails server ready at port ${PORT}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

main().catch(console.error);
