import 'dotenv/config';
import { cleanEnv, str } from "envalid";

const env = cleanEnv(process.env, {
  MONGO_DATABASE: str(),
  MONGO_URI: str(),
  MONGO_TESTING_DATABASE: str(),
  MONGO_TESTING_URI: str(),
  SERVICE_PORT: str(),
});

export default env;