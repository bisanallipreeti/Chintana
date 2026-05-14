import mongoose from "mongoose";
import { ENERGY_IMPACTS, STRESS_LEVELS, THOUGHT_TYPES } from "../constants/thoughts.js";

const attachmentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["image", "video"], required: true },
    name: { type: String, trim: true, required: true, maxlength: 200 },
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
    size: { type: Number, default: 0 },
    mimeType: { type: String, default: "" },
  },
  { _id: true },
);

const thoughtSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    text: { type: String, required: true, trim: true, minlength: 1, maxlength: 5000 },
    category: { type: String, required: true, trim: true, index: true },

    type: { type: String, enum: THOUGHT_TYPES, required: true, index: true },
    score: { type: Number, required: true, min: 0, max: 100, index: true },
    classification: { type: String, required: true, maxlength: 120 },
    energyImpact: { type: String, enum: ENERGY_IMPACTS, required: true },
    stressLevel: { type: String, enum: STRESS_LEVELS, default: "low" },

    profileSignals: {
      occupation: { type: String, default: "" },
      education: { type: String, default: "" },
      emergencyContactsCount: { type: Number, default: 0 },
      countryIso: { type: String, default: "" },
    },

    suggestion: { type: String, required: true, maxlength: 600 },
    allowSharing: { type: Boolean, default: false },
    confidential: { type: Boolean, default: true },
    attachments: { type: [attachmentSchema], default: [] },

    revisitAt: { type: Date, default: null },
    reminderStatus: {
      type: String,
      enum: ["pending", "sent", "disabled"],
      default: "disabled",
      index: true,
    },
    reminderSentAt: { type: Date, default: null },

    aiMeta: {
      source: { type: String, enum: ["openai", "groq", "heuristic"], default: "heuristic" },
      cacheHit: { type: Boolean, default: false },
      model: { type: String, default: "" },
      confidence: { type: Number, default: 0.5 },
      pipeline: { type: String, default: "legacy" },
    },

    emotionalInsights: {
      emotionalTone: { type: String, default: "neutral" },
      constructiveness: { type: String, default: "mixed" },
      distressLevel: { type: String, default: "low" },
      resilienceLevel: { type: String, default: "moderate" },
      actionOrientation: { type: String, default: "unclear" },
      cognitiveDistortion: { type: String, default: "none detected" },
      emotionalIntensity: { type: Number, default: 50 },
      copingIndicators: { type: [String], default: [] },
      riskSignals: { type: [String], default: [] },
      confidence: { type: Number, default: 0.5 },
      summary: { type: String, default: "" },
      recommendation: { type: String, default: "" },
      safety: {
        riskLevel: { type: String, default: "none" },
        crisisDetected: { type: Boolean, default: false },
        reasons: { type: [String], default: [] },
        confidence: { type: Number, default: 0 },
      },
    },
  },
  { timestamps: true, strict: "throw" },
);

thoughtSchema.index({ user: 1, createdAt: -1 });
thoughtSchema.index({ user: 1, category: 1, createdAt: -1 });
thoughtSchema.index({ user: 1, type: 1, createdAt: -1 });
thoughtSchema.index({ user: 1, score: -1 });
thoughtSchema.index({ user: 1, revisitAt: 1, reminderStatus: 1 });
thoughtSchema.index({ text: "text" });

export const Thought = mongoose.model("Thought", thoughtSchema);
