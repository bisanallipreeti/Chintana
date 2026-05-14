import { User } from "../models/User.js";
import { AppError } from "../core/errors/AppError.js";
import { asyncHandler } from "../core/utils/asyncHandler.js";
import { verifyAccessToken } from "../core/utils/jwt.js";

function extractTokenFromRequest(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return null;
}

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = extractTokenFromRequest(req);

  if (!token) {
    throw AppError.unauthorized();
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw AppError.unauthorized("Invalid or expired access token.");
  }

  const user = await User.findById(decoded.sub);

  if (!user) {
    throw AppError.unauthorized("User not found for supplied token.");
  }

  req.user = user;
  req.auth = decoded;
  next();
});
