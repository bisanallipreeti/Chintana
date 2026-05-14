import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { hashValue } from "../../core/utils/crypto.js";
import { analyzeThoughtEmotionally } from "./services/emotionalReasoningEngine.js";
import { fallbackDimensionalAnalysis } from "./heuristics/fallbackAnalyzer.js";
import { projectLegacyAnalysis } from "./scoring/legacyProjection.js";
import { detectSafetySignals } from "./heuristics/safetySignals.js";

const AI_ANALYSIS_VERSION = "emotional-reasoning-v1";
const aiCache = new Map();
const dailyUsage = new Map();
const DAY_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function cleanupDailyUsage() {
  const todayKey = new Date().toISOString().slice(0, 10);
  for (const key of dailyUsage.keys()) {
    const dayKey = key.split(":").slice(-1)[0] || "";
    if (!DAY_KEY_REGEX.test(dayKey) || dayKey < todayKey) {
      dailyUsage.delete(key);
    }
  }
}

function enforceUsageLimit(userId) {
  if (!userId) return;
  cleanupDailyUsage();

  const dayKey = new Date().toISOString().slice(0, 10);
  const compositeKey = `${userId}:${dayKey}`;
  const count = dailyUsage.get(compositeKey) || 0;

  if (count >= env.aiDailyLimitPerUser) {
    const error = new Error("Daily AI quota exceeded for this account.");
    error.statusCode = 429;
    throw error;
  }
  dailyUsage.set(compositeKey, count + 1);
}

function getCached(cacheKey) {
  const entry = aiCache.get(cacheKey);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    aiCache.delete(cacheKey);
    return null;
  }
  return entry.value;
}

function setCached(cacheKey, value) {
  if (aiCache.size >= env.aiCacheMaxEntries) {
    const firstKey = aiCache.keys().next().value;
    if (firstKey) aiCache.delete(firstKey);
  }
  aiCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + env.aiCacheTtlSeconds * 1000,
  });
}

export async function analyzeThought({ userId, text, category, profile = {} }) {
  const cacheKey = hashValue(
    JSON.stringify({ version: AI_ANALYSIS_VERSION, userId, text, category, profile }),
  );
  const cached = getCached(cacheKey);
  if (cached) {
    return {
      ...cached,
      aiMeta: {
        ...cached.aiMeta,
        cacheHit: true,
      },
    };
  }

  enforceUsageLimit(userId);

  let result;
  try {
    result = await analyzeThoughtEmotionally({ text, category, profile });
  } catch (error) {
    logger.warn("AI analysis fallback triggered", { reason: error.message });
    const fallbackDimensions = fallbackDimensionalAnalysis(text);
    const safety = detectSafetySignals(text);
    const dimensions = {
      ...fallbackDimensions,
      riskSignals: [...new Set([...(fallbackDimensions.riskSignals || []), ...(safety.riskSignals || [])])],
      safety: {
        riskLevel: safety.riskLevel,
        crisisDetected: safety.crisisDetected,
        reasons: safety.reasons,
        confidence: safety.confidence,
      },
    };
    result = {
      ...projectLegacyAnalysis(dimensions),
      emotionalInsights: dimensions,
      aiMeta: {
        source: "heuristic",
        model: "",
        cacheHit: false,
        confidence: Number(fallbackDimensions.confidence ?? 0.4),
        pipeline: "ai_first_psychological_v1",
      },
    };
  }

  setCached(cacheKey, result);
  return result;
}

export function getAiHealth() {
  return {
    providerEnabled: Boolean(env.groqApiKey),
    cacheSize: aiCache.size,
    pipeline: "ai_first_psychological_v1",
  };
}
