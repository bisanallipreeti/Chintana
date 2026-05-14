import bcrypt from "bcryptjs";
import { env } from "../../config/env.js";
import { AppError } from "../../core/errors/AppError.js";

export const settingsService = {
  getSettings(user) {
    return user.settings;
  },

  async updateSettings(user, payload) {
    user.settings = {
      ...(user.settings?.toObject?.() || user.settings),
      ...payload,
    };

    await user.save();
    return user.settings;
  },

  async registerPushToken(user, payload) {
    const existing = Array.isArray(user.devicePushTokens) ? user.devicePushTokens : [];
    const filtered = existing.filter((entry) => entry.token !== payload.token);

    filtered.unshift({
      token: payload.token,
      platform: payload.platform,
      createdAt: new Date(),
    });

    user.devicePushTokens = filtered.slice(0, 10);
    await user.save();

    return {
      registered: true,
      totalTokens: user.devicePushTokens.length,
    };
  },

  async changePin(user, payload) {
    const hasExistingPin = Boolean(user.securityPinHash);

    if (hasExistingPin) {
      if (!payload.currentPin) {
        throw AppError.badRequest("Current PIN is required.");
      }

      const pinMatches = await bcrypt.compare(payload.currentPin, user.securityPinHash);
      if (!pinMatches) {
        throw AppError.unauthorized("Current PIN is incorrect.");
      }
    }

    if (payload.currentPin && payload.currentPin === payload.newPin) {
      throw AppError.badRequest("New PIN must be different from current PIN.");
    }

    user.securityPinHash = await bcrypt.hash(payload.newPin, env.bcryptSaltRounds);
    await user.save();

    return { updated: true };
  },

  async changeRegisteredPhone(user, payload) {
    user.profile = {
      ...(user.profile?.toObject?.() || user.profile),
      phoneCountryIso: payload.phoneCountryIso,
      phoneNumber: payload.phoneNumber,
    };

    await user.save();

    return {
      phoneCountryIso: user.profile.phoneCountryIso,
      phoneNumber: user.profile.phoneNumber,
    };
  },
};
