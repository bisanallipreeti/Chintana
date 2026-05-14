import { Thought } from "../../models/Thought.js";

const AUTO_DELETE_DAYS = 2;
const AUTO_DELETE_SCORE_THRESHOLD = 30;

function formatDateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function formatDayLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
  }).format(date);
}

function formatMonthLabel(dateKey) {
  const date = new Date(`${dateKey}-01T00:00:00.000Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function getWeekKey(dateValue) {
  const day = new Date(dateValue);
  const utcDay = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() - (utcDay - 1));
  day.setUTCHours(0, 0, 0, 0);
  return day.toISOString().slice(0, 10);
}

function getWeekLabel(weekKey) {
  const weekStartDate = new Date(`${weekKey}T00:00:00.000Z`);
  return `Week of ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(weekStartDate)}`;
}

function normalizeDistribution(distribution, totalThoughts) {
  const map = new Map(distribution.map((item) => [item._id, item.count]));

  return ["Constructive", "Destructive", "Neutral"].map((name) => {
    const count = map.get(name) || 0;
    return {
      name,
      count,
      value: totalThoughts ? Math.round((count / totalThoughts) * 100) : null,
    };
  });
}

function detectPatterns(thoughts = []) {
  if (thoughts.length === 0) {
    return {
      dominantCategory: null,
      destructiveStreak: 0,
      momentumTrend: "stable",
      insights: [],
    };
  }

  const categoryCount = new Map();
  thoughts.forEach((thought) => {
    const current = categoryCount.get(thought.category) || 0;
    categoryCount.set(thought.category, current + 1);
  });

  let dominantCategory = null;
  let dominantCount = 0;
  for (const [category, count] of categoryCount.entries()) {
    if (count > dominantCount) {
      dominantCategory = category;
      dominantCount = count;
    }
  }

  const newestFirst = [...thoughts].sort(
    (left, right) => +new Date(right.createdAt) - +new Date(left.createdAt),
  );

  let destructiveStreak = 0;
  for (const thought of newestFirst) {
    if (thought.type !== "Destructive") break;
    destructiveStreak += 1;
  }

  const newestWindow = newestFirst.slice(0, 7);
  const previousWindow = newestFirst.slice(7, 14);

  const newestAvg =
    newestWindow.length > 0
      ? newestWindow.reduce((sum, thought) => sum + thought.score, 0) / newestWindow.length
      : null;
  const previousAvg =
    previousWindow.length > 0
      ? previousWindow.reduce((sum, thought) => sum + thought.score, 0) / previousWindow.length
      : null;

  let momentumTrend = "stable";
  if (newestAvg !== null && previousAvg !== null) {
    if (newestAvg - previousAvg >= 5) momentumTrend = "improving";
    else if (previousAvg - newestAvg >= 5) momentumTrend = "declining";
  }

  const insights = [];
  if (dominantCategory && dominantCount >= 3) {
    insights.push(`Most recurring category this period: ${dominantCategory}.`);
  }
  if (destructiveStreak >= 3) {
    insights.push("You have a recent destructive streak. Consider a guided reframe session.");
  }
  if (momentumTrend === "improving") {
    insights.push("Your recent scores are trending upward.");
  }
  if (momentumTrend === "declining") {
    insights.push("Recent scores show a downward trend. Prioritize shorter reflection loops.");
  }

  return {
    dominantCategory,
    destructiveStreak,
    momentumTrend,
    insights,
  };
}

export const dashboardService = {
  async getSummary(user) {
    const userId = user._id;

    if (user?.settings?.autoDelete) {
      const cutoffDate = new Date(Date.now() - AUTO_DELETE_DAYS * 24 * 60 * 60 * 1000);
      await Thought.deleteMany({
        user: userId,
        score: { $lt: AUTO_DELETE_SCORE_THRESHOLD },
        createdAt: { $lte: cutoffDate },
      });
    }

    const [
      overviewAgg,
      latestThoughts,
      categoryBreakdown,
      dailyAggregate,
      monthlyAggregate,
      stressAgg,
      energyAgg,
      recentPatternWindow,
    ] = await Promise.all([
      Thought.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            totalThoughts: { $sum: 1 },
            averageCognitiveScore: { $avg: "$score" },
            constructiveCount: {
              $sum: { $cond: [{ $eq: ["$type", "Constructive"] }, 1, 0] },
            },
            destructiveCount: {
              $sum: { $cond: [{ $eq: ["$type", "Destructive"] }, 1, 0] },
            },
            neutralCount: {
              $sum: { $cond: [{ $eq: ["$type", "Neutral"] }, 1, 0] },
            },
          },
        },
      ]),

      Thought.find({ user: userId }).sort({ createdAt: -1 }).limit(5).lean(),

      Thought.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            averageScore: { $avg: "$score" },
          },
        },
        { $sort: { count: -1 } },
        {
          $project: {
            _id: 0,
            category: "$_id",
            count: 1,
            averageScore: { $round: ["$averageScore", 0] },
          },
        },
      ]),

      Thought.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            scoreSum: { $sum: "$score" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Thought.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m", date: "$createdAt" },
            },
            scoreSum: { $sum: "$score" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Thought.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: "$stressLevel",
            count: { $sum: 1 },
          },
        },
      ]),

      Thought.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: "$energyImpact",
            count: { $sum: 1 },
          },
        },
      ]),

      Thought.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(30)
        .select("category type score createdAt")
        .lean(),
    ]);

    const base = overviewAgg[0] || {
      totalThoughts: 0,
      averageCognitiveScore: null,
      constructiveCount: 0,
      destructiveCount: 0,
      neutralCount: 0,
    };

    const distributionRaw = [
      { _id: "Constructive", count: base.constructiveCount },
      { _id: "Destructive", count: base.destructiveCount },
      { _id: "Neutral", count: base.neutralCount },
    ];

    const thoughtDistribution = normalizeDistribution(distributionRaw, base.totalThoughts);

    const dailyMap = new Map(
      dailyAggregate.map((item) => [
        item._id,
        {
          score: Math.round(item.scoreSum / item.count),
          count: item.count,
        },
      ]),
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weeklyTrend = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (6 - index));
      const key = formatDateKey(day);
      const bucket = dailyMap.get(key);

      return {
        day: formatDayLabel(day),
        date: key,
        score: bucket ? bucket.score : null,
      };
    });

    const monthlyTrend = monthlyAggregate
      .slice(-6)
      .map((item) => ({
        month: formatMonthLabel(item._id),
        key: item._id,
        score: Math.round(item.scoreSum / item.count),
        count: item.count,
      }));

    const dailyStabilitySeries = dailyAggregate.map((item) => {
      const weekKey = getWeekKey(`${item._id}T00:00:00.000Z`);
      return {
        date: item._id,
        day: formatDayLabel(new Date(`${item._id}T00:00:00.000Z`)),
        score: Math.round(item.scoreSum / item.count),
        count: item.count,
        weekKey,
        weekLabel: getWeekLabel(weekKey),
      };
    });

    const stressLevels = { minimal: 0, low: 0, moderate: 0, high: 0 };
    stressAgg.forEach((item) => {
      if (item._id && stressLevels[item._id] !== undefined) {
        stressLevels[item._id] = item.count;
      }
    });

    const energyDistribution = { energizing: 0, neutral: 0, draining: 0 };
    energyAgg.forEach((item) => {
      if (item._id && energyDistribution[item._id] !== undefined) {
        energyDistribution[item._id] = item.count;
      }
    });

    const mentalStabilityScore = base.totalThoughts
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              (base.averageCognitiveScore || 0) -
                (stressLevels.high * 2 + stressLevels.moderate) /
                  Math.max(1, base.totalThoughts) *
                  15,
            ),
          ),
        )
      : null;

    const patternDetection = detectPatterns(recentPatternWindow);

    return {
      totalThoughts: base.totalThoughts,
      averageCognitiveScore: base.averageCognitiveScore
        ? Math.round(base.averageCognitiveScore)
        : null,
      weeklyCognitiveStability: weeklyTrend,
      weeklyCognitiveStabilityMeta: {
        title: "Last 7 Days",
        subtitle: "Rolling daily trend",
      },
      monthlyCognitiveStability: monthlyTrend,
      dailyStabilitySeries,
      thoughtDistribution,
      mentalLoadMetrics: {
        // Frontend expects mentalLoadScore + energyDistribution.
        mentalLoadScore: mentalStabilityScore,
        mentalStabilityScore,
        energyDistribution,
        stressLevels,
      },
      patternDetection,
      categoryBreakdown,
      metrics: {
        constructiveCount: base.constructiveCount,
        destructiveCount: base.destructiveCount,
        neutralCount: base.neutralCount,
      },
      latestThoughts,
      profileContext: {
        fullName: user.profile?.fullName || user.fullName,
        occupation: user.profile?.occupation || "",
        education: user.profile?.education || "",
        city: user.profile?.city || "",
        countryIso: user.profile?.countryIso || "",
      },
    };
  },
};
