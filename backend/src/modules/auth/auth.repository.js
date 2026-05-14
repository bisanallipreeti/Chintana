import { User } from "../../models/User.js";
import { Thought } from "../../models/Thought.js";

export const authRepository = {
  findByEmail(email) {
    return User.findOne({ email: email.toLowerCase().trim() });
  },

  existsByEmail(email) {
    return User.exists({ email: email.toLowerCase().trim() });
  },

  findByGoogleSubject(subject) {
    return User.findOne({ "googleAuth.subject": subject });
  },

  findById(userId) {
    return User.findById(userId);
  },

  create(payload) {
    return User.create(payload);
  },

  save(user) {
    return user.save();
  },

  findByRefreshTokenHash(tokenHash) {
    return User.findOne({
      refreshTokens: {
        $elemMatch: {
          tokenHash,
          revokedAt: null,
          expiresAt: { $gt: new Date() },
        },
      },
    });
  },

  findByPasswordResetTokenHash(tokenHash) {
    return User.findOne({
      "passwordReset.tokenHash": tokenHash,
      "passwordReset.expiresAt": { $gt: new Date() },
    });
  },

  deleteThoughtsByUser(userId) {
    return Thought.deleteMany({ user: userId });
  },

  deleteById(userId) {
    return User.deleteOne({ _id: userId });
  },
};
