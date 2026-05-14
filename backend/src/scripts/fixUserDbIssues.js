import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

import { User } from "../models/User.js";

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("MONGODB_URI is required.");
  process.exit(1);
}

async function assertNoDuplicateEmails() {
  const duplicates = await User.aggregate([
    {
      $group: {
        _id: "$email",
        count: { $sum: 1 },
        ids: { $push: "$_id" },
      },
    },
    { $match: { count: { $gt: 1 } } },
    { $limit: 20 },
  ]);

  if (!duplicates.length) {
    console.log("No duplicate emails found.");
    return;
  }

  console.error("Duplicate emails found (manual resolution required):");
  for (const row of duplicates) {
    console.error(`- ${row._id}: ${row.count} docs`);
  }

  throw new Error("Duplicate email records must be resolved before index repair.");
}

async function assertNoDuplicateGoogleSubjects() {
  const duplicates = await User.aggregate([
    {
      $match: {
        "googleAuth.subject": { $exists: true, $type: "string", $gt: "" },
      },
    },
    {
      $group: {
        _id: "$googleAuth.subject",
        count: { $sum: 1 },
        ids: { $push: "$_id" },
      },
    },
    { $match: { count: { $gt: 1 } } },
    { $limit: 20 },
  ]);

  if (!duplicates.length) {
    console.log("No duplicate Google subjects found.");
    return;
  }

  console.error("Duplicate non-empty googleAuth.subject values found:");
  for (const row of duplicates) {
    console.error(`- ${row._id}: ${row.count} docs`);
  }

  throw new Error("Duplicate Google subject records must be resolved before index repair.");
}

async function cleanupGoogleSubjectDefaults() {
  const result = await User.updateMany(
    { "googleAuth.subject": "" },
    { $unset: { "googleAuth.subject": "" } },
  );

  console.log(`Unset empty googleAuth.subject on ${result.modifiedCount} user(s).`);

  const removeEmptyGoogleAuth = await User.updateMany(
    {
      $or: [
        { googleAuth: { $exists: false } },
        {
          "googleAuth.subject": { $exists: false },
          "googleAuth.email": { $exists: false },
          "googleAuth.name": { $exists: false },
          "googleAuth.picture": { $exists: false },
        },
      ],
    },
    { $unset: { googleAuth: "" } },
  );

  console.log(`Removed empty googleAuth objects on ${removeEmptyGoogleAuth.modifiedCount} user(s).`);
}

async function rebuildGoogleSubjectUniqueIndex() {
  const collection = User.collection;
  const indexes = await collection.indexes();
  const desiredName = "googleAuth_subject_unique_nonempty";
  const desiredPartial = {
    "googleAuth.subject": { $exists: true, $type: "string", $gt: "" },
  };

  const sameKeyIndexes = indexes.filter(
    (idx) =>
      idx?.key &&
      Object.keys(idx.key).length === 1 &&
      idx.key["googleAuth.subject"] === 1,
  );

  const alreadyDesired = sameKeyIndexes.find(
    (idx) =>
      idx.unique === true &&
      JSON.stringify(idx.partialFilterExpression || {}) === JSON.stringify(desiredPartial),
  );

  if (alreadyDesired) {
    console.log(`Index already valid: ${alreadyDesired.name}`);
    if (alreadyDesired.name !== desiredName) {
      console.log(
        `Keeping existing index name '${alreadyDesired.name}' (functionally equivalent).`,
      );
    }
    return;
  }

  for (const idx of sameKeyIndexes) {
    await collection.dropIndex(idx.name);
    console.log(`Dropped conflicting index: ${idx.name}`);
  }

  await collection.createIndex(
    { "googleAuth.subject": 1 },
    {
      name: desiredName,
      unique: true,
      partialFilterExpression: desiredPartial,
    },
  );

  console.log(`Created index: ${desiredName}`);
}

async function run() {
  await mongoose.connect(mongoUri, {
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 10000,
  });

  console.log("Connected to MongoDB.");

  await assertNoDuplicateEmails();
  await assertNoDuplicateGoogleSubjects();
  await cleanupGoogleSubjectDefaults();
  await rebuildGoogleSubjectUniqueIndex();

  const indexes = await User.collection.indexes();
  console.log("Current user indexes:");
  for (const idx of indexes) {
    console.log(`- ${idx.name}`);
  }
}

run()
  .then(async () => {
    await mongoose.disconnect();
    console.log("DB fix completed successfully.");
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("DB fix failed:", error.message);
    try {
      await mongoose.disconnect();
    } catch {
      // Ignore disconnect errors in failure path.
    }
    process.exit(1);
  });
