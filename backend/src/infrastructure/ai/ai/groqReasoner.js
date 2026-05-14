import { groq } from "../../../config/groq.js";
import { env } from "../../../config/env.js";
import { buildThoughtAnalysisPrompt } from "../prompts/thoughtAnalysisPrompt.js";
import { dimensionalAnalysisSchema } from "../validators/analysisSchema.js";

const GROQ_JSON_FORMAT = { type: "json_object" };

function timeoutPromise(timeoutMs) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error("AI request timed out.");
      error.code = "AI_TIMEOUT";
      reject(error);
    }, timeoutMs);
  });
}

function safeParseJson(content) {
  const normalized = String(content || "").replace(/```json|```/gi, "").trim();
  try {
    return JSON.parse(normalized);
  } catch {
    const match = normalized.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export function getModelCandidates() {
  const candidates = [env.groqModel, ...(env.groqFallbackModels || [])].filter(Boolean);
  return [...new Set(candidates)];
}

function shouldSwitchModel(error) {
  const message = String(error?.message || "");
  return (
    message.includes("status code 429") ||
    message.includes("status code 404") ||
    message.includes("status code 400")
  );
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function requestDimensionalAiAnalysis({ text, category, profileContext }) {
  if (!env.groqApiKey) return null;

  const prompt = buildThoughtAnalysisPrompt({ text, category, profileContext });
  const modelCandidates = getModelCandidates();
  let lastError = null;

  for (const model of modelCandidates) {
    for (let attempt = 0; attempt <= env.aiMaxRetries; attempt += 1) {
      try {
        const response = await Promise.race([
          groq.post("/chat/completions", {
            model,
            messages: [
              {
                role: "system",
                content:
                  "You are a precise psychological JSON API. Return only valid JSON matching the requested schema.",
              },
              { role: "user", content: prompt },
            ],
            response_format: GROQ_JSON_FORMAT,
            temperature: Math.max(0, Math.min(1, env.groqTemperature)),
            max_tokens: Math.max(150, env.groqMaxTokens),
            stream: false,
          }),
          timeoutPromise(env.aiTimeoutMs),
        ]);

        const content = response?.data?.choices?.[0]?.message?.content || "";
        const parsed = safeParseJson(content);
        if (!parsed) throw new Error("AI returned invalid JSON.");

        const { error, value } = dimensionalAnalysisSchema.validate(parsed, {
          abortEarly: false,
          stripUnknown: true,
          convert: true,
        });
        if (error) throw new Error(`AI validation failed: ${error.message}`);

        return { analysis: value, model };
      } catch (error) {
        lastError = error;
        if (shouldSwitchModel(error) || attempt >= env.aiMaxRetries) break;
        const backoffMs = env.aiRetryBaseDelayMs * 2 ** attempt;
        await sleep(backoffMs);
      }
    }
  }

  throw lastError || new Error("AI request failed.");
}
