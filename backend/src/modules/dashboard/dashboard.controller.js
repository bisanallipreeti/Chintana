import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { sendSuccess } from "../../core/http/response.js";
import { dashboardService } from "./dashboard.service.js";

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSummary(req.user);
  return sendSuccess(res, { data });
});
