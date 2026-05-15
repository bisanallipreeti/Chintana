import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

mongoose.set("strictQuery", true);
mongoose.set("bufferCommands", false);

export async function connectDatabase() {
  try {
    if (!env.mongoUri) {
      logger.error("❌ MONGODB_URI is missing. Server will NOT start.");
      process.exit(1); // IMPORTANT: stop server
    }

    await mongoose.connect(env.mongoUri, {
      maxPoolSize: 20,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
    });

    logger.info("✅ MongoDB connected successfully");
  } catch (error) {
    logger.error("❌ MongoDB connection failed:", error.message);
    process.exit(1); // IMPORTANT: stop server
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export function getDatabaseHealth() {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return {
    state: states[mongoose.connection.readyState] || "unknown",
  };
}
