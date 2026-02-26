import mongoose from "mongoose";
import config from "./env.js";

const connectDb = async () => {
  try {
    await mongoose.connect(config.connecting_str, {
      dbName: "chat-application",
    });
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

export default connectDb;
