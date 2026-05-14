import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { signToken } from "../utils/jwt.js";

function sanitizeUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    profile: user.profile,
    settings: user.settings,
    createdAt: user.createdAt,
  };
}

export const register = catchAsync(async (req, res) => {
  const { fullName, email, password, twoFactorAuth = false } = req.body;

  if (!fullName || !email || !password) {
    throw new ApiError(400, "Full name, email, and password are required.");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    fullName: fullName.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    profile: {
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
    },
    settings: {
      twoFactorAuth,
    },
  });

  const token = signToken({ userId: user._id.toString() });

  res.status(201).json({
    success: true,
    message: "Registration successful.",
    data: {
      token,
      user: sanitizeUser(user),
    },
  });
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const token = signToken({ userId: user._id.toString() });
  res.json({
    success: true,
    message: "Login successful.",
    data: {
      token,
      user: sanitizeUser(user),
    },
  });
});

export const me = catchAsync(async (req, res) => {
  res.json({
    success: true,
    data: sanitizeUser(req.user),
  });
});

export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, "Email is required.");
  }

  res.json({
    success: true,
    message:
      "If an account exists for that email, a password reset flow can be triggered from here.",
  });
});
