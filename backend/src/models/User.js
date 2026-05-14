import mongoose from "mongoose";

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 100, default: "" },
    relation: { type: String, trim: true, maxlength: 50, default: "Parent" },
    phoneCountryIso: { type: String, trim: true, maxlength: 5, default: "IN" },
    phoneNumber: { type: String, trim: true, maxlength: 20, default: "" },
    phoneType: { type: String, trim: true, maxlength: 20, default: "Mobile" },
  },
  { _id: true },
);

const profileSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true, maxlength: 100, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phoneCountryIso: { type: String, trim: true, maxlength: 5, default: "IN" },
    phoneNumber: { type: String, trim: true, maxlength: 20, default: "" },
    phoneType: { type: String, trim: true, maxlength: 20, default: "Mobile" },
    dateOfBirth: { type: String, default: "" },
    gender: { type: String, trim: true, maxlength: 30, default: "" },
    nationality: { type: String, trim: true, maxlength: 100, default: "Indian" },
    education: { type: String, trim: true, maxlength: 200, default: "" },
    occupation: { type: String, trim: true, maxlength: 200, default: "" },
    designation: { type: String, trim: true, maxlength: 200, default: "" },
    yearsOfExperience: { type: String, trim: true, maxlength: 10, default: "" },
    countryIso: { type: String, trim: true, maxlength: 5, default: "" },
    stateCode: { type: String, trim: true, maxlength: 10, default: "" },
    city: { type: String, trim: true, maxlength: 100, default: "" },
    streetAddress: { type: String, trim: true, maxlength: 300, default: "" },
    pincode: { type: String, trim: true, maxlength: 20, default: "" },
    currencyCode: { type: String, trim: true, maxlength: 5, default: "INR" },
    monthlyIncome: { type: String, trim: true, maxlength: 20, default: "" },
    additionalAnnualIncome: { type: String, trim: true, maxlength: 20, default: "" },
    photoDataUrl: { type: String, default: "" },
    emergencyContacts: { type: [emergencyContactSchema], default: [] },
  },
  { _id: false },
);

const settingsSchema = new mongoose.Schema(
  {
    twoFactorAuth: { type: Boolean, default: false },
    dataEncryption: { type: Boolean, default: true },
    autoDelete: { type: Boolean, default: false },
    notifications: { type: Boolean, default: true },
    reminderEmailEnabled: { type: Boolean, default: true },
    reminderPushEnabled: { type: Boolean, default: true },
    reminderHourUtc: { type: Number, min: 0, max: 23, default: 13 },
    biometricEnabled: { type: Boolean, default: false },
  },
  { _id: false },
);

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    tokenFamily: { type: String, required: true },
    userAgent: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByHash: { type: String, default: "" },
  },
  { _id: false },
);

const googleAuthSchema = new mongoose.Schema(
  {
    subject: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    name: { type: String, trim: true },
    picture: { type: String, trim: true },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    securityPinHash: { type: String, default: "" },
    emailVerified: { type: Boolean, default: false, index: true },
    onboardingCompleted: { type: Boolean, default: false },

    emailVerification: {
      otpHash: { type: String, default: "" },
      expiresAt: { type: Date, default: null },
      attempts: { type: Number, default: 0 },
      lastSentAt: { type: Date, default: null },
      verifiedAt: { type: Date, default: null },
    },

    passwordReset: {
      tokenHash: { type: String, default: "" },
      expiresAt: { type: Date, default: null },
      requestedAt: { type: Date, default: null },
    },

    failedLoginCount: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },

    refreshTokens: { type: [refreshTokenSchema], default: [] },

    devicePushTokens: {
      type: [
        {
          token: { type: String, required: true },
          platform: { type: String, enum: ["ios", "android", "web"], required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    profile: { type: profileSchema, default: () => ({}) },
    settings: { type: settingsSchema, default: () => ({}) },
    googleAuth: { type: googleAuthSchema, default: undefined },
  },
  { timestamps: true, strict: "throw" },
);

userSchema.index({ "refreshTokens.tokenHash": 1 });
userSchema.index({ createdAt: -1 });
userSchema.index(
  { "googleAuth.subject": 1 },
  {
    name: "googleAuth_subject_unique_nonempty",
    unique: true,
    partialFilterExpression: {
      "googleAuth.subject": { $exists: true, $type: "string", $gt: "" },
    },
  },
);

export const User = mongoose.model("User", userSchema);
