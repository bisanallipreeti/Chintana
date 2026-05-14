import { Thought } from "../models/Thought.js";
import { catchAsync } from "../utils/catchAsync.js";

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDateKey(date) {
  return startOfDay(date).toISOString().slice(0, 10);
}

function formatDayLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
  }).format(date);
}

function formatDateRange(start, end) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

export const getDashboardSummary = catchAsync(async (req, res) => {
  const thoughts = await Thought.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
  const totalThoughts = thoughts.length;

  const constructiveCount = thoughts.filter((thought) => thought.type === "Constructive").length;
  const destructiveCount = thoughts.filter((thought) => thought.type === "Destructive").length;
  const neutralCount = thoughts.filter((thought) => thought.type === "Neutral").length;
  const averageScore = totalThoughts
    ? Math.round(thoughts.reduce((sum, thought) => sum + thought.score, 0) / totalThoughts)
    : null;

  const dailyMap = new Map();
  for (const thought of thoughts) {
    const dayKey = formatDateKey(new Date(thought.createdAt));
    const current = dailyMap.get(dayKey) || { sum: 0, count: 0 };
    current.sum += thought.score;
    current.count += 1;
    dailyMap.set(dayKey, current);
  }

  const today = startOfDay(new Date());
  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - index));
    return day;
  });
  const recentWindowHasActivity = last7Days.some((day) => dailyMap.has(formatDateKey(day)));

  const fallbackWindowEnd = thoughts.length > 0 ? startOfDay(new Date(thoughts[0].createdAt)) : today;
  const windowEnd = recentWindowHasActivity ? today : fallbackWindowEnd;
  const windowStart = new Date(windowEnd);
  windowStart.setDate(windowEnd.getDate() - 6);

  const weeklyCognitiveStability = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(windowStart);
    day.setDate(windowStart.getDate() + index);
    const bucket = dailyMap.get(formatDateKey(day));
    return {
      day: formatDayLabel(day),
      date: formatDateKey(day),
      score: bucket ? Math.round(bucket.sum / bucket.count) : null,
    };
  });

  const weeklyCognitiveStabilityMeta = recentWindowHasActivity
    ? {
        mode: "recent",
        title: "Last 7 Days",
        subtitle: `Including today (${formatDateRange(windowStart, windowEnd)})`,
      }
    : {
        mode: "activity",
        title: "Most Recent Activity Window",
        subtitle: `No thoughts in the last 7 days. Showing ${formatDateRange(windowStart, windowEnd)}.`,
      };

  const thoughtDistribution = [
    {
      name: "Constructive",
      value: totalThoughts ? Math.round((constructiveCount / totalThoughts) * 100) : null,
      count: constructiveCount,
    },
    {
      name: "Destructive",
      value: totalThoughts ? Math.round((destructiveCount / totalThoughts) * 100) : null,
      count: destructiveCount,
    },
    {
      name: "Neutral",
      value: totalThoughts ? Math.round((neutralCount / totalThoughts) * 100) : null,
      count: neutralCount,
    },
  ];

  // ── Mental Load Metrics ──────────────────────────────────────────────────
  const energizingCount = thoughts.filter((t) => t.energyImpact === "energizing").length;
  const drainingCount = thoughts.filter((t) => t.energyImpact === "draining").length;
  const neutralEnergyCount = thoughts.filter((t) => t.energyImpact === "neutral").length;

  const stressLevels = { minimal: 0, low: 0, moderate: 0, high: 0 };
  for (const thought of thoughts) {
    // Derive stress level from score to handle old thoughts missing stressLevel
    const level =
      thought.stressLevel && thought.stressLevel !== "low"
        ? thought.stressLevel
        : thought.score <= 35
          ? "high"
          : thought.score <= 55
            ? "moderate"
            : thought.score <= 75
              ? "low"
              : "minimal";
    stressLevels[level] = (stressLevels[level] || 0) + 1;
  }

  const mentalLoadScore = totalThoughts
    ? Math.round(
        100 -
          ((drainingCount * 2 + stressLevels.high * 3 + stressLevels.moderate * 1.5) /
            (totalThoughts * 3)) *
            100,
      )
    : null;

  // ── Category Breakdown ────────────────────────────────────────────────────
  const categoryMap = new Map();
  for (const thought of thoughts) {
    const existing = categoryMap.get(thought.category) || { count: 0, totalScore: 0 };
    existing.count += 1;
    existing.totalScore += thought.score;
    categoryMap.set(thought.category, existing);
  }

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      count: data.count,
      averageScore: Math.round(data.totalScore / data.count),
    }))
    .sort((a, b) => b.count - a.count);

  const profileContext = {
    fullName: req.user.profile?.fullName || req.user.fullName,
    occupation: req.user.profile?.occupation || "",
    education: req.user.profile?.education || "",
    city: req.user.profile?.city || "",
    countryIso: req.user.profile?.countryIso || "",
    emergencyContactsCount: req.user.profile?.emergencyContacts?.length || 0,
  };

  res.json({
    success: true,
    data: {
      totalThoughts,
      averageCognitiveScore: averageScore,
      weeklyCognitiveStability,
      weeklyCognitiveStabilityMeta,
      thoughtDistribution,
      mentalLoadMetrics: {
        mentalLoadScore: Math.max(0, Math.min(100, mentalLoadScore ?? 0)),
        energyDistribution: {
          energizing: energizingCount,
          neutral: neutralEnergyCount,
          draining: drainingCount,
        },
        stressLevels,
      },
      categoryBreakdown,
      profileContext,
      metrics: {
        constructiveCount,
        destructiveCount,
        neutralCount,
      },
      latestThoughts: thoughts.slice(0, 5),
    },
  });
});
