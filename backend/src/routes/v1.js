import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import dashboardRoutes from "../modules/dashboard/dashboard.routes.js";
import profileRoutes from "../modules/profile/profile.routes.js";
import settingsRoutes from "../modules/settings/settings.routes.js";
import thoughtRoutes from "../modules/thoughts/thought.routes.js";
import uploadRoutes from "../modules/upload/upload.routes.js";
import exportRoutes from "../modules/export/export.routes.js";
import reminderRoutes from "../modules/reminders/reminder.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/profile", profileRoutes);
router.use("/settings", settingsRoutes);
router.use("/thoughts", thoughtRoutes);
router.use("/upload", uploadRoutes);
router.use("/exports", exportRoutes);
router.use("/reminders", reminderRoutes);

export default router;
