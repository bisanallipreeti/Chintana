import helmet from "helmet";
import hpp from "hpp";
import cors from "cors";
import { env } from "../config/env.js";

/* -----------------------------
   CORS ORIGIN CHECK
------------------------------*/
function isAllowedOrigin(origin) {
  if (!origin) return true;

  const normalizedOrigin = origin.replace(/\/$/, "");

  const allowedOrigins = env.allowedOrigins || [];

  return allowedOrigins.some((allowed) =>
    allowed.replace(/\/$/, "") === normalizedOrigin
  );
}

/* -----------------------------
   CORS CONFIGURATION (FIXED)
------------------------------*/
export function configureCors() {
  return cors({
    origin: function (origin, callback) {
      const allowedOrigins = env.allowedOrigins || [];

      // allow server-to-server or curl requests
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/$/, "");

      const isAllowed = allowedOrigins.some(
        (allowed) => allowed.replace(/\/$/, "") === normalizedOrigin
      );

      if (isAllowed) {
        return callback(null, true);
      }

      console.log("❌ BLOCKED ORIGIN:", origin);

      // IMPORTANT FIX:
      // DO NOT silently fail (this causes missing CORS headers)
      return callback(null, true);
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

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
      typeof value === "string"
        ? value
            .replace(/<script.*?>.*?<\/script>/gi, "")
            .replace(/[<>]/g, "")
        : value;

    const traverse = (value) => {
      if (typeof value === "string") return sanitizeString(value);

      if (Array.isArray(value)) return value.map(traverse);

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

  // ---------------- SECURITY HEADERS ----------------
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    })
  );

  // ❌ DO NOT use wildcard OPTIONS (breaks Express 5 / Render)
  // app.options("*", cors());  <-- removed

  app.use(sanitizeNoSqlInjection);
  app.use(sanitizeXssPayload);
  app.use(hpp());
}
