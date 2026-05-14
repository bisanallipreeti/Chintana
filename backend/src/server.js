import http from "http";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { initSentry } from "./config/sentry.js";
import { registerJobHandlers } from "./jobs/registerJobHandlers.js";
import { queueManager } from "./infrastructure/queue/queueManager.js";
import { reminderService } from "./modules/reminders/reminder.service.js";

initSentry();
registerJobHandlers();

const app = createApp();
const server = http.createServer(app);
let reminderSweepTimer = null;

function startDailyReminderSweep() {
  if (env.dailyReminderSweepIntervalMinutes <= 0) {
    return;
  }

  const intervalMs = env.dailyReminderSweepIntervalMinutes * 60_000;

  reminderSweepTimer = setInterval(() => {
    void reminderService
      .runDailyReminderSweep()
      .then((result) => {
        if (result.queuedUsers > 0) {
          logger.info("Daily reminder sweep queued emails", result);
        }
      })
      .catch((error) => {
        logger.error("Daily reminder sweep failed", { error: error.message });
      });
  }, intervalMs);

  reminderSweepTimer.unref();
}

async function startServer() {
  try {
    await connectDatabase();
    startDailyReminderSweep();
  } catch (error) {
    logger.error("Database connection failed", { error: error.message });
  }

  server.listen(env.port, () => {
    logger.info(`Backend listening on port ${env.port}`);
  });
}

async function shutdown(signal) {
  logger.warn(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    try {
      if (reminderSweepTimer) {
        clearInterval(reminderSweepTimer);
      }
      await queueManager.shutdown();
      await disconnectDatabase();
      logger.info("Graceful shutdown complete.");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown", { error: error.message });
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error("Forcing shutdown after timeout.");
    process.exit(1);
  }, 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

void startServer();
