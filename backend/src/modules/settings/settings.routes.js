import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  changePin,
  changeRegisteredPhone,
  getSettings,
  registerPushToken,
  updateSettings,
} from "./settings.controller.js";
import {
  changePhoneSchema,
  changePinSchema,
  registerPushTokenSchema,
  updateSettingsSchema,
} from "./settings.schemas.js";

const router = Router();

router.use(requireAuth);
router.get("/", getSettings);
router.put("/", validate(updateSettingsSchema), updateSettings);
router.post("/push-token", validate(registerPushTokenSchema), registerPushToken);
router.post("/change-pin", validate(changePinSchema), changePin);
router.post("/change-phone", validate(changePhoneSchema), changeRegisteredPhone);

export default router;
