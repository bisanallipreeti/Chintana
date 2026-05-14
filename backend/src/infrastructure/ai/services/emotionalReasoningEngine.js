import { requestDimensionalAiAnalysis } from "../ai/groqReasoner.js";
import { resolveAnalysisConflict } from "../analysis/conflictResolver.js";
import { detectSafetySignals } from "../heuristics/safetySignals.js";
import { projectLegacyAnalysis } from "../scoring/legacyProjection.js";

function getProfileContext(profile = {}) {
  const monthlyIncome = Number(profile.monthlyIncome || 0) || 0;
  const additionalAnnualIncome = Number(profile.additionalAnnualIncome || 0) || 0;

  return {
    occupation: profile.occupation || "",
    designation: profile.designation || "",
    education: profile.education || "",
    monthlyIncome,
    additionalAnnualIncome,
    countryIso: profile.countryIso || "",
    emergencyContactsCount: Array.isArray(profile.emergencyContacts)
      ? profile.emergencyContacts.filter((c) => c?.name || c?.phoneNumber).length
      : 0,
  };
}

export async function analyzeThoughtEmotionally({ text, category, profile }) {
  const safety = detectSafetySignals(text);
  const profileContext = getProfileContext(profile);

  let aiResult = null;
  let model = "";

  try {
    const response = await requestDimensionalAiAnalysis({
      text,
      category,
      profileContext,
    });
    if (response) {
      aiResult = response.analysis;
      model = response.model || "";
    }
  } catch {
    aiResult = null;
    model = "";
  }

  const resolved = resolveAnalysisConflict({
    aiResult,
    text,
    safety,
  });

  const legacy = projectLegacyAnalysis(resolved.dimensions);

  return {
    ...legacy,
    emotionalInsights: {
      ...resolved.dimensions,
      safety: {
        riskLevel: safety.riskLevel,
        crisisDetected: safety.crisisDetected,
        reasons: safety.reasons,
        confidence: safety.confidence,
      },
    },
    aiMeta: {
      source: resolved.source,
      model,
      cacheHit: false,
      confidence: Number(resolved.dimensions.confidence ?? 0.5),
      pipeline: "ai_first_psychological_v1",
    },
  };
}
