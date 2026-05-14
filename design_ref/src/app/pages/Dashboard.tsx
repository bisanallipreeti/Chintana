import { useNavigate } from "react-router";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Brain,
  Sparkles,
  Clock,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Mock data
const weeklyData = [
  { day: "Mon", score: 72 },
  { day: "Tue", score: 68 },
  { day: "Wed", score: 75 },
  { day: "Thu", score: 82 },
  { day: "Fri", score: 79 },
  { day: "Sat", score: 85 },
  { day: "Sun", score: 88 },
];

const thoughtDistribution = [
  { name: "Constructive", value: 65, color: "#10b981" },
  { name: "Destructive", value: 20, color: "#ef4444" },
  { name: "Neutral", value: 15, color: "#f59e0b" },
];

const recentThoughts = [
  {
    id: 1,
    text: "New business strategy for Q2 expansion",
    category: "Business",
    type: "Strategic Idea",
    score: 92,
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    text: "Worried about project deadline approaching",
    category: "Emotional",
    type: "Emotional Reaction",
    score: 35,
    timestamp: "5 hours ago",
  },
  {
    id: 3,
    text: "Ideas for improving team collaboration",
    category: "IT",
    type: "Constructive",
    score: 88,
    timestamp: "1 day ago",
  },
];

export function Dashboard() {
  const navigate = useNavigate();
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good Morning"
      : currentHour < 18
      ? "Good Afternoon"
      : "Good Evening";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8 lg:py-8 space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              {greeting}, XYZ
            </h1>
            <p className="text-gray-600 mt-1">
              Your cognitive wellness dashboard
            </p>
          </div>
          <button
            onClick={() => navigate("/app/add-thought")}
            className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-violet-700 transition-all shadow-lg shadow-blue-500/30"
          >
            <Plus className="w-5 h-5" />
            Add Thought
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {/* Mental Load */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Mental Load
                </p>
                <p className="text-3xl font-bold text-gray-900">68%</p>
              </div>
              <div className="w-16 h-16 relative">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="6"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="6"
                    strokeDasharray={`${68 * 1.76} ${100 * 1.76}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 text-green-600">
                <TrendingDown className="w-4 h-4" />
                <span className="font-medium">-5%</span>
              </div>
              <span className="text-gray-500">vs last week</span>
            </div>
          </div>

          {/* Cognitive Score */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Avg Cognitive Score
                </p>
                <p className="text-3xl font-bold text-gray-900">82</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium">+12%</span>
              </div>
              <span className="text-gray-500">vs last week</span>
            </div>
          </div>

          {/* Thought Ratio */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Constructive Ratio
                </p>
                <p className="text-3xl font-bold text-gray-900">3.25:1</p>
              </div>
              <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-violet-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                  style={{ width: "76%" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Weekly Cognitive Stability */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Weekly Cognitive Stability
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: "#3b82f6", r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Thought Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Thought Distribution
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={thoughtDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {thoughtDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {thoughtDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Thoughts */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Thoughts
            </h2>
            <button
              onClick={() => navigate("/app/history")}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentThoughts.map((thought) => (
              <div
                key={thought.id}
                onClick={() => navigate(`/app/analysis/${thought.id}`)}
                className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-gray-900 mb-2">{thought.text}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {thought.category}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          thought.score >= 70
                            ? "bg-green-100 text-green-700"
                            : thought.score >= 50
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {thought.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {thought.timestamp}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${
                        thought.score >= 70
                          ? "text-green-600"
                          : thought.score >= 50
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {thought.score}
                    </div>
                    <p className="text-xs text-gray-500">Score</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={() => navigate("/app/add-thought")}
        className="lg:hidden fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center hover:shadow-xl transition-all z-30"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
