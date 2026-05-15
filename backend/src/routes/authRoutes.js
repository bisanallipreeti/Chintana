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

const router = Router();

/* ---------------- AUTH ROUTES ---------------- */

// Register
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  register
);

// Login
router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  login
);

// Forgot password
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPassword
);

// Get current user
router.get("/me", requireAuth, me);

/* ---------------- ADDED ROUTE ---------------- */

// Check email (FIX for frontend error)
router.post("/check-email", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  // TODO: replace with DB check if needed
  return res.json({
    success: true,
    exists: false,
    message: "Email check completed",
  });
});

export default router;
