export type ResourceNotFoundErrorCode =
  | "RESOURCE_NOT_FOUND"
  | "UNKNOWN_ENDPOINT";

export type BadRequestErrorCode =
  | "INVALID_REQUEST_PARAMETERS"
  | "MISSING_REQUIRED_FIELD"
  | "INVALID_JSON_FORMAT";

export type UnauthorizedErrorCode =
  | "MISSING_AUTH_HEADER"
  | "INVALID_TOKEN"
  | "INVALID_PASSWORD";

export type ForbiddenErrorCode =
  | "ACCESS_DENIED";

export type ServerErrorCode =
  | "UNEXPECTED_ERROR"
  | "RATE_LIMIT_EXCEEDED";

export type ConflictErrorCode =
  | "EXISTING_USER_EMAIL";

export type HttpErrorCode =
  | ResourceNotFoundErrorCode
  | BadRequestErrorCode
  | UnauthorizedErrorCode
  | ForbiddenErrorCode
  | ServerErrorCode
  | ConflictErrorCode;

export abstract class HttpError extends Error {
  errorCode: HttpErrorCode;
  statusCode: number;

  constructor(statusCode: number, message: string, errorCode: HttpErrorCode) {
    super(message);
    this.name = this.constructor.name;
    this.errorCode = errorCode;
    this.statusCode = statusCode;
  }
}

export class BadRequest extends HttpError {
  constructor(message: string, errorCode: BadRequestErrorCode) {
    super(400, message, errorCode);
  }
}

export class ResourceNotFound extends HttpError {
  constructor(message: string, errorCode: ResourceNotFoundErrorCode) {
    super(404, message, errorCode);
  }
}

export class Unauthorized extends HttpError {
  constructor(message: string, errorCode: UnauthorizedErrorCode) {
    super(401, message, errorCode);
  }
}

export class Forbidden extends HttpError {
  constructor(message: string, errorCode: ForbiddenErrorCode) {
    super(403, message, errorCode);
  }
}
export class Conflict extends HttpError {
  constructor(message: string, errorCode: ConflictErrorCode) {
    super(409, message, errorCode);
  }
}

export class ServerError extends HttpError {
  constructor(message: string, errorCode: ServerErrorCode) {
    super(500, message, errorCode);
  }
}
