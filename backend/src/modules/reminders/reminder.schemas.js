import Joi from "joi";

export const setRevisitSchema = Joi.object({
  revisitAt: Joi.date().greater("now").required(),
});

export const thoughtIdParamsSchema = Joi.object({
  thoughtId: Joi.string().hex().length(24).required(),
});
