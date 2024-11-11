import { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import {
  createFFlagHandler,
  updateFFlagHandler,
  patchFFlagHandler,
  deleteFFlagHandler,
  getAllFFlagsHandler,
  getFFlagByIdHandler,
  getFFlagByNameHandler,
} from "./admin.controller.js";
import {
  createExperimentHandler,
  updateExperimentHandler,
  patchExperimentHandler,
  deleteExperimentHandler,
  getAllExperimentsHandler,
  getExperimentByIdHandler,
  getExperimentByNameHandler

} from "./admin.excontroller.js";


export const getAdminRoutes = async (server: FastifyInstance): Promise<FastifyInstance> => {
  await server.register(cors);
  server.post("/fflags", createFFlagHandler); // create new flag, including its environment and respective user groups
  // server.put("/fflags/id/:fflagId", updateFFlagHandler); // update entire flag (do we need this?)
  server.patch("/fflags/id/:fflagId", patchFFlagHandler);
  server.delete("/fflags/id/:fflagId", deleteFFlagHandler); // delete entire flag record
  server.get("/fflags/id/:fflagId", getFFlagByIdHandler); // return flag by its id
  server.get("/fflags/name/:fflagName", getFFlagByNameHandler); // return flag by its name
  server.get("/fflags", getAllFFlagsHandler); // returns all flags
  
  server.post("/experiments", createExperimentHandler); // create new experiemnt, including its environment and respective user groups
  // server.put("/experiments/id/:experimentId", updateExperimentHandler); // update entire experiment (do we need this?)
  server.patch("/experiments/id/:experimentId", patchExperimentHandler);
  server.delete("/experiments/id/:experimentId", deleteExperimentHandler); // delete entire experiment record
  server.get("/experiment/id/:experimentId", getExperimentByIdHandler); // return experiment by its id
  server.get("/experiment/name/:experimentName", getExperimentByNameHandler); // return experiment by its name
  server.get("/experiments", getAllExperimentsHandler); // returns all experiments
  
  return server;
};
