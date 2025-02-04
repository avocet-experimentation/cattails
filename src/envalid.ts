import 'dotenv/config';
import { cleanEnv, num, str } from 'envalid';

const cfg = cleanEnv(process.env, {
  MANAGEMENT_API_PORT: num(),
  MONGO_ADMIN_URI: str(),
});

export default cfg;
