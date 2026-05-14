import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { getProfile, updateProfile } from "./profile.controller.js";
import { updateProfileSchema } from "./profile.schemas.js";

const router = Router();

router.use(requireAuth);
router.get("/", getProfile);
router.put("/", validate(updateProfileSchema), updateProfile);

export default router;
