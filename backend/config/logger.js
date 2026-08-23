import winston from "winston";
import { config } from "./env.js";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Human-readable format for local development
const devFormat = combine(
  colorize(),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

// Structured JSON for production — this is what a real log aggregator
// (e.g. a hosted logging service, or even just grep on structured fields)
// needs. Human-readable colored logs are actively harder to parse by tools.
const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: config.NODE_ENV === "production" ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
  // Never let a logging failure crash the app
  exitOnError: false,
});

// Morgan (HTTP request logging) needs a `.write()`-compatible stream —
// this adapter pipes morgan's access logs through Winston so ALL logging
// in the app — request logs and application logs — goes through one
// consistent pipeline, instead of morgan writing straight to stdout while
// everything else goes through Winston separately.
export const morganStream = {
  write: (message) => logger.info(message.trim()),
};
