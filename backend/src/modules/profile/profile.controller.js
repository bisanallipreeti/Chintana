import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { sendSuccess } from "../../core/http/response.js";
import { profileService } from "./profile.service.js";

export const getProfile = asyncHandler(async (req, res) => {
  const data = profileService.getProfile(req.user);
  return sendSuccess(res, { data });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const data = await profileService.updateProfile(req.user, req.body);
  return sendSuccess(res, {
    message: "Profile updated successfully.",
    data,
  });
});
