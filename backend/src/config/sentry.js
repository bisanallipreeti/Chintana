import * as Sentry from "@sentry/node";
import { env, isProduction } from "./env.js";

let sentryEnabled = false;

export function initSentry() {
  if (!env.sentryDsn) {
    return;
  }

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.nodeEnv,
    tracesSampleRate: env.sentryTracesSampleRate,
    enabled: isProduction,
  });

  sentryEnabled = true;
}

export function isSentryEnabled() {
  return sentryEnabled;
}

export { Sentry };
