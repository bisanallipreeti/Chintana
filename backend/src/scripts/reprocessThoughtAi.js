import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

import { Thought } from "../models/Thought.js";
import { User } from "../models/User.js";
import { analyzeThought } from "../infrastructure/ai/thoughtAnalyzer.js";

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("MONGODB_URI is required.");
  process.exit(1);
}

const limit = Number(process.env.REPROCESS_LIMIT || 0);
const userIdFilter = String(process.env.REPROCESS_USER_ID || "").trim();

async function run() {
  await mongoose.connect(mongoUri, {
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 10000,
  });

  const thoughtFilter = userIdFilter ? { user: userIdFilter } : {};
  const query = Thought.find(thoughtFilter).sort({ createdAt: -1 });
  if (Number.isFinite(limit) && limit > 0) {
    query.limit(limit);
  }

  const thoughts = await query.exec();
  console.log(`Found ${thoughts.length} thought(s) to reprocess.`);

  const userCache = new Map();
  let updatedCount = 0;
  let failedCount = 0;

  for (const thought of thoughts) {
    try {
      const ownerId = thought.user?.toString?.() || "";
      if (!ownerId) continue;

      let owner = userCache.get(ownerId);
      if (!owner) {
        owner = await User.findById(ownerId).lean();
        userCache.set(ownerId, owner || null);
      }

      const profile = owner?.profile || {};
      const analysis = await analyzeThought({
        userId: `reprocess-${ownerId}-${thought._id.toString()}`,
        text: thought.text,
        category: thought.category,
        profile,
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

      await thought.save();
      updatedCount += 1;
    } catch (error) {
      failedCount += 1;
      console.error(`Failed thought ${thought._id}: ${error.message}`);
    }
  }

  console.log(`Reprocess completed. Updated: ${updatedCount}, Failed: ${failedCount}`);
}

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Reprocess failed:", error.message);
    try {
      await mongoose.disconnect();
    } catch {
      // Ignore disconnect errors in failure path.
    }
    process.exit(1);
  });
