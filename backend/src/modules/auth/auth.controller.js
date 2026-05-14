import { sendSuccess } from "../../core/http/response.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { authService } from "./auth.service.js";

function setRefreshCookie(res, refreshToken) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth/refresh-token",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie("refreshToken", {
    path: "/api/v1/auth/refresh-token",
  });
}

function contextFromReq(req) {
  return {
    userAgent: req.headers["user-agent"] || "",
    ipAddress: req.ip,
  };
}

export const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body, contextFromReq(req));
  if (data.refreshToken) {
    setRefreshCookie(res, data.refreshToken);
  }
  return sendSuccess(res, {
    statusCode: 201,
    message: data.message,
    data,
  });
});

export const checkEmail = asyncHandler(async (req, res) => {
  const data = await authService.checkEmail(req.body);
  return sendSuccess(res, {
    message: data.message,
    data,
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const data = await authService.verifyEmail(req.body, contextFromReq(req));
  setRefreshCookie(res, data.refreshToken);
  return sendSuccess(res, {
    message: "Email verified successfully.",
    data,
  });
});

export const resendOtp = asyncHandler(async (req, res) => {
  const data = await authService.resendOtp(req.body);
  return sendSuccess(res, {
    message: data.message,
    data,
  });
});

export const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body, contextFromReq(req));
  setRefreshCookie(res, data.refreshToken);
  return sendSuccess(res, {
    message: "Login successful.",
    data,
  });
});

export const googleLogin = asyncHandler(async (req, res) => {
  const data = await authService.loginWithGoogle(req.body, contextFromReq(req));
  setRefreshCookie(res, data.refreshToken);
  return sendSuccess(res, {
    message: "Login successful.",
    data,
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const refreshTokenInput = req.body.refreshToken || req.cookies.refreshToken;
  const data = await authService.refreshToken({ refreshToken: refreshTokenInput }, contextFromReq(req));
  setRefreshCookie(res, data.refreshToken);
  return sendSuccess(res, {
    message: "Token refreshed.",
    data,
  });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshTokenInput = req.body.refreshToken || req.cookies.refreshToken;
  const data = await authService.logout({ refreshToken: refreshTokenInput });
  clearRefreshCookie(res);
  return sendSuccess(res, {
    message: data.message,
    data,
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const data = await authService.forgotPassword(req.body);
  return sendSuccess(res, {
    message: data.message,
    data,
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const data = await authService.resetPassword(req.body);
  return sendSuccess(res, {
    message: data.message,
    data,
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const data = await authService.changePassword(req.user._id, req.body);
  clearRefreshCookie(res);
  return sendSuccess(res, {
    message: data.message,
    data,
  });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const data = await authService.deleteAccount(req.user._id);
  clearRefreshCookie(res);
  return sendSuccess(res, {
    message: data.message,
    data,
  });
});

export const me = asyncHandler(async (req, res) => {
  const data = await authService.me(req.user._id);
  return sendSuccess(res, {
    data,
  });
});
