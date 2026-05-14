import { Router } from "express";
import { getDatabaseHealth } from "../config/db.js";
import { queueManager } from "../infrastructure/queue/queueManager.js";
import { getAiHealth } from "../infrastructure/ai/thoughtAnalyzer.js";
import { env } from "../config/env.js";
import { isSentryEnabled } from "../config/sentry.js";
import { sendError, sendSuccess } from "../core/http/response.js";

const router = Router();

router.get("/health", (_req, res) => {
  return sendSuccess(res, {
    data: {
      status: "ok",
      service: env.appName,
      timestamp: new Date().toISOString(),
      database: getDatabaseHealth(),
      queue: queueManager.getHealth(),
      ai: getAiHealth(),
      sentryEnabled: isSentryEnabled(),
    },
  });
});

router.get("/ready", (_req, res) => {
  const db = getDatabaseHealth();
  if (db.state !== "connected" && env.mongoUri) {
    return sendError(res, {
      statusCode: 503,
      message: "Service is not ready.",
      data: { database: db },
      code: "NOT_READY",
    });
  }

  return sendSuccess(res, {
    data: {
      status: "ready",
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
