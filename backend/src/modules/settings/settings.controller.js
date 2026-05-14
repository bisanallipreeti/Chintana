import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { sendSuccess } from "../../core/http/response.js";
import { settingsService } from "./settings.service.js";

export const getSettings = asyncHandler(async (req, res) => {
  const data = settingsService.getSettings(req.user);
  return sendSuccess(res, { data });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const data = await settingsService.updateSettings(req.user, req.body);
  return sendSuccess(res, {
    message: "Settings updated successfully.",
    data,
  });
});

export const registerPushToken = asyncHandler(async (req, res) => {
  const data = await settingsService.registerPushToken(req.user, req.body);
  return sendSuccess(res, {
    message: "Push token registered.",
    data,
  });
});

export const changePin = asyncHandler(async (req, res) => {
  const data = await settingsService.changePin(req.user, req.body);
  return sendSuccess(res, {
    message: "PIN updated successfully.",
    data,
  });
});

export const changeRegisteredPhone = asyncHandler(async (req, res) => {
  const data = await settingsService.changeRegisteredPhone(req.user, req.body);
  return sendSuccess(res, {
    message: "Registered phone updated.",
    data,
  });
});
