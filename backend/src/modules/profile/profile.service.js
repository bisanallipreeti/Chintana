import { AppError } from "../../core/errors/AppError.js";

function normalizeContact(contact) {
  return {
    name: contact.name || "",
    relation: contact.relation || "Parent",
    phoneCountryIso: contact.phoneCountryIso || "IN",
    phoneNumber: contact.phoneNumber || "",
    phoneType: contact.phoneType || "Mobile",
  };
}

export const profileService = {
  getProfile(user) {
    return user.profile;
  },

  async updateProfile(user, payload) {
    if (payload.email) {
      const nextEmail = payload.email.toLowerCase().trim();
      if (nextEmail !== user.email && !user.emailVerified) {
        throw AppError.forbidden("Verify current email before changing email address.");
      }
      user.email = nextEmail;
      payload.email = nextEmail;
      user.profile.email = nextEmail;
    }

    if (payload.fullName) {
      user.fullName = payload.fullName;
    }

    if (Array.isArray(payload.emergencyContacts)) {
      payload.emergencyContacts = payload.emergencyContacts.map(normalizeContact);
    }

    user.profile = {
      ...(user.profile?.toObject?.() || user.profile),
      ...payload,
    };

    await user.save();
    return user.profile;
  },
};
