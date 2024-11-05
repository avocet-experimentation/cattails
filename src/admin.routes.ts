import { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import {
  createFFlagHandler,
  deleteFFlagHandler,
  getAllFFlagsHandler,
  getAllFFlagsWithFilterHandler,
  getFFlagByIdHandler,
  getFFlagByNameHandler,
  updateFFlagHandler,
} from "./fflags/fflags.controller.js";


export const getAdminRoutes = async (
  server: FastifyInstance
): Promise<FastifyInstance> => {
  await server.register(cors);
  server.post("/", createFFlagHandler); // create new flag, including its environment and respective user groups
  // server.put("/:fflagId", updateFFlagHandler); // update entire flag (do we need a patch method?)
  // // server.patch("/:fflagId", patchFFlagHandler);
  // server.delete("/:fflagId", deleteFFlagHandler); // physically remove entire flag
  server.get("/id/:fflagId", getFFlagByIdHandler); // return flag by its id
  server.get("/fflags", getAllFFlagsHandler); // return flag by its id
  return server;
};
