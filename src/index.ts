import { fastify, FastifyInstance } from "fastify";
import mercurius from "mercurius";
import { schema, resolvers } from "./graphql/gql.js"
import env from "./envalid.js";
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
  await server.register(mercurius, {
    schema,
    resolvers,
    graphiql: true,
  });
  return server;
};

const main = async (): Promise<void> => {
  const PORT = env.SERVICE_PORT;
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
