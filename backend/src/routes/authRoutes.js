import { Router } from "express";
import { forgotPassword, login, me, register } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate, registerSchema, loginSchema, forgotPasswordSchema } from "../middleware/validation.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.get("/me", requireAuth, me);

export default router;
