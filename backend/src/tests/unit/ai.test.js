import { analyzeThought } from "../../infrastructure/ai/thoughtAnalyzer.js";

describe("Thought AI analyzer", () => {
  it("returns a validated analysis shape", async () => {
    const result = await analyzeThought({
      userId: "test-user",
      text: "I want to improve my focus and energy this week.",
      category: "Personal",
      profile: { occupation: "Engineer" },
    });

    expect(result).toHaveProperty("type");
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("classification");
    expect(result).toHaveProperty("suggestion");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("uses cache for identical requests", async () => {
    const payload = {
      userId: "cache-user",
      text: "I am calm and making steady progress.",
      category: "Career",
      profile: {},
    };

    const first = await analyzeThought(payload);
    const second = await analyzeThought(payload);

    expect(first.aiMeta.cacheHit).toBe(false);
    expect(second.aiMeta.cacheHit).toBe(true);
  });
});
