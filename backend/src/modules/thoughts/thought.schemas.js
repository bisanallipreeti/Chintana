import Joi from "joi";
import { THOUGHT_CATEGORIES } from "../../constants/thoughts.js";

const attachmentSchema = Joi.object({
  type: Joi.string().valid("image", "video").required(),
  name: Joi.string().trim().max(200).required(),
  url: Joi.string().uri({ allowRelative: true }).required(),
  publicId: Joi.string().allow(""),
  size: Joi.number().min(0),
  mimeType: Joi.string().allow(""),
});

const thoughtTextSchema = Joi.string().trim().min(1).max(5000);

export const listThoughtsQuerySchema = Joi.object({
  search: Joi.string().trim().max(120).allow(""),
  category: Joi.string().valid(...THOUGHT_CATEGORIES),
  type: Joi.string().valid("Constructive", "Destructive", "Neutral"),
  sort: Joi.string().valid("date", "score").default("date"),
  order: Joi.string().valid("asc", "desc").default("desc"),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  minScore: Joi.number().min(0).max(100),
  maxScore: Joi.number().min(0).max(100),
});

export const analyzeThoughtSchema = Joi.object({
  text: thoughtTextSchema.required(),
  category: Joi.string().valid(...THOUGHT_CATEGORIES).required(),
});

export const createThoughtSchema = Joi.object({
  text: thoughtTextSchema.required(),
  category: Joi.string().valid(...THOUGHT_CATEGORIES).required(),
  allowSharing: Joi.boolean().default(false),
  confidential: Joi.boolean().default(true),
  attachments: Joi.array().items(attachmentSchema).max(10).default([]),
  revisitAt: Joi.date().greater("now").allow(null).optional(),
});

export const updateThoughtSchema = Joi.object({
  text: thoughtTextSchema,
  category: Joi.string().valid(...THOUGHT_CATEGORIES),
  allowSharing: Joi.boolean(),
  confidential: Joi.boolean(),
  attachments: Joi.array().items(attachmentSchema).max(10),
  revisitAt: Joi.date().allow(null),
}).min(1);

export const thoughtIdParamsSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});
