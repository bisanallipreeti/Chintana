export function sendSuccess(res, {
  statusCode = 200,
  message = "Success",
  data = null,
  meta = undefined,
}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    error: null,
    meta,
    requestId: res.locals.requestId,
  });
}

export function sendError(res, {
  statusCode,
  message,
  code = "ERROR",
  errors,
  data = null,
}) {
  return res.status(statusCode).json({
    success: false,
    message,
    data,
    error: {
      code,
      details: errors || null,
    },
    // Backward-compatible fields for existing clients.
    code,
    errors,
    requestId: res.locals.requestId,
  });
}
