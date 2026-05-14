import { Thought } from "../../models/Thought.js";

function buildFilter(userId, query = {}) {
  const filter = { user: userId };

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.type) {
    filter.type = query.type;
  }

  if (query.minScore !== undefined || query.maxScore !== undefined) {
    filter.score = {};
    if (query.minScore !== undefined) filter.score.$gte = query.minScore;
    if (query.maxScore !== undefined) filter.score.$lte = query.maxScore;
  }

  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) {
      filter.createdAt.$gte = new Date(query.dateFrom);
    }
    if (query.dateTo) {
      filter.createdAt.$lte = new Date(query.dateTo);
    }
  }

  return filter;
}

export const thoughtRepository = {
  async create(payload) {
    return Thought.create(payload);
  },

  async listByUser(userId, query) {
    const filter = buildFilter(userId, query);

    const sortField = query.sort === "score" ? "score" : "createdAt";
    const sortDirection = query.order === "asc" ? 1 : -1;

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const projection = query.search
      ? { score: { $meta: "textScore" } }
      : null;

    const [items, total] = await Promise.all([
      Thought.find(filter, projection)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean(),
      Thought.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  findByIdForUser(thoughtId, userId) {
    return Thought.findOne({ _id: thoughtId, user: userId });
  },

  deleteOlderThan(userId, cutoffDate) {
    return Thought.deleteMany({
      user: userId,
      createdAt: { $lt: cutoffDate },
    });
  },

  deleteLowValueOlderThan(userId, cutoffDate, maxScoreExclusive = 30) {
    return Thought.deleteMany({
      user: userId,
      score: { $lt: maxScoreExclusive },
      createdAt: { $lte: cutoffDate },
    });
  },

  deleteByIdForUser(thoughtId, userId) {
    return Thought.findOneAndDelete({ _id: thoughtId, user: userId });
  },

  deleteAllByUser(userId) {
    return Thought.deleteMany({ user: userId });
  },

  findPendingRevisitsBefore(date) {
    return Thought.find({
      reminderStatus: "pending",
      revisitAt: { $lte: date },
    })
      .select("_id user text revisitAt")
      .lean();
  },
};
