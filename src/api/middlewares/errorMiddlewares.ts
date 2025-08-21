import { NextFunction, Request, Response } from "express";

import { HttpError } from "../../errors/httpErrors";

export function errorLogger(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  next(err);
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Handle JSON parsing errors
  const isInvalidJSON =
    err instanceof SyntaxError &&
    "body" in err &&
    err.message.toLowerCase().includes("json");

  if (isInvalidJSON) {
    return res.error(400, err.message, "INVALID_JSON_FORMAT");
  }

  // Handle validation errors from Zod
  if (err.name === "ZodError") {
    return res.error(400, "Validation failed", "INVALID_REQUEST_PARAMETERS");
  }

  // Handle Sequelize errors
  if (
    err.name === "SequelizeValidationError" ||
    err.name === "SequelizeUniqueConstraintError"
  ) {
    return res.error(
      400,
      "Data validation failed",
      "INVALID_REQUEST_PARAMETERS"
    );
  }

  // Handle custom HTTP errors
  if (err instanceof HttpError) {
    return res.error(err.statusCode, err.message, err.errorCode);
  }

  // Handle database connection errors
  if (
    err.name === "SequelizeConnectionError" ||
    err.name === "SequelizeConnectionRefusedError"
  ) {
    return res.error(503, "Database connection failed", "UNEXPECTED_ERROR");
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.error(401, "Invalid token", "INVALID_TOKEN");
  }

  if (err.name === "TokenExpiredError") {
    return res.error(401, "Token expired", "INVALID_TOKEN");
  }

  // Default server error
  console.error("Unhandled error:", err);
  res.error(500, "An unexpected error occurred", "UNEXPECTED_ERROR");
}
