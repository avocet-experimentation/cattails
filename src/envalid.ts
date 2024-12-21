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
  AUTH0_DOMAIN: str(),
  AUTH0_AUDIENCE: str(),
  AUTH0_CLIENT_ID: str(),
  AUTH0_CLIENT_SECRET: str(),
  DASHBOARD_URL: str(),
});

export default cfg;
