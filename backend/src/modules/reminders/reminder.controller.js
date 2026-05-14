import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { sendSuccess } from "../../core/http/response.js";
import { reminderService } from "./reminder.service.js";

export const getUpcomingReminders = asyncHandler(async (req, res) => {
  const data = await reminderService.getUpcoming(req.user._id);
  return sendSuccess(res, { data });
});

export const setThoughtRevisit = asyncHandler(async (req, res) => {
  const data = await reminderService.setRevisitDate({
    userId: req.user._id,
    thoughtId: req.params.thoughtId,
    revisitAt: req.body.revisitAt,
  });

  return sendSuccess(res, {
    message: "Revisit reminder scheduled.",
    data,
  });
});

export const runDailyReminderSweep = asyncHandler(async (_req, res) => {
  const data = await reminderService.runDailyReminderSweep();
  return sendSuccess(res, {
    message: "Daily reminders queued.",
    data,
  });
});
