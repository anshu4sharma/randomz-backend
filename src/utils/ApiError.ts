import { ErrorDetail } from "../@types";

class ApiError extends Error {
  data: any | null;
  success: boolean;
  constructor(
    public statusCode: number,
    public message = "Something went wrong",
    public errors: ErrorDetail[] = [], // Initialize errors as an empty array by default
    public stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
