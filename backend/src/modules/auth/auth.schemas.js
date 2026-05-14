import Joi from "joi";

const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/[A-Z]/, "uppercase")
  .pattern(/[a-z]/, "lowercase")
  .pattern(/[0-9]/, "digit")
  .pattern(/[^A-Za-z0-9]/, "special character");

export const registerSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().trim().lowercase().required(),
  password: passwordSchema.required(),
});

export const verifyEmailSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  otp: Joi.string().length(6).required(),
});

export const resendOtpSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().required(),
});

export const checkEmailSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  purpose: Joi.string().valid("login", "register").required(),
});

export const googleLoginSchema = Joi.object({
  credential: Joi.string().trim().required(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().optional(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: passwordSchema.required(),
  confirmPassword: Joi.string().valid(Joi.ref("newPassword")).messages({
    "any.only": "Confirm password must match new password.",
  }),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: passwordSchema.required(),
  confirmPassword: Joi.string().valid(Joi.ref("newPassword")).messages({
    "any.only": "Confirm password must match new password.",
  }),
});

export const logoutSchema = Joi.object({
  refreshToken: Joi.string().optional(),
});
