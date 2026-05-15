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

/* -----------------------------
   CORS CONFIGURATION (SAFE)
------------------------------*/
export function configureCors() {
  const allowedOrigins = (env.allowedOrigins || []).map(normalize);

  return cors({
    origin: function (origin, callback) {
      // allow mobile apps / postman / server-to-server
      if (!origin) return callback(null, true);

      const requestOrigin = normalize(origin);

      if (allowedOrigins.includes(requestOrigin)) {
        return callback(null, true);
      }

      console.error("❌ CORS BLOCKED ORIGIN:", origin);

      // IMPORTANT: reject properly
      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-request-id",
    ],

    optionsSuccessStatus: 204,
  });
}

/* -----------------------------
   SECURITY MIDDLEWARES
------------------------------*/
export function configureSecurityMiddlewares(app) {
  // Prevent NoSQL injection
  const sanitizeNoSqlInjection = (req, _res, next) => {
    const sanitize = (obj) => {
      if (!obj || typeof obj !== "object") return;

      for (const key of Object.keys(obj)) {
        if (key.startsWith("$") || key.includes(".")) {
          delete obj[key];
        } else {
          sanitize(obj[key]);
        }
      }
    };

    sanitize(req.body);
    sanitize(req.query);
    sanitize(req.params);

    next();
  };

  // XSS protection
  const sanitizeXssPayload = (req, _res, next) => {
    const clean = (val) => {
      if (typeof val === "string") {
        return val
          .replace(/<script.*?>.*?<\/script>/gi, "")
          .replace(/[<>]/g, "");
      }

      if (Array.isArray(val)) return val.map(clean);

      if (val && typeof val === "object") {
        for (const k in val) {
          val[k] = clean(val[k]);
        }
      }

      return val;
    };

    req.body = clean(req.body);
    req.query = clean(req.query);
    req.params = clean(req.params);

    next();
  };

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false,
    })
  );

  app.use(sanitizeNoSqlInjection);
  app.use(sanitizeXssPayload);
  app.use(hpp());
}
