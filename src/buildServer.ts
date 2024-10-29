import { fastify, FastifyInstance } from "fastify";
import { getFFlagsRoutes } from "./fflags/fflags.routes.js";

export const buildServer = async (): Promise<FastifyInstance> => {
  const server = fastify({
    logger: true,
  });
  // check if service is up during deployment; check on regular frequency
  server.get("/healthcheck", async () => ({ status: "OK" }));
  // register routes for out flag entity
  await server.register(getFFlagsRoutes, { prefix: "api/fflags" });
  return server;
};
