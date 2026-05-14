import Joi from "joi";

export const uploadBodySchema = Joi.object({
  expectedType: Joi.string().valid("image", "video").required(),
});
