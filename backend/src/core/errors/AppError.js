export class AppError extends Error {
  constructor(statusCode, message, options = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = options.code || "APP_ERROR";
    this.isOperational = options.isOperational ?? true;
    this.details = options.details || null;
  }

  static badRequest(message, details) {
    return new AppError(400, message, { code: "BAD_REQUEST", details });
  }

  static unauthorized(message = "Authentication required.") {
    return new AppError(401, message, { code: "UNAUTHORIZED" });
  }

  static forbidden(message = "Forbidden.") {
    return new AppError(403, message, { code: "FORBIDDEN" });
  }

  static notFound(message = "Resource not found.") {
    return new AppError(404, message, { code: "NOT_FOUND" });
  }

  static conflict(message, details) {
    return new AppError(409, message, { code: "CONFLICT", details });
  }

  static tooManyRequests(message) {
    return new AppError(429, message, { code: "TOO_MANY_REQUESTS" });
  }

  static internal(message = "Internal server error") {
    return new AppError(500, message, { code: "INTERNAL_ERROR", isOperational: false });
  }
}
