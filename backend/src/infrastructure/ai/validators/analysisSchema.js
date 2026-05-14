import Joi from "joi";
import {
  ACTION_ORIENTATIONS,
  CONSTRUCTIVENESS_LEVELS,
  DISTRESS_LEVELS,
  EMOTIONAL_TONES,
  RESILIENCE_LEVELS,
  RISK_SIGNALS,
} from "../types/analysisTypes.js";

export const dimensionalAnalysisSchema = Joi.object({
  emotionalTone: Joi.string().valid(...EMOTIONAL_TONES).required(),
  constructiveness: Joi.string().valid(...CONSTRUCTIVENESS_LEVELS).required(),
  distressLevel: Joi.string().valid(...DISTRESS_LEVELS).required(),
  resilienceLevel: Joi.string().valid(...RESILIENCE_LEVELS).required(),
  actionOrientation: Joi.string().valid(...ACTION_ORIENTATIONS).required(),
  cognitiveDistortion: Joi.string().trim().min(2).max(180).required(),
  emotionalIntensity: Joi.number().min(0).max(100).required(),
  copingIndicators: Joi.array().items(Joi.string().trim().min(2).max(120)).max(12).required(),
  riskSignals: Joi.array().items(Joi.string().valid(...RISK_SIGNALS)).max(10).required(),
  confidence: Joi.number().min(0).max(1).required(),
  summary: Joi.string().trim().min(12).max(600).required(),
  recommendation: Joi.string().trim().min(8).max(600).required(),
}).required();
