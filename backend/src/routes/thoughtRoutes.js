import { Router } from "express";
import {
  analyzeThoughtDraft,
  createThought,
  deleteThought,
  getThoughtById,
  listThoughts,
  updateThought,
} from "../controllers/thoughtController.js";
import { requireAuth } from "../middleware/auth.js";
import {
  validate,
  createThoughtSchema,
  updateThoughtSchema,
  analyzeThoughtSchema,
} from "../middleware/validation.js";

const router = Router();

router.use(requireAuth);
router.get("/", listThoughts);
router.post("/analyze", validate(analyzeThoughtSchema), analyzeThoughtDraft);
router.post("/", validate(createThoughtSchema), createThought);
router.get("/:id", getThoughtById);
router.put("/:id", validate(updateThoughtSchema), updateThought);
router.delete("/:id", deleteThought);

export default router;
