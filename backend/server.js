// config/env.js must be the very first import — it loads and validates
// .env before anything else in the app tries to read from it.
import { config } from "./config/env.js";
import { logger } from "./config/logger.js";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const startServer = async () => {
  await connectDB();

  const server = app.listen(config.PORT, () => {
    logger.info(`Server running on port ${config.PORT} [${config.NODE_ENV}]`);
  });

  // Graceful shutdown: deploy platforms send SIGTERM before killing the
  // process. Handling it lets in-flight requests finish instead of being
  // dropped mid-response during a deploy.
  const shutdown = (signal) => {
    logger.info(`${signal} received: closing server gracefully`);
    server.close(() => {
      logger.info("Server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Last line of defense: log truly unexpected errors instead of letting
  // the process die silently with no trace of what happened.
  process.on("unhandledRejection", (reason) => {
    logger.error(`Unhandled Rejection: ${reason}`);
  });
  process.on("uncaughtException", (err) => {
    logger.error(`Uncaught Exception: ${err.stack || err.message}`);
    process.exit(1);
  });
};

startServer();
