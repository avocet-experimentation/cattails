import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import {
  createFFlagHandler,
  deleteFFlagHandler,
  getAllFFlagsWithFilterHandler,
  getFFlagByIdHandler,
  getFFlagByNameHandler,
  updateFFlagHandler,
} from "./fflags/fflags.controller.js";
import { FeatureFlagClientData, ClientFlagMapping, ClientSessionAttribute } from "@fflags/types";
import { FlagNameParams } from "./fflags/fflags.types.js";
import MongoAPI from "./lib/MongoAPI.js";
import env from "./envalid.js";
import { hashAndAssign } from "./lib/hash.js";

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

const mongoApi = new MongoAPI(env.MONGO_TESTING_URI);

// map http methods to the path and the handlers which are implemented in the controller
export const getClientRoutes = async (
  server: FastifyInstance
): Promise<FastifyInstance> => {
  await server.register(cors);
  
  /**
   * Fetch the value for a given flag
   * 
   */
  server.post("/fflags/name/:fflagName", async (
    request: FastifyRequest<{ 
      Params: FlagNameParams, 
      Body: { environment: string, clientSessionAttributes: ClientSessionAttribute[]},
    }>,
    reply: FastifyReply
  ): Promise<FeatureFlagClientData> => {
    const { fflagName } = request.params;
    const { clientSessionAttributes } = request.body;
    const fflag = await mongoApi.findFlag({ name: fflagName });
    if (!fflag) {
      return reply
        .code(404)
        .send({ error: { code: 404, message: "flag not found" } });
    }

    let clientData = {
      name: fflag.name,
      valueType: fflag.valueType,
      defaultValue: fflag.defaultValue,
      currentValue: fflag.defaultValue,
    };

    const experiments = await mongoApi.getAllExperiments();
    // for now, assume enrollment into the first experiment if any
    if (experiments.length > 0) {
      const { groups } = experiments[0];
      const groupIds = groups.map((group) => group.id);
      const assignmentGroupId = hashAndAssign(clientSessionAttributes, groupIds);
      const assignedGroup = groups.find((group) => group.id === assignmentGroupId);
      clientData.currentValue = assignedGroup.blocks[0].flagValue;
    }
    // hash user identifiers to select an experiment block
    return clientData;
  }); // return flag by its name
  
  server.post("fflags/caching", getAllFFlagsWithFilterHandler); // return flags in structure we are using to cache them in memory
  return server;
};
