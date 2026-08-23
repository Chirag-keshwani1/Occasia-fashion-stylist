// A custom Error subclass carrying an HTTP status code and an
// `isOperational` flag. Operational errors (bad input, not found, auth
// failure) are expected and safe to show the client. Non-operational
// errors are bugs — logged in full, but only ever surfaced to the client
// as a generic "Internal server error" in production.
export class ApiError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}
