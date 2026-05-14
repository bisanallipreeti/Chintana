import cookieParser from "cookie-parser";
import express from "express";
import morgan from "morgan";
import path from "path";
import { env, isDevelopment } from "./config/env.js";
import { logger } from "./config/logger.js";
import { sendSuccess } from "./core/http/response.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { globalLimiter } from "./middleware/rateLimit.js";
import { requestContext } from "./middleware/requestContext.js";
import { configureCors, configureSecurityMiddlewares } from "./middleware/security.js";
import v1Router from "./routes/v1.js";
import healthRoutes from "./routes/health.js";
import docsRoutes from "./routes/docs.js";

function httpsGuard(req, res, next) {
  if (!env.forceHttps || isDevelopment) {
    return next();
  }

  const proto = req.headers["x-forwarded-proto"];
  if (req.secure || proto === "https") {
    return next();
  }

  return res.status(426).json({
    success: false,
    message: "HTTPS is required.",
  });
}

export function createApp() {
  const app = express();

  if (env.trustProxy) {
    app.set("trust proxy", 1);
  }

  app.use(requestContext);
  app.use(configureCors());
  app.use(httpsGuard);
  configureSecurityMiddlewares(app);

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use(cookieParser());
  app.use(globalLimiter);

  app.use(
    morgan("combined", {
      skip: (req) => req.path === "/health",
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    }),
  );

  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

  app.get("/", (_req, res) => {
    return sendSuccess(res, {
      message: "Chintana backend is running.",
      data: {
        versionedApi: env.apiPrefix,
      },
    });
  });

  app.use(healthRoutes);
  app.use(docsRoutes);

  app.use(env.apiPrefix, v1Router);
  // Backward-compatible alias for legacy clients.
  app.use("/api", v1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
