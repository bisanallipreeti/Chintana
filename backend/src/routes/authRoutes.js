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

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  register
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  login
);

router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPassword
);

router.get("/me", requireAuth, me);

/* ---------------- FIXED CHECK EMAIL ---------------- */

router.post("/check-email", async (req, res, next) => {
  try {
    const email = req.body?.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    return res.json({
      success: true,
      exists: !!existingUser,
    });
  } catch (error) {
    next(error); // IMPORTANT: prevents 500 crash without logs
  }
});

export default router;
