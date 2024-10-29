import dotenv from "dotenv";
import path from "path";

const envConfig = dotenv.config({
  path: path.resolve(".env"),
}).parsed;

export default envConfig;
