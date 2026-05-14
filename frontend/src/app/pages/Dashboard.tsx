import { useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Plus,
  Sparkles,
  Brain,
  Zap,
  BatteryLow,
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getDisplayName, useAppContext } from "../context/AppContext";
import { formatThoughtTimestamp } from "../lib/thoughts";
import { CardSkeleton, ChartSkeleton } from "../components/Skeleton";
import { useTheme } from "../context/ThemeContext";

const distributionColors = {
  Constructive: "#10b981",
  Destructive: "#ef4444",
  Neutral: "#f59e0b",
};

export function Dashboard() {
  const navigate = useNavigate();
  const { currentAccount, currentThoughts, dashboardSummary, isBootstrapping } = useAppContext();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? "Good Morning" : currentHour < 18 ? "Good Afternoon" : "Good Evening";

  const isLoading = isBootstrapping || (!dashboardSummary && currentThoughts.length === 0);

  const dashboardData = useMemo(
    () => {
      const mentalLoadMetrics = dashboardSummary?.mentalLoadMetrics;
      const mentalLoad = mentalLoadMetrics
        ? {
            mentalLoadScore: Number(mentalLoadMetrics.mentalLoadScore ?? 0),
            energyDistribution: {
              energizing: Number(mentalLoadMetrics.energyDistribution?.energizing ?? 0),
              neutral: Number(mentalLoadMetrics.energyDistribution?.neutral ?? 0),
              draining: Number(mentalLoadMetrics.energyDistribution?.draining ?? 0),
            },
            stressLevels: {
              minimal: Number(mentalLoadMetrics.stressLevels?.minimal ?? 0),
              low: Number(mentalLoadMetrics.stressLevels?.low ?? 0),
              moderate: Number(mentalLoadMetrics.stressLevels?.moderate ?? 0),
              high: Number(mentalLoadMetrics.stressLevels?.high ?? 0),
            },
          }
        : null;

      return {
        totalThoughts: dashboardSummary?.totalThoughts ?? currentThoughts.length,
        averageScore: dashboardSummary?.averageCognitiveScore ?? null,
        weeklyScores: dashboardSummary?.weeklyCognitiveStability ?? [],
        weeklyScoreMeta: dashboardSummary?.weeklyCognitiveStabilityMeta ?? {
          mode: "recent",
          title: "Last 7 Days",
          subtitle: "Including today",
        },
        distribution:
          dashboardSummary?.thoughtDistribution?.map((item) => ({
            ...item,
            color: distributionColors[item.name as keyof typeof distributionColors],
          })) ?? [],
        recentThoughts: dashboardSummary?.latestThoughts ?? [],
        mentalLoad,
        categoryBreakdown: dashboardSummary?.categoryBreakdown ?? [],
      };
    },
    [currentThoughts.length, dashboardSummary],
  );

  const axisColor = isDark ? "#9ca3af" : "#9ca3af";
  const gridColor = isDark ? "#374151" : "#e5e7eb";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8 lg:py-8 space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="lg:col-span-2"><ChartSkeleton /></div>
            <CardSkeleton lines={4} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8 lg:py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {greeting}, {getDisplayName(currentAccount)}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Your cognitive wellness dashboard</p>
          </div>
          <button
            onClick={() => navigate("/app/add-thought")}
            className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-violet-700 transition-all shadow-lg shadow-blue-500/30"
          >
            <Plus className="w-5 h-5" />
            Add Thought
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <MetricCard
            label="Average Cognitive Score"
            value={dashboardData.averageScore === null ? "-" : `${dashboardData.averageScore}`}
            icon={<Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />}
            iconClass="bg-green-100 dark:bg-green-950"
            footer={dashboardData.totalThoughts ? "Calculated from analyzed thoughts" : "No thought data yet"}
          />
        </div>

        {/* Mental Load Energy Strip */}
        {dashboardData.mentalLoad && dashboardData.totalThoughts > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Energy & Stress Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-xl text-center">
                <Zap className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{dashboardData.mentalLoad.energyDistribution.energizing}</p>
                <p className="text-sm text-green-600 dark:text-green-500">Energizing</p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-xl text-center">
                <Sparkles className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{dashboardData.mentalLoad.energyDistribution.neutral}</p>
                <p className="text-sm text-yellow-600 dark:text-yellow-500">Neutral</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-xl text-center">
                <BatteryLow className="w-6 h-6 text-red-600 dark:text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{dashboardData.mentalLoad.energyDistribution.draining}</p>
                <p className="text-sm text-red-600 dark:text-red-500">Draining</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-xl text-center">
                <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {dashboardData.mentalLoad.stressLevels.high + dashboardData.mentalLoad.stressLevels.moderate}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-500">High/Mod Stress</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Weekly Cognitive Stability</h2>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">{dashboardData.weeklyScoreMeta.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{dashboardData.weeklyScoreMeta.subtitle}</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dashboardData.weeklyScores}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="day" stroke={axisColor} fontSize={12} />
                <YAxis stroke={axisColor} fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? "#1f2937" : "#fff", border: `1px solid ${gridColor}`, borderRadius: 8, color: isDark ? "#f3f4f6" : "#111827" }} />
                {dashboardData.totalThoughts > 0 && (
                  <Line
                    type="monotone"
                    dataKey="score"
                    connectNulls={false}
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: "#3b82f6", r: 5 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
            {dashboardData.totalThoughts === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Your weekly chart will appear after you add and analyze thoughts.
              </p>
            )}
            {dashboardData.totalThoughts > 0 && dashboardData.weeklyScoreMeta.mode === "activity" && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                There was no activity in the last 7 days, so this chart is showing the most recent week that includes saved thoughts.
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Thought Distribution</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={
                    dashboardData.totalThoughts > 0
                      ? dashboardData.distribution.map((item) => ({ ...item, value: item.value ?? 0 }))
                      : [{ name: "Empty", value: 100, color: isDark ? "#374151" : "#e5e7eb" }]
                  }
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {(dashboardData.totalThoughts > 0
                    ? dashboardData.distribution
                    : [{ name: "Empty", color: isDark ? "#374151" : "#e5e7eb", value: 100 }]
                  ).map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {dashboardData.distribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.value === null ? "-" : `${item.value}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {dashboardData.categoryBreakdown.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Category Breakdown</h2>
            <ResponsiveContainer width="100%" height={Math.max(200, dashboardData.categoryBreakdown.length * 40)}>
              <BarChart data={dashboardData.categoryBreakdown} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis type="number" domain={[0, 100]} stroke={axisColor} fontSize={12} />
                <YAxis dataKey="category" type="category" stroke={axisColor} fontSize={12} width={75} />
                <Tooltip formatter={(value: number) => [`${value}`, "Avg Score"]} contentStyle={{ backgroundColor: isDark ? "#1f2937" : "#fff", border: `1px solid ${gridColor}`, borderRadius: 8, color: isDark ? "#f3f4f6" : "#111827" }} />
                <Bar dataKey="averageScore" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Thoughts</h2>
            <button
              onClick={() => navigate("/app/history")}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              View All
            </button>
          </div>

          {dashboardData.recentThoughts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-6 py-10 text-center">
              <p className="text-gray-700 dark:text-gray-300 font-medium">No thoughts created yet.</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Add your first thought to start building your history and analysis.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.recentThoughts.map((thought) => (
                <div
                  key={thought.id}
                  onClick={() => navigate(`/app/analysis/${thought.id}`)}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">{thought.text}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-xs font-medium rounded">
                          {thought.category}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {thought.type}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatThoughtTimestamp(thought.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{thought.score}</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Score</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => navigate("/app/add-thought")}
        className="lg:hidden fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center hover:shadow-xl transition-all z-30"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  iconClass,
  footer,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconClass: string;
  footer: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
        <div className={`w-12 h-12 ${iconClass} rounded-full flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{footer}</p>
    </div>
  );
}
