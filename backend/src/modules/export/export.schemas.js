import Joi from "joi";

export const exportQuerySchema = Joi.object({
  search: Joi.string().trim().max(120).allow(""),
  category: Joi.string().trim().max(50).allow(""),
  type: Joi.string().valid("", "Constructive", "Destructive", "Neutral").default(""),
  sort: Joi.string().valid("date", "score").default("date"),
  order: Joi.string().valid("asc", "desc").default("desc"),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
  minScore: Joi.number().min(0).max(100),
  maxScore: Joi.number().min(0).max(100),
});
