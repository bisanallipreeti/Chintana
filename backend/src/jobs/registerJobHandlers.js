import { queueManager } from "../infrastructure/queue/queueManager.js";
import { QUEUE_NAMES } from "./queueNames.js";
import { sendMail } from "../infrastructure/mail/mailer.js";
import { logger } from "../config/logger.js";
import { Thought } from "../models/Thought.js";
import { User } from "../models/User.js";
import { analyzeThought } from "../infrastructure/ai/thoughtAnalyzer.js";

function reminderEmailTemplate(fullName, thoughtText, revisitDate) {
  return {
    subject: "Chintana reminder: revisit your thought",
    text: `Hi ${fullName}, it is time to revisit your thought from ${revisitDate}: "${thoughtText.slice(0, 180)}"`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a;">
        <h2>Time to revisit your thought</h2>
        <p>Hi ${fullName},</p>
        <p>Here is your scheduled thought revisit:</p>
        <blockquote style="border-left:4px solid #3b82f6;padding-left:12px;">${thoughtText}</blockquote>
        <p>Recorded revisit date: ${revisitDate}</p>
      </div>
    `,
  };
}

export function registerJobHandlers() {
  queueManager.registerHandler(QUEUE_NAMES.EMAIL, async (payload) => {
    await sendMail(payload);
  });

  queueManager.registerHandler(QUEUE_NAMES.AI_PROCESSING, async (payload) => {
    const thought = await Thought.findById(payload.thoughtId).populate("user");
    if (!thought || !thought.user) {
      return;
    }

    const analysis = await analyzeThought({
      userId: thought.user._id.toString(),
      text: thought.text,
      category: thought.category,
      profile: thought.user.profile || {},
    });

    thought.type = analysis.type;
    thought.score = analysis.score;
    thought.classification = analysis.classification;
    thought.energyImpact = analysis.energyImpact;
    thought.suggestion = analysis.suggestion;
    thought.stressLevel = analysis.stressLevel;
    thought.profileSignals = analysis.profileSignals;
    thought.aiMeta = analysis.aiMeta;

    await thought.save();
  });

  queueManager.registerHandler(QUEUE_NAMES.REMINDERS, async (payload) => {
    const thought = await Thought.findById(payload.thoughtId);
    const user = await User.findById(payload.userId);

    if (!thought || !user) {
      return;
    }

    if (!user.settings?.notifications || !user.settings?.reminderEmailEnabled) {
      thought.reminderStatus = "disabled";
      await thought.save();
      return;
    }

    const template = reminderEmailTemplate(
      user.fullName,
      thought.text,
      thought.revisitAt ? new Date(thought.revisitAt).toLocaleString() : "today",
    );

    await sendMail({
      to: user.email,
      ...template,
    });

    thought.reminderStatus = "sent";
    thought.reminderSentAt = new Date();
    await thought.save();
  });

  logger.info("Background queue handlers registered", queueManager.getHealth());
}
