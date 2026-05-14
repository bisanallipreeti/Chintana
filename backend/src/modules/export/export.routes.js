import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { exportThoughtsCsv, exportThoughtsPdf } from "./export.controller.js";
import { exportQuerySchema } from "./export.schemas.js";

const router = Router();

router.use(requireAuth);
router.get("/thoughts/csv", validate(exportQuerySchema, "query"), exportThoughtsCsv);
router.get("/thoughts/pdf", validate(exportQuerySchema, "query"), exportThoughtsPdf);

export default router;
