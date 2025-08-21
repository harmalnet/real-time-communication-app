export type ResourceNotFoundErrorCode =
  | "RESOURCE_NOT_FOUND"
  | "UNKNOWN_ENDPOINT"
  | "USER_NOT_FOUND"
  | "ROOM_NOT_FOUND"
  | "MESSAGE_NOT_FOUND";

export type BadRequestErrorCode =
  | "INVALID_REQUEST_PARAMETERS"
  | "MISSING_REQUIRED_FIELD"
  | "INVALID_JSON_FORMAT"
  | "INVALID_PAGINATION_PARAMS"
  | "INVALID_ROOM_OPERATION";

export type UnauthorizedErrorCode =
  | "MISSING_AUTH_HEADER"
  | "INVALID_TOKEN"
  | "INVALID_PASSWORD"
  | "TOKEN_EXPIRED"
  | "USER_NOT_FOUND";

export type ForbiddenErrorCode =
  | "ACCESS_DENIED"
  | "NOT_ROOM_MEMBER"
  | "INSUFFICIENT_PERMISSIONS"
  | "ROOM_ACCESS_DENIED";

export type ServerErrorCode =
  | "UNEXPECTED_ERROR"
  | "RATE_LIMIT_EXCEEDED"
  | "DATABASE_ERROR"
  | "EXTERNAL_SERVICE_ERROR";

export type ConflictErrorCode =
  | "EXISTING_USER_EMAIL"
  | "EXISTING_USERNAME"
  | "DUPLICATE_RESOURCE"
  | "ROOM_ALREADY_JOINED";

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
