import winston from "winston";
import { env, isDevelopment } from "./env.js";

const formats = [
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  isDevelopment
    ? winston.format.combine(winston.format.colorize(), winston.format.simple())
    : winston.format.json(),
];

export const logger = winston.createLogger({
  level: env.logLevel,
  format: winston.format.combine(...formats),
  transports: [new winston.transports.Console()],
  defaultMeta: {
    service: env.appName,
    environment: env.nodeEnv,
  },
});
