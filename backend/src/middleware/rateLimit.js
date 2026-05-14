import rateLimit from "express-rate-limit";

function jsonRateLimitMessage(message) {
  return {
    success: false,
    data: null,
    message,
    error: {
      code: "RATE_LIMITED",
      details: null,
    },
  };
}

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonRateLimitMessage("Too many requests, please try again shortly."),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonRateLimitMessage("Too many authentication requests. Please wait and retry."),
});

export const emailCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonRateLimitMessage("Too many email checks. Please wait and retry."),
});

export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonRateLimitMessage("AI quota exceeded for this window."),
});
