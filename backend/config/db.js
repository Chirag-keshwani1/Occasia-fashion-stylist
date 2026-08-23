import mongoose from "mongoose";
import { config } from "./env.js";
import { logger } from "./logger.js";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.MONGO_URI);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }

  // Visibility into connection health after the initial connect — the
  // first signal of network issues, Atlas IP allowlist problems, or
  // cluster downtime in production is usually one of these events firing.
  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });
  mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB reconnected");
  });
  mongoose.connection.on("error", (err) => {
    logger.error(`MongoDB connection error: ${err.message}`);
  });
};

// Exposed for the /health/db endpoint — readyState 1 means connected.
export const isDbConnected = () => mongoose.connection.readyState === 1;
