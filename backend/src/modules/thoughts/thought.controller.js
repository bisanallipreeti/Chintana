import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { sendSuccess } from "../../core/http/response.js";
import { thoughtService } from "./thought.service.js";

export const analyzeThoughtDraft = asyncHandler(async (req, res) => {
  const data = await thoughtService.analyzeDraft({ user: req.user, payload: req.body });
  return sendSuccess(res, { data });
});

export const createThought = asyncHandler(async (req, res) => {
  const data = await thoughtService.create({ user: req.user, payload: req.body });
  return sendSuccess(res, {
    statusCode: 201,
    message: "Thought created successfully.",
    data,
  });
});

export const listThoughts = asyncHandler(async (req, res) => {
  const result = await thoughtService.list({ user: req.user, query: req.query });
  return sendSuccess(res, {
    data: result.items,
    meta: { pagination: result.pagination },
  });
});

export const getThoughtById = asyncHandler(async (req, res) => {
  const data = await thoughtService.getById({
    user: req.user,
    thoughtId: req.params.id,
  });
  return sendSuccess(res, { data });
});

export const updateThought = asyncHandler(async (req, res) => {
  const data = await thoughtService.update({
    user: req.user,
    thoughtId: req.params.id,
    payload: req.body,
  });
  return sendSuccess(res, {
    message: "Thought updated successfully.",
    data,
  });
});

export const deleteThought = asyncHandler(async (req, res) => {
  const data = await thoughtService.delete({
    user: req.user,
    thoughtId: req.params.id,
  });

  return sendSuccess(res, {
    message: "Thought deleted successfully.",
    data,
  });
});

export const deleteAllThoughts = asyncHandler(async (req, res) => {
  const data = await thoughtService.deleteAll({
    user: req.user,
  });

  return sendSuccess(res, {
    message: "All thoughts deleted successfully.",
    data,
  });
});

export const reprocessThought = asyncHandler(async (req, res) => {
  const data = await thoughtService.queueReanalysis({
    user: req.user,
    thoughtId: req.params.id,
  });

  return sendSuccess(res, {
    statusCode: 202,
    message: "Re-analysis queued.",
    data,
  });
});
