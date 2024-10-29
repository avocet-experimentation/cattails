import { EnvironmentName } from "@fflags/types";
import {
  CreateFFlagBodyRequest,
  CreateFFlagBodyResponse,
  FFlags,
  GetFFlagBodyResponse,
  UpdateFFlagBodyRequest,
  UpdateFFlagBodyResponse,
  State,
} from "./fflags.types.js";
import { FFlagModel, MongoDBLoader } from "@fflags/mongo-loader";

// unaware of req/res => strictly handling input and generating output (abstraction)
// next implementation requires us to think about robust validations!
export const createFFlag = async (
  fflagBody: CreateFFlagBodyRequest
): Promise<CreateFFlagBodyResponse | undefined | null> => {
  try {
    const newFFlag = await FFlagModel.create(fflagBody); // use mongo-loader's model to create flag
    return newFFlag.toJSON();
  } catch (err: any) {
    if (err.code === 11000) return null; // MongoServerError: duplicate key
  }
};

export const updateFFlag = async (
  fflagBody: UpdateFFlagBodyRequest
): Promise<UpdateFFlagBodyResponse | null> => {
  const updatedFFlag = await FFlagModel.findByIdAndUpdate(
    fflagBody.id,
    fflagBody,
    { new: true }
  ).exec();
  return updatedFFlag ? updatedFFlag.toJSON() : null;
};

export const deleteFFlag = async (fflagId: string): Promise<void> => {
  await FFlagModel.findByIdAndDelete(fflagId).exec();
};

export const getFFlagById = async (
  fflagId: string
): Promise<GetFFlagBodyResponse | null> => {
  const fflag = await FFlagModel.findById(fflagId).exec();
  return fflag ? fflag.toJSON() : null;
};

export const getFFlagByName = async (
  fflagName: string
): Promise<GetFFlagBodyResponse | null> => {
  const fflag = await FFlagModel.findOne({ name: fflagName }).exec();
  return fflag ? fflag.toJSON() : null;
};

// return the structure of the application to cache the flags in memory
// takes two parametersL environment name and state name, both of which will be used to filter the flag results
// environment name is required, state name is optional
export const getAllFFlagsWithFilter = async (
  environmentName: EnvironmentName,
  stateName: State
): Promise<FFlags | null> => {
  const fflags = await MongoDBLoader.load(environmentName, stateName);
  if (fflags.size === 0) return null;
  let fflagsOutput = {};
  for (const fflagEntry of fflags.entries()) {
    fflagsOutput = {
      ...fflagsOutput,
      [fflagEntry[0]]: fflagEntry[1],
    };
  }
  return fflagsOutput;
};
