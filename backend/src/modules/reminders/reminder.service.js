import { Thought } from "../../models/Thought.js";
import { User } from "../../models/User.js";
import { AppError } from "../../core/errors/AppError.js";
import { queueManager } from "../../infrastructure/queue/queueManager.js";
import { QUEUE_NAMES } from "../../jobs/queueNames.js";

function buildDailySummaryEmail(fullName, thoughts) {
  const bulletRows = thoughts
    .slice(0, 5)
    .map((thought) => `- ${thought.category}: ${thought.text.slice(0, 90)}`)
    .join("\n");

  return {
    subject: "Chintana daily reflection reminder",
    text: `Hi ${fullName}, here are thoughts ready for revisit:\n${bulletRows}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;">
        <h2>Daily reflection reminder</h2>
        <p>Hi ${fullName},</p>
        <p>You have ${thoughts.length} thought(s) ready for revisit.</p>
        <ul>
          ${thoughts.slice(0, 5).map((thought) => `<li><strong>${thought.category}:</strong> ${thought.text.slice(0, 120)}</li>`).join("")}
        </ul>
      </div>
    `,
  };
}

function buildPromptEmail(fullName) {
  return {
    subject: "Chintana daily prompt",
    text: `Hi ${fullName}, take 2 minutes to capture today's most important thought.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;">
        <h2>Daily reflection prompt</h2>
        <p>Hi ${fullName},</p>
        <p>Take 2 minutes and capture your most important thought from today.</p>
      </div>
    `,
  };
}

export const reminderService = {
  async getUpcoming(userId) {
    const thoughts = await Thought.find({
      user: userId,
      revisitAt: { $gt: new Date() },
      reminderStatus: { $in: ["pending", "disabled"] },
    })
      .sort({ revisitAt: 1 })
      .limit(100)
      .lean();

    return thoughts;
  },

  async setRevisitDate({ userId, thoughtId, revisitAt }) {
    const thought = await Thought.findOne({ _id: thoughtId, user: userId });
    if (!thought) {
      throw AppError.notFound("Thought not found.");
    }

    thought.revisitAt = revisitAt;
    thought.reminderStatus = "pending";
    thought.reminderSentAt = null;
    await thought.save();

    await queueManager.add(
      QUEUE_NAMES.REMINDERS,
      { thoughtId: thought._id.toString(), userId: userId.toString() },
      { delayMs: Math.max(0, new Date(revisitAt).getTime() - Date.now()) },
    );

    return thought;
  },

  async runDailyReminderSweep() {
    const users = await User.find({
      "settings.notifications": true,
      "settings.reminderEmailEnabled": true,
      emailVerified: true,
    })
      .select("_id fullName email settings")
      .lean();

    let queued = 0;
    const currentUtcHour = new Date().getUTCHours();

    for (const user of users) {
      const thoughts = await Thought.find({
        user: user._id,
        revisitAt: { $lte: new Date() },
        reminderStatus: { $in: ["pending", "disabled"] },
      })
        .sort({ revisitAt: -1 })
        .limit(20)
        .lean();

      if (thoughts.length > 0) {
        const email = buildDailySummaryEmail(user.fullName, thoughts);
        await queueManager.add(QUEUE_NAMES.EMAIL, {
          to: user.email,
          ...email,
        });

        queued += 1;
        continue;
      }

      if (user.settings?.reminderHourUtc === currentUtcHour) {
        await queueManager.add(QUEUE_NAMES.EMAIL, {
          to: user.email,
          ...buildPromptEmail(user.fullName),
        });
        queued += 1;
      }
    }

    return { queuedUsers: queued };
  },
};
