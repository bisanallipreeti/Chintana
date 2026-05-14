import { RISK_SIGNALS } from "../types/analysisTypes.js";

const SIGNAL_PATTERNS = [
  { signal: "suicidal_ideation", regex: /\b(kill myself|end my life|suicide|die tonight)\b/i, weight: 5 },
  { signal: "self_harm", regex: /\b(hurt myself|self harm|cut myself)\b/i, weight: 5 },
  { signal: "hopelessness", regex: /\b(no point|pointless|hopeless|nothing will improve)\b/i, weight: 3 },
  { signal: "self_worthlessness", regex: /\b(i am worthless|i am useless|do not deserve|don't deserve)\b/i, weight: 3 },
  { signal: "isolation", regex: /\b(nobody cares|no one cares|alone forever|nobody likes me)\b/i, weight: 2 },
  { signal: "sleep_breakdown", regex: /\b(cannot sleep|can't sleep|no sleep for days)\b/i, weight: 2 },
  { signal: "impulsivity", regex: /\b(i will do anything|no matter what|can't stop myself)\b/i, weight: 2 },
  { signal: "substance_risk", regex: /\b(drink until|use drugs|high all day)\b/i, weight: 2 },
  { signal: "violence_risk", regex: /\b(hurt them|kill them|make them pay)\b/i, weight: 4 },
];

function toRiskLevel(weight) {
  if (weight >= 8) return "critical";
  if (weight >= 5) return "high";
  if (weight >= 3) return "moderate";
  if (weight >= 1) return "low";
  return "none";
}

export function detectSafetySignals(text) {
  const normalized = String(text || "");
  const signals = [];
  const reasons = [];
  let weight = 0;

  for (const rule of SIGNAL_PATTERNS) {
    if (rule.regex.test(normalized)) {
      if (RISK_SIGNALS.includes(rule.signal)) {
        signals.push(rule.signal);
      }
      weight += rule.weight;
      reasons.push(rule.signal);
    }
  }

  const uniqueSignals = [...new Set(signals)];
  const riskLevel = toRiskLevel(weight);

  return {
    riskSignals: uniqueSignals,
    riskLevel,
    crisisDetected: riskLevel === "high" || riskLevel === "critical",
    reasons: [...new Set(reasons)],
    confidence: Math.min(1, 0.35 + weight * 0.08),
  };
}
