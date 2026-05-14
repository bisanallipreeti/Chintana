import crypto from "crypto";

export function generateOtp(length = 6) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

export function hashValue(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generateSecureToken(bytes = 48) {
  return crypto.randomBytes(bytes).toString("hex");
}

export function minutesFromNow(minutes) {
  return new Date(Date.now() + minutes * 60_000);
}

export function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60_000);
}
