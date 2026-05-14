import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { sendSuccess } from "../../core/http/response.js";
import { uploadService } from "./upload.service.js";

export const uploadFile = asyncHandler(async (req, res) => {
  const data = await uploadService.upload({
    file: req.file,
    expectedType: req.body.expectedType,
    protocol: req.protocol,
    host: req.get("host"),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "File uploaded successfully.",
    data,
  });
});
