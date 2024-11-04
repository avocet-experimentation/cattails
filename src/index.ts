import { buildServer } from "./buildServer.js";
import env from "./envalid.js";

const main = async (): Promise<void> => {
  const PORT = env.SERVICE_PORT;
  try {
    const server = await buildServer();
    await server.listen({ port: Number(PORT) });
    console.log(`FFlag server ready at port ${PORT}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

main().catch(console.error);