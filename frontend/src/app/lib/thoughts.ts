export type ThoughtType = "Constructive" | "Destructive" | "Neutral";
export type EnergyImpact = "energizing" | "neutral" | "draining";

export interface ThoughtAnalysisResult {
  type: ThoughtType;
  score: number;
  classification: string;
  energyImpact: EnergyImpact;
  suggestion: string;
}

const POSITIVE_KEYWORDS = [
  "plan",
  "improve",
  "goal",
  "learn",
  "create",
  "build",
  "calm",
  "better",
  "solution",
  "idea",
  "growth",
  "focus",
  "happy",
  "healthy",
  "progress",
];

const NEGATIVE_KEYWORDS = [
  "worry",
  "worried",
  "panic",
  "stress",
  "stuck",
  "anxious",
  "fear",
  "hate",
  "angry",
  "overthink",
  "overthinking",
  "tired",
  "drained",
  "sad",
  "late",
  "problem",
];

export function normalizeThoughtText(input: string) {
  const collapsed = input.replace(/\s+/g, " ").replace(/\s([,.!?;:])/g, "$1");

  return collapsed.replace(/(^|[.!?]\s+)([a-z])/g, (match, prefix, letter) => {
    return `${prefix}${letter.toUpperCase()}`;
  });
}

export function analyzeThought(text: string, category: string): ThoughtAnalysisResult {
  const normalized = text.trim().toLowerCase();

  let positiveHits = 0;
  let negativeHits = 0;

  for (const keyword of POSITIVE_KEYWORDS) {
    if (normalized.includes(keyword)) positiveHits += 1;
  }

  for (const keyword of NEGATIVE_KEYWORDS) {
    if (normalized.includes(keyword)) negativeHits += 1;
  }

  const lengthBonus = Math.min(15, Math.floor(normalized.length / 18));
  let score = 55 + positiveHits * 8 - negativeHits * 9 + lengthBonus;
  score = Math.max(8, Math.min(98, score));

  if (positiveHits > negativeHits) {
    return {
      type: "Constructive",
      score,
      classification:
        category === "Career" || category === "Business"
          ? "Strategic Thought"
          : "Constructive Reflection",
      energyImpact: "energizing",
      suggestion:
        "This thought shows forward momentum. Capture the next action while it is still fresh.",
    };
  }

  if (negativeHits > positiveHits) {
    return {
      type: "Destructive",
      score,
      classification: "Stress Pattern",
      energyImpact: "draining",
      suggestion:
        "This thought may be pulling your energy down. Try reframing it into one clear concern and one possible response.",
    };
  }

  return {
    type: "Neutral",
    score,
    classification: "Balanced Observation",
    energyImpact: "neutral",
    suggestion:
      "This thought looks balanced. Add context or a next step if you want deeper insight from it.",
  };
}

export function formatThoughtTimestamp(dateString: string) {
  const createdAt = new Date(dateString).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - createdAt);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "Just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} min ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} hr ago`;
  if (diffMs < day * 7) return `${Math.floor(diffMs / day)} day${diffMs >= day * 2 ? "s" : ""} ago`;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}
