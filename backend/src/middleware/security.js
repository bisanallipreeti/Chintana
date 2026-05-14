import helmet from "helmet";
import hpp from "hpp";
import cors from "cors";
import { env } from "../config/env.js";

function isAllowedOrigin(origin) {
  if (!origin) return true;
  return env.allowedOrigins.includes(origin);
}

export function configureCors() {
  return cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
  });
}

export function configureSecurityMiddlewares(app) {
  const sanitizeNoSqlInjection = (req, _res, next) => {
    const sanitize = (value) => {
      if (!value || typeof value !== "object") return;

      Object.keys(value).forEach((key) => {
        if (key.startsWith("$") || key.includes(".")) {
          delete value[key];
          return;
        }

        sanitize(value[key]);
      });
    };

    sanitize(req.body);
    sanitize(req.query);
    sanitize(req.params);
    next();
  };

  const sanitizeXssPayload = (req, _res, next) => {
    const sanitizeString = (value) =>
      value
        .replace(/<script.*?>.*?<\/script>/gi, "")
        .replace(/[<>]/g, "");

    const traverse = (value) => {
      if (typeof value === "string") {
        return sanitizeString(value);
      }

      if (Array.isArray(value)) {
        return value.map(traverse);
      }

      if (value && typeof value === "object") {
        Object.keys(value).forEach((key) => {
          value[key] = traverse(value[key]);
        });
      }

      return value;
    };

    traverse(req.body);
    traverse(req.query);
    traverse(req.params);
    next();
  };

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    }),
  );
  app.use(sanitizeNoSqlInjection);
  app.use(sanitizeXssPayload);
  app.use(hpp());
}
