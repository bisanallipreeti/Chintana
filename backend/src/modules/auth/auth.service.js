import bcrypt from "bcryptjs";
import { env } from "../../config/env.js";
import { AppError } from "../../core/errors/AppError.js";
import { daysFromNow, generateOtp, generateSecureToken, hashValue, minutesFromNow } from "../../core/utils/crypto.js";
import { signAccessToken } from "../../core/utils/jwt.js";
import { authRepository } from "./auth.repository.js";
import { queueManager } from "../../infrastructure/queue/queueManager.js";
import { QUEUE_NAMES } from "../../jobs/queueNames.js";
import { verifyGoogleCredential } from "./googleAuth.service.js";

function sanitizeUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    emailVerified: user.emailVerified,
    onboardingCompleted: user.onboardingCompleted,
    profile: user.profile,
    settings: user.settings,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function buildOtpEmail(name, otp) {
  return {
    subject: "Verify your Chintana account",
    text: `Hi ${name}, your Chintana verification OTP is ${otp}. It expires in ${env.otpTtlMinutes} minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;">
        <h2>Verify your Chintana account</h2>
        <p>Hi ${name},</p>
        <p>Your one-time verification code is:</p>
        <p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${otp}</p>
        <p>This code expires in ${env.otpTtlMinutes} minutes.</p>
      </div>
    `,
  };
}

function buildResetEmail(name, resetToken) {
  const resetUrl = buildPasswordResetUrl(resetToken);
  return {
    subject: "Reset your Chintana password",
    text: `Hi ${name}, use this link to reset your password: ${resetUrl}. Link expires in ${env.passwordResetTtlMinutes} minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;">
        <h2>Password reset request</h2>
        <p>Hi ${name},</p>
        <p>Use the link below to reset your password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in ${env.passwordResetTtlMinutes} minutes.</p>
      </div>
    `,
  };
}

function buildPasswordResetUrl(resetToken) {
  const encodedToken = encodeURIComponent(resetToken);
  const configuredUrl = String(env.passwordResetUrl || "").trim();

  if (configuredUrl) {
    if (configuredUrl.includes("{token}")) {
      return configuredUrl.replace("{token}", encodedToken);
    }

    const separator = configuredUrl.includes("?") ? "&" : "?";
    return `${configuredUrl}${separator}token=${encodedToken}`;
  }

  return `${env.clientAppUrl.replace(/\/$/, "")}/reset-password?token=${encodedToken}`;
}

function issueRefreshToken(user, context = {}) {
  user.refreshTokens = user.refreshTokens
    .filter((token) => !token.revokedAt && token.expiresAt > new Date())
    .slice(-15);

  const refreshToken = generateSecureToken(48);
  const tokenHash = hashValue(refreshToken);
  const tokenFamily = context.tokenFamily || generateSecureToken(16);
  const expiresAt = daysFromNow(env.refreshTokenTtlDays);

  user.refreshTokens.push({
    tokenHash,
    tokenFamily,
    userAgent: context.userAgent || "",
    ipAddress: context.ipAddress || "",
    expiresAt,
  });

  return {
    refreshToken,
    refreshTokenHash: tokenHash,
    tokenFamily,
    expiresAt,
  };
}

function buildAuthPayload(user, refreshToken) {
  const accessToken = signAccessToken(user);

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser(user),
  };
}

function fallbackNameFromEmail(email) {
  const localPart = String(email || "")
    .trim()
    .split("@")[0]
    .replace(/[._-]+/g, " ");
  const words = localPart.split(/\s+/).filter(Boolean);
  if (!words.length) return "User";
  return words.map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}

function ensureAccountUnlocked(user) {
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw AppError.forbidden("Account is temporarily locked due to repeated failed logins.");
  }
}

function hasUsableSmtpConfig() {
  const placeholderValues = new Set([
    "your-email@gmail.com",
    "your-gmail-app-password",
  ]);

  return Boolean(
    env.smtpHost &&
      env.smtpUser &&
      env.smtpPass &&
      !placeholderValues.has(env.smtpUser) &&
      !placeholderValues.has(env.smtpPass),
  );
}

function canBypassEmailVerificationInLocalDev() {
  return env.nodeEnv === "development" && !hasUsableSmtpConfig();
}

async function queueEmail(to, template) {
  await queueManager.add(QUEUE_NAMES.EMAIL, {
    to,
    ...template,
  });
}

export const authService = {
  async checkEmail({ email, purpose }) {
    const exists = Boolean(await authRepository.existsByEmail(email));

    if (purpose === "login" && !exists) {
      return {
        exists,
        message: "Account does not exist.",
      };
    }

    if (purpose === "register" && exists) {
      return {
        exists,
        message: "An account with this email already exists.",
      };
    }

    return {
      exists,
      message: exists ? "Email is available for login." : "Email is available for registration.",
    };
  },

  async register(payload, context = {}) {
    const existing = await authRepository.findByEmail(payload.email);
    if (existing) {
      throw AppError.conflict("An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(payload.password, env.bcryptSaltRounds);
    const otp = generateOtp(6);

    const user = await authRepository.create({
      fullName: payload.fullName.trim(),
      email: payload.email,
      passwordHash,
      profile: {
        fullName: payload.fullName.trim(),
        email: payload.email,
      },
      emailVerification: {
        otpHash: hashValue(otp),
        expiresAt: minutesFromNow(env.otpTtlMinutes),
        attempts: 0,
        lastSentAt: new Date(),
      },
    });

    if (canBypassEmailVerificationInLocalDev()) {
      user.emailVerified = true;
      user.emailVerification.otpHash = "";
      user.emailVerification.expiresAt = null;
      user.emailVerification.attempts = 0;
      user.emailVerification.verifiedAt = new Date();

      const issuedRefresh = issueRefreshToken(user, context);
      await authRepository.save(user);

      return {
        message: "Account created in local demo mode. You are now signed in.",
        user: {
          id: user._id,
          email: user.email,
          emailVerified: user.emailVerified,
        },
        accessToken: signAccessToken(user),
        refreshToken: issuedRefresh.refreshToken,
      };
    }

    await queueEmail(user.email, buildOtpEmail(user.fullName, otp));

    return {
      message: "Account created. Verify your email with the OTP sent to your inbox.",
      user: {
        id: user._id,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    };
  },

  async verifyEmail({ email, otp }, context = {}) {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw AppError.notFound("Account not found.");
    }

    if (user.emailVerified) {
      throw AppError.badRequest("Email is already verified.");
    }

    if (!user.emailVerification?.otpHash || !user.emailVerification?.expiresAt) {
      throw AppError.badRequest("Verification code is not active. Please request a new OTP.");
    }

    if (user.emailVerification.expiresAt < new Date()) {
      throw AppError.badRequest("OTP has expired. Please request a new OTP.");
    }

    user.emailVerification.attempts += 1;
    if (user.emailVerification.attempts > 5) {
      await authRepository.save(user);
      throw AppError.tooManyRequests("Too many OTP attempts. Please request a new OTP.");
    }

    if (hashValue(otp) !== user.emailVerification.otpHash) {
      await authRepository.save(user);
      throw AppError.badRequest("Invalid OTP.");
    }

    user.emailVerified = true;
    user.emailVerification.verifiedAt = new Date();
    user.emailVerification.otpHash = "";
    user.emailVerification.expiresAt = null;
    user.emailVerification.attempts = 0;

    const issuedRefresh = issueRefreshToken(user, context);
    await authRepository.save(user);

    return buildAuthPayload(user, issuedRefresh.refreshToken);
  },

  async resendOtp({ email }) {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      return { message: "If the account exists, a verification OTP has been sent." };
    }

    if (user.emailVerified) {
      return { message: "Email is already verified." };
    }

    if (user.emailVerification?.lastSentAt) {
      const elapsedMs = Date.now() - new Date(user.emailVerification.lastSentAt).getTime();
      if (elapsedMs < 60_000) {
        throw AppError.tooManyRequests("Please wait a minute before requesting another OTP.");
      }
    }

    const otp = generateOtp(6);
    user.emailVerification.otpHash = hashValue(otp);
    user.emailVerification.expiresAt = minutesFromNow(env.otpTtlMinutes);
    user.emailVerification.attempts = 0;
    user.emailVerification.lastSentAt = new Date();

    await authRepository.save(user);
    await queueEmail(user.email, buildOtpEmail(user.fullName, otp));

    return { message: "A new OTP has been sent." };
  },

  async login({ email, password }, context = {}) {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw AppError.unauthorized("Invalid email or password.");
    }

    ensureAccountUnlocked(user);

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      user.failedLoginCount += 1;
      if (user.failedLoginCount >= 5) {
        user.lockedUntil = minutesFromNow(15);
        user.failedLoginCount = 0;
      }
      await authRepository.save(user);
      throw AppError.unauthorized("Invalid email or password.");
    }

    if (!user.emailVerified && !canBypassEmailVerificationInLocalDev()) {
      throw AppError.forbidden("Please verify your email before signing in.");
    }

    user.failedLoginCount = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();

    const issuedRefresh = issueRefreshToken(user, context);
    await authRepository.save(user);

    return buildAuthPayload(user, issuedRefresh.refreshToken);
  },

  async loginWithGoogle({ credential }, context = {}) {
    const googleProfile = await verifyGoogleCredential(credential);
    const userBySubject = await authRepository.findByGoogleSubject(googleProfile.subject);
    const userByEmail = await authRepository.findByEmail(googleProfile.email);

    if (userBySubject && userByEmail && userBySubject.id !== userByEmail.id) {
      throw AppError.conflict("This Google account is linked to a different user.");
    }

    let user = userBySubject || userByEmail;

    if (!user) {
      const generatedPassword = generateSecureToken(40);
      const passwordHash = await bcrypt.hash(generatedPassword, env.bcryptSaltRounds);
      const fullName = googleProfile.fullName || fallbackNameFromEmail(googleProfile.email);

      user = await authRepository.create({
        fullName,
        email: googleProfile.email,
        passwordHash,
        emailVerified: true,
        onboardingCompleted: false,
        profile: {
          fullName,
          email: googleProfile.email,
        },
        googleAuth: {
          subject: googleProfile.subject,
          email: googleProfile.email,
          name: googleProfile.fullName,
          picture: googleProfile.picture,
        },
      });
    } else {
      if (user.googleAuth?.subject && user.googleAuth.subject !== googleProfile.subject) {
        throw AppError.conflict("This email is already linked with another Google account.");
      }

      if (!user.profile) {
        user.profile = {};
      }

      user.googleAuth = {
        subject: googleProfile.subject,
        email: googleProfile.email,
        name: googleProfile.fullName,
        picture: googleProfile.picture,
      };

      if (!user.fullName && googleProfile.fullName) {
        user.fullName = googleProfile.fullName;
      }

      if (!user.profile.fullName && googleProfile.fullName) {
        user.profile.fullName = googleProfile.fullName;
      }
      user.profile.email = user.email;
      user.emailVerified = true;
    }

    ensureAccountUnlocked(user);
    user.failedLoginCount = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();

    const issuedRefresh = issueRefreshToken(user, context);
    await authRepository.save(user);

    return buildAuthPayload(user, issuedRefresh.refreshToken);
  },

  async refreshToken({ refreshToken }, context = {}) {
    if (!refreshToken) {
      throw AppError.unauthorized("Refresh token is required.");
    }

    const refreshTokenHash = hashValue(refreshToken);
    const user = await authRepository.findByRefreshTokenHash(refreshTokenHash);

    if (!user) {
      throw AppError.unauthorized("Refresh token is invalid or expired.");
    }

    const tokenEntry = user.refreshTokens.find((token) => token.tokenHash === refreshTokenHash);
    if (!tokenEntry || tokenEntry.revokedAt || tokenEntry.expiresAt < new Date()) {
      throw AppError.unauthorized("Refresh token is invalid or expired.");
    }

    tokenEntry.revokedAt = new Date();

    const issuedRefresh = issueRefreshToken(user, {
      tokenFamily: tokenEntry.tokenFamily,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
    });

    tokenEntry.replacedByHash = issuedRefresh.refreshTokenHash;

    await authRepository.save(user);

    return buildAuthPayload(user, issuedRefresh.refreshToken);
  },

  async logout({ refreshToken }) {
    if (!refreshToken) {
      return { message: "Logged out." };
    }

    const hash = hashValue(refreshToken);
    const user = await authRepository.findByRefreshTokenHash(hash);

    if (!user) {
      return { message: "Logged out." };
    }

    const tokenEntry = user.refreshTokens.find((token) => token.tokenHash === hash);
    if (tokenEntry) {
      tokenEntry.revokedAt = new Date();
      await authRepository.save(user);
    }

    return { message: "Logged out." };
  },

  async forgotPassword({ email }) {
    const user = await authRepository.findByEmail(email);
    if (!user) {
      return { message: "If the account exists, a password reset link has been sent." };
    }

    const token = generateSecureToken(40);

    user.passwordReset.tokenHash = hashValue(token);
    user.passwordReset.expiresAt = minutesFromNow(env.passwordResetTtlMinutes);
    user.passwordReset.requestedAt = new Date();

    await authRepository.save(user);
    await queueEmail(user.email, buildResetEmail(user.fullName, token));

    return { message: "If the account exists, a password reset link has been sent." };
  },

  async resetPassword({ token, newPassword }) {
    const tokenHash = hashValue(token);
    const account = await authRepository.findByPasswordResetTokenHash(tokenHash);

    if (!account) {
      throw AppError.badRequest("Reset token is invalid or expired.");
    }

    account.passwordHash = await bcrypt.hash(newPassword, env.bcryptSaltRounds);
    account.passwordReset.tokenHash = "";
    account.passwordReset.expiresAt = null;
    account.passwordReset.requestedAt = null;
    account.refreshTokens = [];

    await authRepository.save(account);

    return { message: "Password updated successfully. Please sign in again." };
  },

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found.");
    }

    const currentMatches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!currentMatches) {
      throw AppError.unauthorized("Current password is incorrect.");
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw AppError.badRequest("New password must be different from current password.");
    }

    user.passwordHash = await bcrypt.hash(newPassword, env.bcryptSaltRounds);
    user.refreshTokens = [];
    await authRepository.save(user);

    return { message: "Password changed successfully. Please sign in again." };
  },

  async deleteAccount(userId) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found.");
    }

    await authRepository.deleteThoughtsByUser(user._id);
    await authRepository.deleteById(user._id);

    return { message: "Account deleted successfully." };
  },

  async me(userId) {
    const user = await authRepository.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found.");
    }

    return sanitizeUser(user);
  },
};
