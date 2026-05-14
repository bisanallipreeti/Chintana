import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { sendError } from "../core/http/response.js";
import { AppError } from "../core/errors/AppError.js";
import { logger } from "../config/logger.js";
import { isDevelopment } from "../config/env.js";

export function notFoundHandler(req, res) {
  return sendError(res, {
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    code: "ROUTE_NOT_FOUND",
  });
}

function normalizeError(error) {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      errors: error.details || undefined,
      isOperational: error.isOperational,
    };
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return {
      statusCode: 400,
      message: "Database validation failed.",
      code: "DB_VALIDATION_ERROR",
      errors: Object.values(error.errors).map((item) => ({
        path: item.path,
        message: item.message,
      })),
      isOperational: true,
    };
  }

  if (error instanceof mongoose.Error.CastError) {
    return {
      statusCode: 400,
      message: `Invalid value for ${error.path}.`,
      code: "CAST_ERROR",
      isOperational: true,
    };
  }

  if (error?.code === 11000) {
    const duplicateKeys = error.keyValue ? Object.keys(error.keyValue) : [];
    const duplicateField = duplicateKeys[0];
    const duplicateValue = duplicateField ? error.keyValue[duplicateField] : undefined;
    const message = duplicateField
      ? `Duplicate value for '${duplicateField}'.`
      : "Duplicate value violates a unique constraint.";

    return {
      statusCode: 409,
      message,
      code: "DUPLICATE_KEY",
      errors: duplicateField
        ? [{ path: duplicateField, message: "Already exists", value: duplicateValue }]
        : undefined,
      isOperational: true,
    };
  }

  if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
    return {
      statusCode: 401,
      message: "Invalid or expired authentication token.",
      code: "INVALID_TOKEN",
      isOperational: true,
    };
  }

  return {
    statusCode: 500,
    message: "Internal server error.",
    code: "INTERNAL_ERROR",
    isOperational: false,
  };
}

export function errorHandler(error, req, res, _next) {
  const normalized = normalizeError(error);

  if (!normalized.isOperational || isDevelopment) {
    logger.error("Request failed", {
      requestId: res.locals.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: normalized.statusCode,
      code: normalized.code,
      error: {
        message: error.message,
        stack: error.stack,
      },
    });
  }

  const message = normalized.statusCode === 500 && !isDevelopment
    ? "Internal server error."
    : normalized.message;

  return sendError(res, {
    statusCode: normalized.statusCode,
    message,
    code: normalized.code,
    errors: normalized.errors,
  });
}
