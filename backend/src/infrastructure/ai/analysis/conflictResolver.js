import { fallbackDimensionalAnalysis } from "../heuristics/fallbackAnalyzer.js";

function levelToValue(level) {
  return {
    none: 0,
    low: 1,
    moderate: 2,
    high: 3,
    critical: 4,
  }[level] ?? 0;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function isLowAffectFactualThought(text) {
  const normalized = String(text || "").toLowerCase();
  const emotionalLexicon =
    /\b(sad|anxious|angry|hopeless|worthless|broken|excited|grateful|afraid|panic|love|hate|lonely|overwhelmed)\b/;
  if (emotionalLexicon.test(normalized)) return false;

  const factualLexicon =
    /\b(attended|sent|completed|finished|had lunch|had dinner|went to|meeting|meetings|emails?|tasks?)\b/;
  return factualLexicon.test(normalized);
}

export function resolveAnalysisConflict({ aiResult, text, safety }) {
  const fallback = fallbackDimensionalAnalysis(text);

  if (!aiResult) {
    return {
      dimensions: {
        ...fallback,
        riskSignals: [...new Set([...ensureArray(fallback.riskSignals), ...ensureArray(safety.riskSignals)])],
      },
      source: "heuristic",
    };
  }

  let merged = {
    ...aiResult,
    riskSignals: [...new Set(ensureArray(aiResult.riskSignals))],
  };

  const aiConfidence = Number(aiResult.confidence ?? 0.5);
  if (aiConfidence < 0.45) {
    merged = {
      ...aiResult,
      emotionalTone: fallback.emotionalTone,
      constructiveness: fallback.constructiveness,
      distressLevel: fallback.distressLevel,
      resilienceLevel: fallback.resilienceLevel,
      actionOrientation: fallback.actionOrientation,
      cognitiveDistortion: fallback.cognitiveDistortion,
      emotionalIntensity: Math.round((Number(aiResult.emotionalIntensity || 50) + fallback.emotionalIntensity) / 2),
      copingIndicators: [...new Set([...ensureArray(aiResult.copingIndicators), ...fallback.copingIndicators])],
      confidence: Math.max(aiConfidence, 0.45),
    };
  }

  if (levelToValue(safety.riskLevel) >= 2) {
    merged.riskSignals = [...new Set([...ensureArray(merged.riskSignals), ...ensureArray(safety.riskSignals)])];
    if (levelToValue(safety.riskLevel) >= 3 && ["minimal", "low", "moderate"].includes(merged.distressLevel)) {
      merged.distressLevel = "high";
    }
    if (levelToValue(safety.riskLevel) >= 4 && merged.distressLevel !== "severe") {
      merged.distressLevel = "severe";
    }
  }

  if (isLowAffectFactualThought(text) && levelToValue(safety.riskLevel) <= 1) {
    merged.emotionalTone = "neutral";
    merged.constructiveness = "mixed";
    merged.distressLevel = "low";
    merged.resilienceLevel = "moderate";
    merged.actionOrientation = "reflective";
    merged.cognitiveDistortion = "none detected";
    merged.emotionalIntensity = Math.min(Number(merged.emotionalIntensity || 50), 35);
  }

  const mergedSignals = new Set(merged.riskSignals || []);
  if (mergedSignals.has("self_worthlessness") || mergedSignals.has("hopelessness")) {
    if (["hopeful", "calm"].includes(merged.emotionalTone)) {
      merged.emotionalTone = "sad";
    }
    if (merged.constructiveness === "constructive" && ["high", "severe"].includes(merged.distressLevel)) {
      merged.constructiveness = "mixed";
    }
  }

  // Keep emotional intensity coherent with distress.
  if (merged.distressLevel === "moderate" && Number(merged.emotionalIntensity) < 40) {
    merged.emotionalIntensity = 45;
  } else if (merged.distressLevel === "high" && Number(merged.emotionalIntensity) < 55) {
    merged.emotionalIntensity = 62;
  } else if (merged.distressLevel === "severe" && Number(merged.emotionalIntensity) < 70) {
    merged.emotionalIntensity = 78;
  }

  return {
    dimensions: merged,
    source: "groq",
  };
}
