import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate, updateSettingsSchema } from "../middleware/validation.js";

const router = Router();

router.use(requireAuth);
router.get("/", getSettings);
router.put("/", validate(updateSettingsSchema), updateSettings);

export default router;
