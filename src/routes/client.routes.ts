import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import {
  fetchFFlagHandler,
  getEnvironmentFFlagsHandler,
} from './client.controller.js';

// // security (disabled for now)
// const corsConfig = {
//   origin: (origin, cb) => {
//     const hostname = new URL(origin).hostname;
//     if (hostname === "localhost") {
//       //  Request from localhost will pass
//       cb(null, true);
//       return;
//     }
//     // Generate an error on other origins, disabling access
//     cb(new Error("Not allowed"), false);
//   },
// };

// map http methods to the path and the handlers which are implemented in the controller
export const getClientRoutes = async (
  server: FastifyInstance,
): Promise<FastifyInstance> => {
  await server.register(cors);

  // todo: remove the flag name from the route since this leaks information
  server.post('/fflag', fetchFFlagHandler); // return flag by its name
  server.post('/fflags', getEnvironmentFFlagsHandler); // return a hash table of flags enabled for the selected environment

  return server;
};
