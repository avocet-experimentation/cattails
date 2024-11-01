import { buildServer } from "./buildServer.js";
import { connectToDB } from "./connectToDB.js";
import env from "./envalid.js";

const main = async (): Promise<void> => {
  const PORT = env.SERVICE_PORT; // spells flag on mobile phone keypad xD
  try {
    await connectToDB();
    const server = await buildServer();
    await server.listen({ port: PORT });
    console.log(`FFlag server ready at port ${PORT}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

main().catch(console.log);
