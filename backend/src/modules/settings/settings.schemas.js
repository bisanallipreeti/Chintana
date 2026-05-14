import Joi from "joi";

export const updateSettingsSchema = Joi.object({
  twoFactorAuth: Joi.boolean(),
  dataEncryption: Joi.boolean(),
  autoDelete: Joi.boolean(),
  notifications: Joi.boolean(),
  reminderEmailEnabled: Joi.boolean(),
  reminderPushEnabled: Joi.boolean(),
  reminderHourUtc: Joi.number().integer().min(0).max(23),
  biometricEnabled: Joi.boolean(),
}).min(1);

export const registerPushTokenSchema = Joi.object({
  token: Joi.string().trim().min(20).max(500).required(),
  platform: Joi.string().valid("ios", "android", "web").required(),
});

export const changePinSchema = Joi.object({
  currentPin: Joi.string().pattern(/^\d{4,8}$/).allow("").optional(),
  newPin: Joi.string().pattern(/^\d{4,8}$/).required(),
});

export const changePhoneSchema = Joi.object({
  phoneCountryIso: Joi.string().trim().uppercase().max(5).required(),
  phoneNumber: Joi.string().trim().pattern(/^\d{4,15}$/).required(),
});
