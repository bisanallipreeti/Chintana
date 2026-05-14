import { Router } from "express";
import {
  checkEmail,
  forgotPassword,
  login,
  googleLogin,
  logout,
  me,
  changePassword,
  deleteAccount,
  refreshToken,
  register,
  resendOtp,
  resetPassword,
  verifyEmail,
} from "./auth.controller.js";
import {
  checkEmailSchema,
  forgotPasswordSchema,
  googleLoginSchema,
  loginSchema,
  logoutSchema,
  changePasswordSchema,
  refreshTokenSchema,
  registerSchema,
  resendOtpSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth.schemas.js";
import { validate } from "../../middleware/validate.js";
import { authLimiter, emailCheckLimiter } from "../../middleware/rateLimit.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/check-email", emailCheckLimiter, validate(checkEmailSchema), checkEmail);
router.post("/verify-email", authLimiter, validate(verifyEmailSchema), verifyEmail);
router.post("/resend-otp", authLimiter, validate(resendOtpSchema), resendOtp);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/google", authLimiter, validate(googleLoginSchema), googleLogin);
router.post("/refresh-token", authLimiter, validate(refreshTokenSchema), refreshToken);
router.post("/logout", validate(logoutSchema), logout);
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), resetPassword);
router.post("/change-password", requireAuth, validate(changePasswordSchema), changePassword);
router.delete("/account", requireAuth, deleteAccount);
router.get("/me", requireAuth, me);

export default router;
