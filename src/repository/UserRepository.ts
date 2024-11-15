import { User, userSchema } from "@estuary/types";
import MongoRepository from "./MongoRepository.js";

export default class UserRepository extends MongoRepository<User, typeof userSchema> {
  constructor(mongoUri: string) {
    super('User', userSchema, mongoUri);
  }
}
