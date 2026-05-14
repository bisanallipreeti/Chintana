import { catchAsync } from "../utils/catchAsync.js";

export const getSettings = catchAsync(async (req, res) => {
  res.json({
    success: true,
    data: req.user.settings,
  });
});

export const updateSettings = catchAsync(async (req, res) => {
  req.user.settings = {
    ...req.user.settings.toObject(),
    ...req.body,
  };

  await req.user.save();

  res.json({
    success: true,
    message: "Settings updated successfully.",
    data: req.user.settings,
  });
});
