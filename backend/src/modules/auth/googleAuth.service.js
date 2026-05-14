import { OAuth2Client } from "google-auth-library";
import { env } from "../../config/env.js";
import { AppError } from "../../core/errors/AppError.js";

const client = new OAuth2Client();

function isValidIssuer(issuer) {
  return issuer === "accounts.google.com" || issuer === "https://accounts.google.com";
}

export async function verifyGoogleCredential(credential) {
  if (!credential) {
    throw AppError.badRequest("Google credential is required.");
  }

  if (!env.googleClientIds.length) {
    throw AppError.forbidden("Google login is not configured for this environment.");
  }

  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.googleClientIds,
    });
  } catch {
    throw AppError.unauthorized("Google token is invalid or expired.");
  }

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw AppError.unauthorized("Google token payload is incomplete.");
  }

  if (!isValidIssuer(payload.iss)) {
    throw AppError.unauthorized("Google token issuer is invalid.");
  }

  if (payload.email_verified !== true) {
    throw AppError.forbidden("Google account email is not verified.");
  }

  if (!payload.exp || payload.exp * 1000 <= Date.now()) {
    throw AppError.unauthorized("Google token has expired.");
  }

  return {
    subject: String(payload.sub),
    email: String(payload.email).toLowerCase().trim(),
    fullName: String(payload.name || "").trim(),
    picture: String(payload.picture || "").trim(),
  };
}
