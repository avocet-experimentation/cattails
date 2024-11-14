import { User, userSchema } from "@estuary/types";
import MongoRepository from "./MongoRepository.js";

export default class UserRepository extends MongoRepository<User> {
  constructor(mongoUri: string) {
    super('user', userSchema, mongoUri);
  }
}
