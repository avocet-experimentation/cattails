import 'dotenv/config';
import { cleanEnv, num, str } from 'envalid';

const cfg = cleanEnv(process.env, {
  MONGO_DATABASE: str(),
  MONGO_ADMIN_URI: str(),
  MONGO_API_URI: str(),
  MONGO_TESTING_DATABASE: str(),
  MONGO_TESTING_URI: str(),
  SERVICE_PORT: num(),
  SALT_ROUNDS: num(),
});

export default cfg;
