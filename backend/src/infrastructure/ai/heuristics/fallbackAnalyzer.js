import Sentiment from "sentiment";

const sentimentAnalyzer = new Sentiment();

function inferConstructiveness(score) {
  if (score >= 60) return "constructive";
  if (score <= 45) return "unconstructive";
  return "mixed";
}

function inferDistress(score) {
  if (score <= 20) return "severe";
  if (score <= 35) return "high";
  if (score <= 50) return "moderate";
  if (score <= 65) return "low";
  return "minimal";
}

export function fallbackDimensionalAnalysis(text) {
  const thought = String(text || "");
  const sentiment = sentimentAnalyzer.analyze(thought);

  let score = Math.max(0, Math.min(100, Math.round(50 + sentiment.score * 11)));
  if (/\b(improve|learn|try again|next step|plan)\b/i.test(thought)) score += 8;
  if (/\b(hopeless|worthless|nobody likes me|don't deserve|do not deserve)\b/i.test(thought)) score -= 15;
  score = Math.max(0, Math.min(100, score));

  const constructiveness = inferConstructiveness(score);
  const distressLevel = inferDistress(score);
  const emotionalTone =
    distressLevel === "high" || distressLevel === "severe"
      ? "sad"
      : score >= 62
        ? "hopeful"
        : "neutral";

  return {
    emotionalTone,
    constructiveness,
    distressLevel,
    resilienceLevel: constructiveness === "constructive" ? "high" : "moderate",
    actionOrientation: /\b(plan|next step|do|try)\b/i.test(thought) ? "proactive" : "reflective",
    cognitiveDistortion: distressLevel === "high" || distressLevel === "severe" ? "self-criticism" : "none detected",
    emotionalIntensity: Math.max(15, Math.min(95, Math.round(100 - score + (constructiveness === "constructive" ? -10 : 0)))),
    copingIndicators: /\b(improve|learn|plan|support|help)\b/i.test(thought)
      ? ["growth_intent"]
      : ["reflection"],
    riskSignals: [],
    confidence: 0.42,
    summary:
      constructiveness === "constructive"
        ? "The thought shows growth intent with manageable emotional load."
        : "The thought may carry emotional strain and needs gentle reframing.",
    recommendation:
      constructiveness === "constructive"
        ? "Keep momentum by writing one concrete next action."
        : "Name one feeling and one immediate supportive action.",
  };
}
