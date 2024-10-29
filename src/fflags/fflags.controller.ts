import { FastifyReply, FastifyRequest } from "fastify";
import {
  CachingParams,
  CreateFFlagBodyRequest,
  CreateFFlagBodyResponse,
  FFlags,
  FlagIdParams,
  FlagNameParams,
  GetFFlagBodyResponse,
  UpdateFFlagBodyRequest,
  UpdateFFlagBodyResponse,
} from "./fflags.types.js";
import * as fflagService from "./fflags.service.js";
import { EnvironmentName, State } from "@fflags/types";

// Note: `Params` field in the generics of the request object represent the path parameters we will extract from the URL

export const createFFlagHandler = async (
  request: FastifyRequest<{ Body: CreateFFlagBodyRequest }>,
  reply: FastifyReply
): Promise<CreateFFlagBodyResponse> => {
  const fflag = await fflagService.createFFlag(request.body);
  if (!fflag) {
    return reply
      .code(409)
      .send({ error: { code: 409, message: "flag already exists" } }); // return null due to duplicate key (name) error
  }
  return reply.code(201).send(fflag);
};

export const updateFFlagHandler = async (
  request: FastifyRequest<{
    Params: FlagIdParams;
    Body: UpdateFFlagBodyRequest;
  }>,
  reply: FastifyReply
): Promise<UpdateFFlagBodyResponse> => {
  const fflagId = request.params.fflagId;
  if (fflagId !== request.body.id) {
    return reply
      .code(422)
      .send({ error: { code: 422, message: "inconsistent request" } });
  }
  const fflag = await fflagService.updateFFlag(request.body);
  if (!fflag) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flag not found" } });
  }
  return fflag;
};

export const deleteFFlagHandler = async (
  request: FastifyRequest<{
    Params: FlagIdParams;
    Body: UpdateFFlagBodyRequest;
  }>,
  reply: FastifyReply
): Promise<void> => {
  const fflagId = request.params.fflagId;
  await fflagService.deleteFFlag(fflagId);
  await reply.code(204).send();
};

export const getFFlagByIdHandler = async (
  request: FastifyRequest<{ Params: FlagIdParams }>,
  reply: FastifyReply
): Promise<GetFFlagBodyResponse> => {
  const fflagId = request.params.fflagId;
  const fflag = await fflagService.getFFlagById(fflagId);
  if (!fflag) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flag not found" } });
  }
  return fflag;
};

export const getFFlagByNameHandler = async (
  request: FastifyRequest<{ Params: FlagNameParams }>,
  reply: FastifyReply
): Promise<GetFFlagBodyResponse> => {
  const fflagName = request.params.fflagName;
  const fflag = await fflagService.getFFlagByName(fflagName);
  if (!fflag) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flag not found" } });
  }
  return fflag;
};

export const getAllFFlagsWithFilterHandler = async (
  request: FastifyRequest<{ Params: CachingParams }>,
  reply: FastifyReply
): Promise<FFlags> => {
  const { environmentName, stateName } = request.query as {
    environmentName: EnvironmentName;
    stateName: State;
  };
  const fflags = await fflagService.getAllFFlagsWithFilter(
    environmentName,
    stateName
  );
  if (!fflags) {
    return reply
      .code(404)
      .send({ error: { code: 404, message: "flags not found" } });
  }
  return fflags;
};
