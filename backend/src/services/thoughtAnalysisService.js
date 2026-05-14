import { analyzeThought as analyzeThoughtPipeline } from "../infrastructure/ai/thoughtAnalyzer.js";

// Backward-compatible service used by legacy controllers.
export async function analyzeThought(text, category, profile = {}) {
  const result = await analyzeThoughtPipeline({
    userId: "",
    text,
    category,
    profile,
  });

  return result;
}
