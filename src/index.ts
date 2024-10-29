import { buildServer } from "./buildServer.js";
import { connectToDB } from "./connectToDB.js";
import envConfig from "./envConfig.js";

const main = async (): Promise<void> => {
  const PORT: number | undefined = envConfig
    ? Number(envConfig.SERVICE_PORT)
    : undefined; // spells flag on mobile phone keypad xD
  if (PORT) {
    try {
      await connectToDB();
      const server = await buildServer();
      await server.listen({ port: PORT });
      console.log(`FFlag server ready at port ${PORT}`);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  } else {
    console.error(
      "Could not retrieve port number. Please ensure .env is configured properly"
    );
  }
};

main().catch(console.log);
