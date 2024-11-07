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


export const getAdminRoutes = async (server: FastifyInstance): Promise<FastifyInstance> => {
  await server.register(cors);
  server.post("/fflags", createFFlagHandler); // create new flag, including its environment and respective user groups
  // server.put("/fflags/id/:fflagId", updateFFlagHandler); // update entire flag (do we need this?)
  server.patch("/fflags/id/:fflagId", patchFFlagHandler);
  server.delete("/fflags/id/:fflagId", deleteFFlagHandler); // delete entire flag record
  server.get("/fflags/id/:fflagId", getFFlagByIdHandler); // return flag by its id
  server.get("/fflags/name/:fflagName", getFFlagByNameHandler); // return flag by its name
  server.get("/fflags", getAllFFlagsHandler); // returns all flags
  return server;
};
