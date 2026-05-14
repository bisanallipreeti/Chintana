function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function mapStressLevel(distressLevel) {
  if (distressLevel === "severe") return "high";
  if (distressLevel === "high") return "high";
  if (distressLevel === "moderate") return "moderate";
  if (distressLevel === "low") return "low";
  return "minimal";
}

function deriveClassification(dim) {
  if (dim.constructiveness === "constructive" && ["high", "severe"].includes(dim.distressLevel)) {
    return "Pain With Growth Intent";
  }
  if (dim.constructiveness === "constructive") return "Constructive Reflection";
  if (dim.constructiveness === "unconstructive") {
    return ["high", "severe", "moderate"].includes(dim.distressLevel)
      ? "Stress Pattern"
      : "Unhelpful Thought Loop";
  }
  if (dim.constructiveness === "mixed") return "Mixed Emotional Processing";
  return "Balanced Observation";
}

function deriveSuggestion(dim) {
  if (dim.riskSignals?.includes("suicidal_ideation") || dim.riskSignals?.includes("self_harm")) {
    return "You may need immediate support. Please contact trusted people or emergency help right now.";
  }
  if (["high", "severe"].includes(dim.distressLevel)) {
    return "Start with one grounding step: name one feeling, breathe slowly, and choose one safe next action.";
  }
  if (dim.constructiveness === "constructive") {
    return "Capture one concrete next step while this reflective momentum is available.";
  }
  if (dim.actionOrientation === "avoidant") {
    return "Break the thought into one concern and one action you can complete in the next 10 minutes.";
  }
  return "Add context: what triggered this and what small action could help you today?";
}

export function projectLegacyAnalysis(dimensions) {
  const constructivenessScore = {
    constructive: 18,
    mixed: 0,
    unconstructive: -15,
  }[dimensions.constructiveness] ?? 0;

  const distressPenalty = {
    minimal: 0,
    low: 6,
    moderate: 14,
    high: 24,
    severe: 34,
  }[dimensions.distressLevel] ?? 12;

  const resilienceScore = {
    high: 14,
    moderate: 4,
    low: -8,
  }[dimensions.resilienceLevel] ?? 0;

  const actionScore = {
    proactive: 8,
    reflective: 4,
    avoidant: -8,
    compulsive: -6,
    unclear: 0,
  }[dimensions.actionOrientation] ?? 0;

  const toneScore = {
    hopeful: 4,
    calm: 3,
    neutral: 0,
    mixed: -2,
    sad: -4,
    anxious: -6,
    frustrated: -5,
    angry: -6,
    ashamed: -7,
    overwhelmed: -8,
  }[dimensions.emotionalTone] ?? 0;

  let score = 50 + constructivenessScore + resilienceScore + actionScore + toneScore - distressPenalty;
  if (dimensions.riskSignals?.length) {
    score -= Math.min(20, dimensions.riskSignals.length * 3);
  }

  const signals = new Set(dimensions.riskSignals || []);
  if (["high", "severe"].includes(dimensions.distressLevel)) {
    score = Math.min(score, 55);
  }
  if (signals.has("hopelessness") || signals.has("self_worthlessness")) {
    score = Math.min(score, 45);
  }
  if (signals.has("self_harm") || signals.has("suicidal_ideation")) {
    score = Math.min(score, 25);
  }

  score = clamp(Math.round(score), 0, 100);

  const type = score >= 60 ? "Constructive" : score <= 45 ? "Destructive" : "Neutral";
  const energyImpact = type === "Constructive" ? "energizing" : type === "Destructive" ? "draining" : "neutral";
  let classification = deriveClassification(dimensions);

  if (type === "Destructive" && ["Pain With Growth Intent", "Constructive Reflection"].includes(classification)) {
    classification = "Stress Pattern";
  }
  if (type === "Constructive" && classification === "Stress Pattern") {
    classification = "Constructive Reflection";
  }

  return {
    type,
    score,
    classification,
    energyImpact,
    stressLevel: mapStressLevel(dimensions.distressLevel),
    suggestion: deriveSuggestion(dimensions),
  };
}
