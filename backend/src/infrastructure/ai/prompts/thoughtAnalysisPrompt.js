function compactProfile(profileContext = {}) {
  return Object.fromEntries(
    Object.entries(profileContext).filter(([, value]) => {
      if (value === null || value === undefined) return false;
      if (typeof value === "string") return value.trim().length > 0;
      if (typeof value === "number") return value > 0;
      return Boolean(value);
    }),
  );
}

export function buildThoughtAnalysisPrompt({ text, category, profileContext }) {
  const trimmedThought = String(text || "").slice(0, 2000);
  const profile = compactProfile(profileContext);

  return [
    "You are a psychologically-aware emotional reasoning engine.",
    "Return ONLY strict JSON.",
    "Evaluate dimensions independently. Do not collapse emotion + motivation into one score.",
    "Distinguish emotional pain from constructiveness.",
    "Distinguish motivation from healthy coping.",
    "Treat factual thoughts without strong affect as neutral.",
    "Use these output keys exactly:",
    "emotionalTone, constructiveness, distressLevel, resilienceLevel, actionOrientation, cognitiveDistortion, emotionalIntensity, copingIndicators, riskSignals, confidence, summary, recommendation",
    "Enum guidance:",
    "emotionalTone: sad|anxious|angry|hopeful|calm|mixed|neutral|ashamed|frustrated|overwhelmed",
    "constructiveness: constructive|mixed|unconstructive",
    "distressLevel: minimal|low|moderate|high|severe",
    "resilienceLevel: low|moderate|high",
    "actionOrientation: avoidant|reflective|proactive|compulsive|unclear",
    "riskSignals array values:",
    "self_harm|suicidal_ideation|hopelessness|self_worthlessness|impulsivity|isolation|sleep_breakdown|substance_risk|violence_risk",
    "Confidence must be 0..1.",
    "Do not add markdown.",
    `Thought: ${trimmedThought}`,
    `Category: ${category}`,
    `Profile: ${JSON.stringify(profile)}`,
  ].join("\n");
}
