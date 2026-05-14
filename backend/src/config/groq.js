import axios from "axios";
import https from "https";
import { env } from "./env.js";

export const groq = axios.create({
  baseURL: env.groqApiBaseUrl,
  timeout: env.aiTimeoutMs,
  httpsAgent: new https.Agent({
    rejectUnauthorized: env.groqTlsRejectUnauthorized,
  }),
  headers: env.groqApiKey
    ? {
        Authorization: `Bearer ${env.groqApiKey}`,
        "Content-Type": "application/json",
      }
    : undefined,
});
