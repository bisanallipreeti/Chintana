import { Thought } from "../models/Thought.js";
import { ApiError } from "../utils/ApiError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { analyzeThought } from "../services/thoughtAnalysisService.js";

export const analyzeThoughtDraft = catchAsync(async (req, res) => {
  const { text, category } = req.body;
  if (!text || !category) {
    throw new ApiError(400, "Text and category are required for analysis.");
  }

  const analysis = await analyzeThought(text, category, req.user?.profile || {});
  res.json({
    success: true,
    data: analysis,
  });
});

export const createThought = catchAsync(async (req, res) => {
  const { text, category, allowSharing = false, confidential = true, attachments = [] } = req.body;
  if (!text || !category) {
    throw new ApiError(400, "Text and category are required.");
  }

  const analysis = await analyzeThought(text, category, req.user.profile);
  const thought = await Thought.create({
    user: req.user._id,
    text,
    category,
    allowSharing,
    confidential,
    attachments,
    ...analysis,
  });

  res.status(201).json({
    success: true,
    message: "Thought created successfully.",
    data: thought,
  });
});

export const listThoughts = catchAsync(async (req, res) => {
  const {
    search,
    category,
    type,
    sort = "date",
    order = "desc",
    page = "1",
    limit = "50",
  } = req.query;

  const filter = { user: req.user._id };

  // Text search
  if (search) {
    filter.text = { $regex: search, $options: "i" };
  }

  // Category filter
  if (category) {
    filter.category = category;
  }

  // Type filter (Constructive / Destructive / Neutral)
  if (type) {
    filter.type = type;
  }

  // Sort
  const sortField = sort === "score" ? "score" : "createdAt";
  const sortDirection = order === "asc" ? 1 : -1;

  // Pagination
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const [thoughts, total] = await Promise.all([
    Thought.find(filter).sort({ [sortField]: sortDirection }).skip(skip).limit(limitNum),
    Thought.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: thoughts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

export const getThoughtById = catchAsync(async (req, res) => {
  const thought = await Thought.findOne({ _id: req.params.id, user: req.user._id });
  if (!thought) {
    throw new ApiError(404, "Thought not found.");
  }

  res.json({
    success: true,
    data: thought,
  });
});

export const updateThought = catchAsync(async (req, res) => {
  const thought = await Thought.findOne({ _id: req.params.id, user: req.user._id });
  if (!thought) {
    throw new ApiError(404, "Thought not found.");
  }

  const { text, category, allowSharing, confidential, attachments } = req.body;
  const nextText = text ?? thought.text;
  const nextCategory = category ?? thought.category;
  const analysis = await analyzeThought(nextText, nextCategory, req.user.profile);

  thought.text = nextText;
  thought.category = nextCategory;
  thought.allowSharing = allowSharing ?? thought.allowSharing;
  thought.confidential = confidential ?? thought.confidential;
  thought.attachments = attachments ?? thought.attachments;
  thought.type = analysis.type;
  thought.score = analysis.score;
  thought.classification = analysis.classification;
  thought.energyImpact = analysis.energyImpact;
  thought.suggestion = analysis.suggestion;
  thought.stressLevel = analysis.stressLevel;
  thought.profileSignals = analysis.profileSignals;

  await thought.save();

  res.json({
    success: true,
    message: "Thought updated successfully.",
    data: thought,
  });
});

export const deleteThought = catchAsync(async (req, res) => {
  const thought = await Thought.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!thought) {
    throw new ApiError(404, "Thought not found.");
  }

  res.json({
    success: true,
    message: "Thought deleted successfully.",
  });
});
