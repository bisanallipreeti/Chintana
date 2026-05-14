import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { AppError } from "../../core/errors/AppError.js";
import { cloudinary, hasCloudinaryConfig } from "../../config/cloudinary.js";
import { env } from "../../config/env.js";

const MIME_MAP = {
  "image/jpeg": { type: "image", ext: ".jpg", maxSize: 10 * 1024 * 1024 },
  "image/png": { type: "image", ext: ".png", maxSize: 10 * 1024 * 1024 },
  "image/webp": { type: "image", ext: ".webp", maxSize: 10 * 1024 * 1024 },
  "image/gif": { type: "image", ext: ".gif", maxSize: 10 * 1024 * 1024 },
  "video/mp4": { type: "video", ext: ".mp4", maxSize: 50 * 1024 * 1024 },
  "video/webm": { type: "video", ext: ".webm", maxSize: 50 * 1024 * 1024 },
  "video/quicktime": { type: "video", ext: ".mov", maxSize: 50 * 1024 * 1024 },
};

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export const uploadService = {
  async upload({ file, expectedType, protocol, host }) {
    if (!file) {
      throw AppError.badRequest("No file provided.");
    }

    const mimeConfig = MIME_MAP[file.mimetype];
    if (!mimeConfig) {
      throw AppError.badRequest("Unsupported file type.");
    }

    if (mimeConfig.type !== expectedType) {
      throw AppError.badRequest(
        expectedType === "image"
          ? "Please upload an image file."
          : "Please upload a video file.",
      );
    }

    if (file.size > mimeConfig.maxSize) {
      throw AppError.badRequest(
        `File exceeds size limit (${mimeConfig.type === "image" ? "10MB" : "50MB"}).`,
      );
    }

    const originalName = sanitizeFileName(file.originalname || `upload${mimeConfig.ext}`);

    if (hasCloudinaryConfig) {
      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: env.cloudinaryFolder,
            resource_type: mimeConfig.type,
            use_filename: false,
            unique_filename: true,
            overwrite: false,
            allowed_formats:
              mimeConfig.type === "image"
                ? ["jpg", "jpeg", "png", "webp", "gif"]
                : ["mp4", "webm", "mov"],
          },
          (error, result) => {
            if (error) return reject(error);
            return resolve(result);
          },
        );

        stream.end(file.buffer);
      });

      return {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        type: mimeConfig.type,
        name: originalName,
        size: file.size,
        mimeType: file.mimetype,
      };
    }

    const uploadDir = path.resolve(process.cwd(), "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${mimeConfig.type}-${randomUUID()}${mimeConfig.ext}`;
    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, file.buffer);

    return {
      url: `${protocol}://${host}/uploads/${filename}`,
      publicId: filename.replace(mimeConfig.ext, ""),
      type: mimeConfig.type,
      name: originalName,
      size: file.size,
      mimeType: file.mimetype,
    };
  },
};
