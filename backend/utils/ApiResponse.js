export class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }
}

// Every success response in the app should go through this, so the
// frontend can always rely on one consistent shape:
// { statusCode, success, message, data }
export const sendResponse = (res, statusCode, data, message) =>
  res.status(statusCode).json(new ApiResponse(statusCode, data, message));
