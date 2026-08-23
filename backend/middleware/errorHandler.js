import { ApiError } from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { logger } from "../config/logger.js";
import { config } from "../config/env.js";

export const notFoundHandler = (req, res, next) => {
  next(new ApiError(HTTP_STATUS.NOT_FOUND, `Route not found: ${req.originalUrl}`));
};

// The single place every error in the app resolves to an HTTP response.
// Must be registered LAST in app.js, after all routes — and must keep all
// 4 parameters (err, req, res, next), since that arity is how Express
// identifies it as an error-handling middleware rather than regular
// middleware.
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Normalize known Mongoose error types into our ApiError shape, so the
  // response format stays consistent no matter where the error came from.
  if (error.name === "ValidationError") {
    const message = Object.values(error.errors)
      .map((e) => e.message)
      .join(", ");
    error = new ApiError(HTTP_STATUS.BAD_REQUEST, message);
  } else if (error.name === "CastError") {
    error = new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid ${error.path}: ${error.value}`);
  } else if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || "field";
    error = new ApiError(HTTP_STATUS.CONFLICT, `${field} already exists`);
  } else if (!(error instanceof ApiError)) {
    // Unrecognized error shape = a real bug, not expected client behavior.
    error = new ApiError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      config.NODE_ENV === "production" ? "Internal server error" : error.message,
      false
    );
  }

  // Only log at error level (with full stack) for real bugs (5xx).
  // Expected client errors (400/401/404) are routine traffic — log them
  // at a lower level so error-level logs stay meaningful and searchable.
  if (error.statusCode >= 500) {
    logger.error(err.stack || err.message);
  } else {
    logger.warn(`${error.statusCode} - ${error.message} - ${req.method} ${req.originalUrl}`);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
  });
};
