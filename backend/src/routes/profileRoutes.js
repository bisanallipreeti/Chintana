import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/profileController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate, updateProfileSchema } from "../middleware/validation.js";

const router = Router();

router.use(requireAuth);
router.get("/", getProfile);
router.put("/", validate(updateProfileSchema), updateProfile);

export default router;
