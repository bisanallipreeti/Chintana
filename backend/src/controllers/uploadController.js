import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { cloudinary } from "../config/cloudinary.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { catchAsync } from "../utils/catchAsync.js";

export const uploadFile = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file provided.");
  }

  const expectedType = req.body.expectedType;
  if (expectedType && !["image", "video"].includes(expectedType)) {
    throw new ApiError(400, "Invalid upload type.");
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm", "video/quicktime"];
  if (!allowedTypes.includes(req.file.mimetype)) {
    throw new ApiError(400, "Unsupported file type. Allowed: JPEG, PNG, GIF, WebP, MP4, WebM, MOV.");
  }

  const isVideo = req.file.mimetype.startsWith("video/");
  const resourceType = isVideo ? "video" : "image";

  if (expectedType && expectedType !== resourceType) {
    throw new ApiError(
      400,
      expectedType === "image"
        ? "Please select an image file for image upload."
        : "Please select a video file for video upload.",
    );
  }

  const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;

  if (req.file.size > maxSize) {
    throw new ApiError(400, `File too large. Maximum size: ${isVideo ? "50MB" : "10MB"}.`);
  }

  const hasCloudinaryConfig =
    Boolean(env.cloudinaryCloudName) &&
    Boolean(env.cloudinaryApiKey) &&
    Boolean(env.cloudinaryApiSecret);

  let result;

  if (hasCloudinaryConfig) {
    result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: "chintana",
          transformation: isVideo ? undefined : [{ quality: "auto", fetch_format: "auto" }],
        },
        (error, uploadResult) => {
          if (error) reject(error);
          else resolve(uploadResult);
        },
      );

      uploadStream.end(req.file.buffer);
    });
  } else {
    const uploadDir = path.resolve(process.cwd(), "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const extensionMap = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "video/mp4": ".mp4",
      "video/webm": ".webm",
      "video/quicktime": ".mov",
    };

    const fileExtension =
      extensionMap[req.file.mimetype] ||
      path.extname(req.file.originalname || "").toLowerCase() ||
      "";
    const fileName = `${resourceType}-${randomUUID()}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    await fs.writeFile(filePath, req.file.buffer);

    result = {
      secure_url: `${req.protocol}://${req.get("host")}/uploads/${fileName}`,
      public_id: fileName.replace(fileExtension, ""),
      format: fileExtension.replace(".", ""),
    };
  }

  res.status(201).json({
    success: true,
    message: "File uploaded successfully.",
    data: {
      url: result.secure_url,
      publicId: result.public_id,
      type: resourceType,
      name: req.file.originalname,
      size: req.file.size,
      format: result.format,
    },
  });
});
