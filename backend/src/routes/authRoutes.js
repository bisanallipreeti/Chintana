import { Router } from "express";

import {
  forgotPassword,
  login,
  me,
  register,
} from "../controllers/authController.js";

import { requireAuth } from "../middleware/auth.js";

import {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
} from "../middleware/validation.js";

import { authLimiter } from "../middleware/rateLimiter.js";

import { User } from "../models/User.js";

const router = Router();

/* ---------------- AUTH ROUTES ---------------- */

// REGISTER
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  register
);

// LOGIN
router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  login
);

// FORGOT PASSWORD
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPassword
);

// CURRENT USER
router.get("/me", requireAuth, me);

/* ---------------- CHECK EMAIL (FIXED) ---------------- */

router.post("/check-email", async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    return res.status(200).json({
      success: true,
      exists: Boolean(existingUser),
    });

  } catch (error) {
    console.error("❌ check-email error:", error);
    next(error);
  }
});

export default router;
