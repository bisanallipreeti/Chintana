import { Router } from "express";
import multer from "multer";
import { AppError } from "../../core/errors/AppError.js";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { uploadFile } from "./upload.controller.js";
import { uploadBodySchema } from "./upload.schemas.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 1,
  },
});

function parseMultipartUpload(req, res, next) {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return next(AppError.badRequest("Uploaded file exceeds server limit (50MB)."));
      }

      if (error.code === "LIMIT_FILE_COUNT") {
        return next(AppError.badRequest("Only one file can be uploaded per request."));
      }

      return next(AppError.badRequest("Invalid file upload request."));
    }

    return next(AppError.badRequest("Failed to parse multipart upload payload."));
  });
}

router.use(requireAuth);
router.post("/", parseMultipartUpload, validate(uploadBodySchema), uploadFile);

export default router;
