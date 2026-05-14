import { Router } from "express";
import authRoutes from "./authRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import profileRoutes from "./profileRoutes.js";
import settingsRoutes from "./settingsRoutes.js";
import thoughtRoutes from "./thoughtRoutes.js";
import uploadRoutes from "./uploadRoutes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      service: "chintana-backend",
      timestamp: new Date().toISOString(),
    },
  });
});

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/profile", profileRoutes);
router.use("/settings", settingsRoutes);
router.use("/thoughts", thoughtRoutes);
router.use("/upload", uploadRoutes);

export default router;
