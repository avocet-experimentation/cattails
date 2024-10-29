import mongoose from "mongoose";
import envConfig from "./envConfig.js";

export const connectToDB = async () => {
  const uri: string | undefined = envConfig ? envConfig.MONGO_URI : undefined;
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    authSource: "fflags",
    directConnection: true,
    autoIndex: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };
  if (uri) {
    await mongoose.connect(uri, options);
    console.log("Connected to Mongo");
  } else {
    console.error(
      "Could not connect to Mongo. Please ensure the URI is valid."
    );
  }
};
