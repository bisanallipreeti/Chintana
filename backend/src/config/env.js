import dotenv from "dotenv";

dotenv.config();

const DEFAULT_ACCESS_TOKEN_SECRET = "dev-access-secret";
const DEFAULT_REFRESH_TOKEN_SECRET = "dev-refresh-secret";

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback = false) {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function toList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeOrigins(rawOrigins) {
  if (!rawOrigins) {
    return ["http://localhost:5173", "http://localhost:8081", "exp://127.0.0.1:19000"];
  }

  return rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function normalizeGoogleClientIds(rawClientIds, fallbackClientId) {
  const fromList = String(rawClientIds || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const single = String(fallbackClientId || "").trim();
  if (single && !fromList.includes(single)) {
    fromList.push(single);
  }

  return fromList;
}

function validateEnv(config) {
  const issues = [];

  if (config.enableBullMq && !config.redisUrl) {
    issues.push("ENABLE_BULLMQ is true but REDIS_URL is not set.");
  }

  const hasPartialSmtp =
    Boolean(config.smtpHost) ||
    Boolean(config.smtpUser) ||
    Boolean(config.smtpPass);
  const hasCompleteSmtp =
    Boolean(config.smtpHost) &&
    Boolean(config.smtpUser) &&
    Boolean(config.smtpPass);

  if (hasPartialSmtp && !hasCompleteSmtp) {
    issues.push("SMTP configuration is incomplete. Set SMTP_HOST, SMTP_USER, and SMTP_PASS together.");
  }

  if (config.nodeEnv === "production") {
    if (!config.mongoUri) {
      issues.push("MONGODB_URI is required in production.");
    }

    if (config.accessTokenSecret === DEFAULT_ACCESS_TOKEN_SECRET) {
      issues.push("ACCESS_TOKEN_SECRET must be overridden in production.");
    }

    if (config.refreshTokenSecret === DEFAULT_REFRESH_TOKEN_SECRET) {
      issues.push("REFRESH_TOKEN_SECRET must be overridden in production.");
    }

    if (!config.allowedOrigins.length) {
      issues.push("At least one CORS origin must be configured in production.");
    }

    if (config.forceHttps && !config.trustProxy) {
      issues.push("FORCE_HTTPS=true requires TRUST_PROXY=true when behind a reverse proxy.");
    }
  }

  if (issues.length > 0) {
    throw new Error(`Environment configuration failed:\n- ${issues.join("\n- ")}`);
  }
}

export const env = {
  appName: process.env.APP_NAME || "chintana-backend",
  nodeEnv: process.env.NODE_ENV || "development",
  port: toNumber(process.env.PORT, 5000),
  apiPrefix: process.env.API_PREFIX || "/api/v1",
  trustProxy: toBoolean(process.env.TRUST_PROXY, true),
  forceHttps: toBoolean(process.env.FORCE_HTTPS, false),

  mongoUri: process.env.MONGODB_URI || "",

  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || DEFAULT_ACCESS_TOKEN_SECRET,
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || DEFAULT_REFRESH_TOKEN_SECRET,
  refreshTokenTtlDays: toNumber(process.env.REFRESH_TOKEN_TTL_DAYS, 30),
  otpTtlMinutes: toNumber(process.env.OTP_TTL_MINUTES, 10),
  passwordResetTtlMinutes: toNumber(process.env.PASSWORD_RESET_TTL_MINUTES, 20),
  bcryptSaltRounds: toNumber(process.env.BCRYPT_SALT_ROUNDS, 12),

  allowedOrigins: normalizeOrigins(process.env.CORS_ORIGINS || process.env.CORS_ORIGIN),

  groqApiBaseUrl: process.env.GROQ_API_BASE_URL || "https://api.groq.com/openai/v1",
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
  groqFallbackModels: toList(process.env.GROQ_FALLBACK_MODELS),
  groqMaxTokens: toNumber(process.env.GROQ_MAX_TOKENS, 420),
  groqTemperature: toNumber(process.env.GROQ_TEMPERATURE, 0.2),
  groqTlsRejectUnauthorized: toBoolean(process.env.GROQ_TLS_REJECT_UNAUTHORIZED, true),
  aiTimeoutMs: toNumber(process.env.AI_TIMEOUT_MS, 12000),
  aiMaxRetries: toNumber(process.env.AI_MAX_RETRIES, 2),
  aiRetryBaseDelayMs: toNumber(process.env.AI_RETRY_BASE_DELAY_MS, 600),
  aiCacheTtlSeconds: toNumber(process.env.AI_CACHE_TTL_SECONDS, 900),
  aiCacheMaxEntries: toNumber(process.env.AI_CACHE_MAX_ENTRIES, 5000),
  aiDailyLimitPerUser: toNumber(process.env.AI_DAILY_LIMIT_PER_USER, 120),

  redisUrl: process.env.REDIS_URL || "",
  enableBullMq: toBoolean(process.env.ENABLE_BULLMQ, false),
  dailyReminderSweepIntervalMinutes: toNumber(process.env.DAILY_REMINDER_SWEEP_INTERVAL_MINUTES, 60),
  internalCronKey: process.env.INTERNAL_CRON_KEY || "",

  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: toNumber(process.env.SMTP_PORT, 587),
  smtpSecure: toBoolean(process.env.SMTP_SECURE, false),
  smtpTlsRejectUnauthorized: toBoolean(process.env.SMTP_TLS_REJECT_UNAUTHORIZED, true),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  mailFrom: process.env.MAIL_FROM || "Chintana <no-reply@chintana.app>",

  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "",
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER || "chintana",

  sentryDsn: process.env.SENTRY_DSN || "",
  sentryTracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0),

  clientAppUrl: process.env.CLIENT_APP_URL || "http://localhost:5173",
  passwordResetUrl: process.env.PASSWORD_RESET_URL || "",
  mobileScheme: process.env.MOBILE_SCHEME || "chintana",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientIds: normalizeGoogleClientIds(
    process.env.GOOGLE_CLIENT_IDS,
    process.env.GOOGLE_CLIENT_ID,
  ),

  logLevel: process.env.LOG_LEVEL || "info",
  apiDocsEnabled: toBoolean(process.env.API_DOCS_ENABLED, true),
};

export const isProduction = env.nodeEnv === "production";
export const isDevelopment = env.nodeEnv === "development";

validateEnv(env);
