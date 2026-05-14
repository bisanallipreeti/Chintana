import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  analyzeThoughtSchema,
  createThoughtSchema,
  listThoughtsQuerySchema,
  thoughtIdParamsSchema,
  updateThoughtSchema,
} from "./thought.schemas.js";
import {
  analyzeThoughtDraft,
  createThought,
  deleteAllThoughts,
  deleteThought,
  getThoughtById,
  listThoughts,
  reprocessThought,
  updateThought,
} from "./thought.controller.js";
import { aiLimiter } from "../../middleware/rateLimit.js";

const router = Router();

router.use(requireAuth);

router.get("/", validate(listThoughtsQuerySchema, "query"), listThoughts);
router.post("/analyze", aiLimiter, validate(analyzeThoughtSchema), analyzeThoughtDraft);
router.post("/", validate(createThoughtSchema), createThought);
router.delete("/", deleteAllThoughts);
router.get("/:id", validate(thoughtIdParamsSchema, "params"), getThoughtById);
router.put("/:id", validate(thoughtIdParamsSchema, "params"), validate(updateThoughtSchema), updateThought);
router.delete("/:id", validate(thoughtIdParamsSchema, "params"), deleteThought);
router.post("/:id/reprocess-ai", validate(thoughtIdParamsSchema, "params"), reprocessThought);

export default router;
