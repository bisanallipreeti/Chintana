import Joi from "joi";
import { ApiError } from "../utils/ApiError.js";

/**
 * Returns an Express middleware that validates `req.body` against a Joi schema.
 * On failure it throws an ApiError(400) with a user-friendly message.
 */
export function validate(schema) {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join(". ");
      throw new ApiError(400, message);
    }

    req.body = value;
    next();
  };
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const registerSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(8).max(128).required(),
  twoFactorAuth: Joi.boolean().default(false),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
});

// ── Thoughts ─────────────────────────────────────────────────────────────────

const thoughtCategories = [
  "Business", "IT", "Personal", "Emotional", "Strategic", "Creative",
  "Health", "Financial", "Relationship", "Career", "Education",
  "Family", "Travel", "Spiritual", "Others",
];

const attachmentSchema = Joi.object({
  type: Joi.string().valid("image", "video").required(),
  name: Joi.string().required(),
  url: Joi.string().uri({ allowRelative: true }).required(),
});

export const createThoughtSchema = Joi.object({
  text: Joi.string().trim().min(1).max(5000).required(),
  category: Joi.string().valid(...thoughtCategories).required(),
  allowSharing: Joi.boolean().default(false),
  confidential: Joi.boolean().default(true),
  attachments: Joi.array().items(attachmentSchema).max(10).default([]),
});

export const updateThoughtSchema = Joi.object({
  text: Joi.string().trim().min(1).max(5000),
  category: Joi.string().valid(...thoughtCategories),
  allowSharing: Joi.boolean(),
  confidential: Joi.boolean(),
  attachments: Joi.array().items(attachmentSchema).max(10),
}).min(1);

export const analyzeThoughtSchema = Joi.object({
  text: Joi.string().trim().min(1).max(5000).required(),
  category: Joi.string().valid(...thoughtCategories).required(),
});

// ── Profile ──────────────────────────────────────────────────────────────────

const emergencyContactSchema = Joi.object({
  id: Joi.string().allow(""),
  _id: Joi.any(),
  name: Joi.string().allow("").max(100).default(""),
  relation: Joi.string().allow("").max(50).default("Parent"),
  phoneCountryIso: Joi.string().max(5).default("IN"),
  phoneNumber: Joi.string().allow("").max(20).default(""),
  phoneType: Joi.string().allow("").max(20).default("Mobile"),
});

export const updateProfileSchema = Joi.object({
  fullName: Joi.string().trim().max(100).allow(""),
  email: Joi.string().email().trim().lowercase().allow(""),
  phoneCountryIso: Joi.string().max(5).allow(""),
  phoneNumber: Joi.string().max(20).allow(""),
  phoneType: Joi.string().max(20).allow(""),
  dateOfBirth: Joi.string().allow(""),
  gender: Joi.string().allow(""),
  education: Joi.string().max(200).allow(""),
  occupation: Joi.string().max(200).allow(""),
  designation: Joi.string().max(200).allow(""),
  yearsOfExperience: Joi.string().max(10).allow(""),
  countryIso: Joi.string().max(5).allow(""),
  stateCode: Joi.string().max(10).allow(""),
  city: Joi.string().max(100).allow(""),
  streetAddress: Joi.string().max(300).allow(""),
  pincode: Joi.string().max(20).allow(""),
  currencyCode: Joi.string().max(5).allow(""),
  monthlyIncome: Joi.string().max(20).allow(""),
  additionalAnnualIncome: Joi.string().max(20).allow(""),
  photoDataUrl: Joi.string().allow(""),
  emergencyContacts: Joi.array().items(emergencyContactSchema).max(5),
});

// ── Settings ─────────────────────────────────────────────────────────────────

export const updateSettingsSchema = Joi.object({
  twoFactorAuth: Joi.boolean(),
  dataEncryption: Joi.boolean(),
  autoDelete: Joi.boolean(),
  notifications: Joi.boolean(),
}).min(1);


