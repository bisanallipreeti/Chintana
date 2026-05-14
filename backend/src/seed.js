import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

import { User } from "./models/User.js";
import { Thought } from "./models/Thought.js";

// Make sure we have the DB URI
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/neurosync";

const categories = ["Personal", "Career", "Health", "Relationship", "Financial", "Education", "Business", "Others"];
const types = ["Constructive", "Destructive", "Neutral"];

const constructiveTexts = [
  "I am planning to improve my skills and build a better portfolio.",
  "Feeling great today, got a lot of work done and learned new things.",
  "I created a solid plan for my financial future and feel optimistic.",
  "Excited about the new project we are starting at work.",
  "Had a very healthy and productive day, focused on my main goals.",
  "I finally found a solution to that bug I was stuck on. Feels amazing!",
  "Going to the gym really helped me feel calm and centered.",
];

const destructiveTexts = [
  "I am feeling worried, stressed, and stuck in my career.",
  "Everything seems awful and I feel totally drained.",
  "I'm so angry and frustrated about the late delivery.",
  "Overthinking every little detail is making me anxious and tired.",
  "I feel lonely and sad, like I have no support system.",
  "This problem feels hopeless, I might just give up and fail.",
  "Terrible day at work, lost all my progress.",
];

const neutralTexts = [
  "Just a normal day, nothing much to say.",
  "Went to the grocery store and bought some vegetables.",
  "Read a few pages of a book today.",
  "Watched a movie in the evening.",
  "Replied to some emails and organized my desk.",
  "It is raining outside, just staying indoors.",
  "Ate lunch at the usual time, the food was okay.",
];

const seedDB = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB at", mongoUri);

    await User.deleteMany({});
    await Thought.deleteMany({});
    console.log("Cleared existing data");

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("password123", salt);

    const testUser = await User.create({
      fullName: "Demo User",
      email: "demo@example.com",
      passwordHash,
      emailVerified: true,
      profile: {
        occupation: "Software Engineer",
        education: "Bachelor's",
        city: "San Francisco",
        countryIso: "US",
      }
    });

    console.log("Created demo user: demo@example.com / password123");

    // Generate 60 random thoughts for the past 30 days
    const thoughts = [];
    const now = new Date();
    
    for (let i = 0; i < 60; i++) {
       const daysAgo = Math.floor(Math.random() * 30);
       const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
       
       // Add some daily variance to hours
       date.setHours(Math.floor(Math.random() * 14) + 8); // Between 8 AM and 10 PM
       
       const type = types[Math.floor(Math.random() * types.length)];
       let text, energyImpact, score, classification, suggestion;

       if (type === "Constructive") {
          text = constructiveTexts[Math.floor(Math.random() * constructiveTexts.length)];
          energyImpact = "energizing";
          score = Math.floor(Math.random() * 30) + 70; // 70-100
          classification = "Constructive Reflection";
          suggestion = "Keep up the good momentum. Capture the next action.";
       } else if (type === "Destructive") {
          text = destructiveTexts[Math.floor(Math.random() * destructiveTexts.length)];
          energyImpact = "draining";
          score = Math.floor(Math.random() * 45); // 0-45
          classification = "Stress Pattern";
          suggestion = "Take a break and clear your head. Try reframing the concern.";
       } else {
          text = neutralTexts[Math.floor(Math.random() * neutralTexts.length)];
          energyImpact = "neutral";
          score = Math.floor(Math.random() * 24) + 46; // 46-69
          classification = "Balanced Observation";
          suggestion = "Add more context if you want deeper insight.";
       }

       thoughts.push({
         user: testUser._id,
         text,
         category: categories[Math.floor(Math.random() * categories.length)],
         type,
         score,
         classification,
         energyImpact,
         stressLevel: score <= 35 ? "high" : score <= 55 ? "moderate" : score <= 75 ? "low" : "minimal",
         suggestion,
         createdAt: date,
         updatedAt: date
       });
    }

    await Thought.insertMany(thoughts);
    console.log(`Inserted ${thoughts.length} mock thoughts`);

    console.log("✅ Seed complete! You can now log in with demo@example.com / password123");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding DB:", error);
    process.exit(1);
  }
};

seedDB();
