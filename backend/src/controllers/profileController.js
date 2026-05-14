import { catchAsync } from "../utils/catchAsync.js";

export const getProfile = catchAsync(async (req, res) => {
  res.json({
    success: true,
    data: req.user.profile,
  });
});

export const updateProfile = catchAsync(async (req, res) => {
  req.user.profile = {
    ...req.user.profile.toObject(),
    ...req.body,
  };

  if (req.body.fullName) {
    req.user.fullName = req.body.fullName;
  }

  if (req.body.email) {
    req.user.email = req.body.email.toLowerCase().trim();
    req.user.profile.email = req.user.email;
  }

  await req.user.save();

  res.json({
    success: true,
    message: "Profile updated successfully.",
    data: req.user.profile,
  });
});
