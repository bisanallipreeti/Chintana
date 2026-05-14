import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { AppError } from "../../core/errors/AppError.js";
import { env } from "../../config/env.js";
import {
  getUpcomingReminders,
  runDailyReminderSweep,
  setThoughtRevisit,
} from "./reminder.controller.js";
import { setRevisitSchema, thoughtIdParamsSchema } from "./reminder.schemas.js";

const router = Router();

function requireInternalCronKey(req, _res, next) {
  if (!env.internalCronKey) {
    return next(AppError.forbidden("Daily reminder sweep is disabled."));
  }

  const rawKey = req.headers["x-cron-key"];
  const key = Array.isArray(rawKey) ? rawKey[0] : rawKey;

  if (key !== env.internalCronKey) {
    return next(AppError.forbidden("Invalid cron key."));
  }

  return next();
}

router.get("/upcoming", requireAuth, getUpcomingReminders);
router.post(
  "/thought/:thoughtId",
  requireAuth,
  validate(thoughtIdParamsSchema, "params"),
  validate(setRevisitSchema),
  setThoughtRevisit,
);
router.post("/run-daily", requireInternalCronKey, runDailyReminderSweep);

export default router;
