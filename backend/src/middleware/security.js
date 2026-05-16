import helmet from "helmet";
import hpp from "hpp";
import cors from "cors";
import { env } from "../config/env.js";

/* -----------------------------
   NORMALIZE ORIGIN
------------------------------*/
function normalize(origin = "") {
  return origin.replace(/\/$/, "");
}

function matchesAllowedOrigin(requestOrigin, allowedOrigin) {
  if (allowedOrigin.includes("*")) {
    const pattern = allowedOrigin
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*");

    return new RegExp(`^${pattern}$`).test(requestOrigin);
  }

  return allowedOrigin === requestOrigin;
}

/* -----------------------------
   CORS CONFIGURATION
------------------------------*/
export function configureCors() {
  const allowedOrigins = (env.allowedOrigins || []).map(normalize);

  return cors({
    origin(origin, callback) {
      // allow Postman / mobile apps
      if (!origin) {
        return callback(null, true);
      }

      const requestOrigin = normalize(origin);

      if (
        allowedOrigins.some((allowedOrigin) =>
          matchesAllowedOrigin(
            requestOrigin,
            allowedOrigin
          )
        )
      ) {
        return callback(null, true);
      }

      console.error("❌ BLOCKED CORS:", origin);

      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-request-id",
    ],

    optionsSuccessStatus: 200,
  });
}

/* -----------------------------
   SECURITY MIDDLEWARES
------------------------------*/
export function configureSecurityMiddlewares(app) {
  /* -----------------------------
     NoSQL Injection Protection
  ------------------------------*/
  const sanitizeNoSqlInjection = (
    req,
    _res,
    next
  ) => {
    const sanitize = (obj) => {
      if (!obj || typeof obj !== "object") {
        return;
      }

      Object.keys(obj).forEach((key) => {
        if (
          key.startsWith("$") ||
          key.includes(".")
        ) {
          delete obj[key];
          return;
        }

        sanitize(obj[key]);
      });
    };

    sanitize(req.body);

    // DO NOT modify req.query directly
    if (req.query && typeof req.query === "object") {
      sanitize(req.query);
    }

    sanitize(req.params);

    next();
  };

  /* -----------------------------
     XSS Protection
  ------------------------------*/
  const sanitizeXssPayload = (
    req,
    _res,
    next
  ) => {
    const clean = (value) => {
      if (typeof value === "string") {
        return value
          .replace(
            /<script.*?>.*?<\/script>/gi,
            ""
          )
          .replace(/[<>]/g, "");
      }

      if (Array.isArray(value)) {
        return value.map(clean);
      }

      if (
        value &&
        typeof value === "object"
      ) {
        Object.keys(value).forEach((key) => {
          value[key] = clean(value[key]);
        });
      }

      return value;
    };

    // SAFE: modify body only
    if (req.body) {
      req.body = clean(req.body);
    }

    // SAFE: modify params only
    if (req.params) {
      req.params = clean(req.params);
    }

    // IMPORTANT:
    // DO NOT reassign req.query
    if (req.query && typeof req.query === "object") {
      Object.keys(req.query).forEach((key) => {
        req.query[key] = clean(req.query[key]);
      });
    }

    next();
  };

  /* -----------------------------
     HELMET
  ------------------------------*/
  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: "cross-origin",
      },

      contentSecurityPolicy: false,
    })
  );

  app.use(sanitizeNoSqlInjection);
  app.use(sanitizeXssPayload);

  app.use(hpp());
}
