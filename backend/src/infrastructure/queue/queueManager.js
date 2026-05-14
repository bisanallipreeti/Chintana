import IORedis from "ioredis";
import { Queue, Worker } from "bullmq";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

class QueueManager {
  constructor() {
    this.mode = env.enableBullMq && env.redisUrl ? "bullmq" : "memory";
    this.connection = null;
    this.queues = new Map();
    this.workers = new Map();
    this.handlers = new Map();

    if (this.mode === "bullmq") {
      this.connection = new IORedis(env.redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
      });
      this.connection.on("error", (error) => {
        logger.error("Redis connection error", { error: error.message });
      });
    }
  }

  registerHandler(queueName, handler) {
    if (this.mode === "memory") {
      this.handlers.set(queueName, handler);
      return;
    }

    if (!this.queues.has(queueName)) {
      const queue = new Queue(queueName, { connection: this.connection });
      this.queues.set(queueName, queue);
    }

    if (!this.workers.has(queueName)) {
      const worker = new Worker(
        queueName,
        async (job) => {
          await handler(job.data);
        },
        { connection: this.connection },
      );

      worker.on("failed", (job, error) => {
        logger.error("Queue job failed", {
          queueName,
          jobId: job?.id,
          error: error.message,
        });
      });

      this.workers.set(queueName, worker);
    }
  }

  async add(queueName, payload, options = {}) {
    const delayMs = options.delayMs || 0;

    if (this.mode === "memory") {
      const handler = this.handlers.get(queueName);
      if (!handler) {
        logger.warn("No queue handler registered", { queueName });
        return { id: `memory-${Date.now()}`, mode: this.mode };
      }

      setTimeout(async () => {
        try {
          await handler(payload);
        } catch (error) {
          logger.error("In-memory queue job failed", {
            queueName,
            error: error.message,
          });
        }
      }, delayMs);

      return { id: `memory-${Date.now()}`, mode: this.mode };
    }

    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' is not registered.`);
    }

    const job = await queue.add(queueName, payload, {
      delay: delayMs,
      attempts: options.attempts || 3,
      removeOnComplete: true,
      removeOnFail: 200,
      backoff: {
        type: "exponential",
        delay: 1500,
      },
    });

    return { id: job.id, mode: this.mode };
  }

  getHealth() {
    return {
      mode: this.mode,
      queueCount:
        this.mode === "bullmq" ? this.queues.size : this.handlers.size,
    };
  }

  async shutdown() {
    for (const worker of this.workers.values()) {
      await worker.close();
    }

    for (const queue of this.queues.values()) {
      await queue.close();
    }

    if (this.connection) {
      await this.connection.quit();
    }
  }
}

export const queueManager = new QueueManager();
