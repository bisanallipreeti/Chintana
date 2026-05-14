import { AppError } from "../../core/errors/AppError.js";
import { analyzeThought } from "../../infrastructure/ai/thoughtAnalyzer.js";
import { queueManager } from "../../infrastructure/queue/queueManager.js";
import { QUEUE_NAMES } from "../../jobs/queueNames.js";
import { thoughtRepository } from "./thought.repository.js";

const AUTO_DELETE_DAYS = 2;
const AUTO_DELETE_SCORE_THRESHOLD = 30;

async function cleanupAutoDeleteThoughts(user) {
  if (!user?.settings?.autoDelete) {
    return;
  }

  const cutoffDate = new Date(Date.now() - AUTO_DELETE_DAYS * 24 * 60 * 60 * 1000);
  await thoughtRepository.deleteLowValueOlderThan(
    user._id,
    cutoffDate,
    AUTO_DELETE_SCORE_THRESHOLD,
  );
}

async function scheduleRevisitReminder({ thought, user }) {
  if (!thought.revisitAt) {
    thought.reminderStatus = "disabled";
    thought.reminderSentAt = null;
    return;
  }

  if (!user.settings?.notifications || !user.settings?.reminderEmailEnabled) {
    thought.reminderStatus = "disabled";
    return;
  }

  const delayMs = Math.max(0, new Date(thought.revisitAt).getTime() - Date.now());
  thought.reminderStatus = "pending";
  thought.reminderSentAt = null;

  await queueManager.add(
    QUEUE_NAMES.REMINDERS,
    {
      thoughtId: thought._id.toString(),
      userId: user._id.toString(),
    },
    { delayMs, attempts: 3 },
  );
}

function normalizeThought(raw) {
  return {
    ...raw,
    id: raw._id?.toString?.() || raw.id,
  };
}

export const thoughtService = {
  async analyzeDraft({ user, payload }) {
    const analysis = await analyzeThought({
      userId: user._id.toString(),
      text: payload.text,
      category: payload.category,
      profile: user.profile,
    });

    return analysis;
  },

  async create({ user, payload }) {
    await cleanupAutoDeleteThoughts(user);

    const shouldBeConfidential = payload.confidential !== undefined ? payload.confidential : true;
    const allowSharing = shouldBeConfidential ? false : Boolean(payload.allowSharing);

    const analysis = await analyzeThought({
      userId: user._id.toString(),
      text: payload.text,
      category: payload.category,
      profile: user.profile,
    });

    const thought = await thoughtRepository.create({
      user: user._id,
      text: payload.text,
      category: payload.category,
      allowSharing,
      confidential: shouldBeConfidential,
      attachments: payload.attachments,
      revisitAt: payload.revisitAt || null,
      type: analysis.type,
      score: analysis.score,
      classification: analysis.classification,
      energyImpact: analysis.energyImpact,
      stressLevel: analysis.stressLevel,
      profileSignals: analysis.profileSignals,
      suggestion: analysis.suggestion,
      aiMeta: analysis.aiMeta,
      emotionalInsights: analysis.emotionalInsights,
    });

    await scheduleRevisitReminder({ thought, user });
    await thought.save();

    return normalizeThought(thought.toObject());
  },

  async list({ user, query }) {
    await cleanupAutoDeleteThoughts(user);
    return thoughtRepository.listByUser(user._id, query);
  },

  async getById({ user, thoughtId }) {
    await cleanupAutoDeleteThoughts(user);
    const thought = await thoughtRepository.findByIdForUser(thoughtId, user._id);
    if (!thought) {
      throw AppError.notFound("Thought not found.");
    }

    return normalizeThought(thought.toObject());
  },

  async update({ user, thoughtId, payload }) {
    await cleanupAutoDeleteThoughts(user);
    const thought = await thoughtRepository.findByIdForUser(thoughtId, user._id);
    if (!thought) {
      throw AppError.notFound("Thought not found.");
    }

    const nextText = payload.text ?? thought.text;
    const nextCategory = payload.category ?? thought.category;

    if (payload.text || payload.category) {
      const analysis = await analyzeThought({
        userId: user._id.toString(),
        text: nextText,
        category: nextCategory,
        profile: user.profile,
      });

      thought.type = analysis.type;
      thought.score = analysis.score;
      thought.classification = analysis.classification;
      thought.energyImpact = analysis.energyImpact;
      thought.stressLevel = analysis.stressLevel;
      thought.profileSignals = analysis.profileSignals;
      thought.suggestion = analysis.suggestion;
      thought.aiMeta = analysis.aiMeta;
      thought.emotionalInsights = analysis.emotionalInsights;
    }

    thought.text = nextText;
    thought.category = nextCategory;

    const nextConfidential =
      payload.confidential !== undefined ? payload.confidential : thought.confidential;
    const nextAllowSharing = nextConfidential
      ? false
      : payload.allowSharing !== undefined
        ? payload.allowSharing
        : thought.allowSharing;

    thought.confidential = nextConfidential;
    thought.allowSharing = nextAllowSharing;
    if (payload.attachments !== undefined) thought.attachments = payload.attachments;
    if (payload.revisitAt !== undefined) thought.revisitAt = payload.revisitAt;

    await scheduleRevisitReminder({ thought, user });
    await thought.save();

    return normalizeThought(thought.toObject());
  },

  async delete({ user, thoughtId }) {
    await cleanupAutoDeleteThoughts(user);
    const deleted = await thoughtRepository.deleteByIdForUser(thoughtId, user._id);
    if (!deleted) {
      throw AppError.notFound("Thought not found.");
    }

    return { id: deleted._id.toString() };
  },

  async deleteAll({ user }) {
    await cleanupAutoDeleteThoughts(user);
    const result = await thoughtRepository.deleteAllByUser(user._id);

    return {
      deletedCount: result.deletedCount || 0,
    };
  },

  async queueReanalysis({ user, thoughtId }) {
    const thought = await thoughtRepository.findByIdForUser(thoughtId, user._id);
    if (!thought) {
      throw AppError.notFound("Thought not found.");
    }

    const job = await queueManager.add(QUEUE_NAMES.AI_PROCESSING, {
      thoughtId: thought._id.toString(),
    });

    return {
      jobId: job.id,
      queueMode: job.mode,
    };
  },

  async queueDueReminders() {
    const dueThoughts = await thoughtRepository.findPendingRevisitsBefore(new Date());

    await Promise.all(
      dueThoughts.map((thought) =>
        queueManager.add(QUEUE_NAMES.REMINDERS, {
          thoughtId: thought._id.toString(),
          userId: thought.user.toString(),
        }),
      ),
    );

    return { queued: dueThoughts.length };
  },
};
