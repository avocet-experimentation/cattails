import dotenv from "dotenv";
import path from "path";

const config = dotenv.config({
  path: path.resolve(".env"),
});

if (config.parsed === undefined) {
  throw new Error('Unable to resolve environment configuration');
}

export default config.parsed ?? {};
