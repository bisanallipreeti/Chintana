import { useNavigate, useParams } from "react-router";
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  Battery,
  BatteryMedium,
  BatteryLow,
  Share2,
  Edit,
  Trash2,
  ArrowLeft,
  Lightbulb,
  Bell,
  Mail,
  MessageCircle,
  Facebook,
  Twitter,
  Linkedin,
} from "lucide-react";
import { toast } from "sonner";

// Mock data based on ID
const thoughtData: Record<string, any> = {
  "1": {
    text: "New business strategy for Q2 expansion",
    category: "Business",
    classification: "Strategic Idea",
    type: "constructive",
    score: 92,
    energyImpact: "energizing",
    suggestion: "Excellent strategic thinking! Document this in detail and share with stakeholders.",
    timestamp: "2 hours ago",
  },
  "2": {
    text: "Worried about project deadline approaching",
    category: "Emotional",
    classification: "Emotional Reaction",
    type: "destructive",
    score: 35,
    energyImpact: "draining",
    suggestion: "Break down the project into smaller tasks. Consider delegating or requesting a timeline review.",
    timestamp: "5 hours ago",
  },
  new: {
    text: "Your recently captured thought",
    category: "Personal",
    classification: "Constructive",
    type: "constructive",
    score: 78,
    energyImpact: "energizing",
    suggestion: "This is a positive thought pattern. Keep nurturing this mindset.",
    timestamp: "Just now",
  },
};

export function ThoughtAnalysis() {
  const navigate = useNavigate();
  const { id } = useParams();
  const thought = thoughtData[id || "new"];

  const handleShare = (platform: string) => {
    toast.success(`Sharing to ${platform}`);
  };

  const handleEdit = () => {
    toast.info("Edit functionality");
  };

  const handleDelete = () => {
    toast.success("Thought deleted");
    navigate("/app/history");
  };

  const handleConvertToReminder = () => {
    toast.success("Converted to reminder");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        {/* Analysis Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header with Classification */}
          <div
            className={`p-6 ${
              thought.type === "constructive"
                ? "bg-gradient-to-r from-green-50 to-emerald-50"
                : thought.type === "destructive"
                ? "bg-gradient-to-r from-red-50 to-orange-50"
                : "bg-gradient-to-r from-yellow-50 to-amber-50"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  thought.type === "constructive"
                    ? "bg-green-100"
                    : thought.type === "destructive"
                    ? "bg-red-100"
                    : "bg-yellow-100"
                }`}
              >
                {thought.type === "constructive" ? (
                  <CheckCircle2
                    className={`w-8 h-8 ${
                      thought.type === "constructive"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  />
                ) : thought.type === "destructive" ? (
                  <XCircle className="w-8 h-8 text-red-600" />
                ) : (
                  <MinusCircle className="w-8 h-8 text-yellow-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {thought.classification}
                    </h1>
                    <p className="text-gray-600">{thought.timestamp}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      thought.type === "constructive"
                        ? "bg-green-100 text-green-700"
                        : thought.type === "destructive"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {thought.category}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Thought Content */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-sm font-medium text-gray-700 mb-3">
              Your Thought
            </h2>
            <p className="text-lg text-gray-900 leading-relaxed">
              {thought.text}
            </p>
          </div>

          {/* Analysis Metrics */}
          <div className="p-6 space-y-6">
            {/* Cognitive Score */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Cognitive Score</h3>
                <span
                  className={`text-3xl font-bold ${
                    thought.score >= 70
                      ? "text-green-600"
                      : thought.score >= 50
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {thought.score}
                  <span className="text-lg text-gray-400">/100</span>
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    thought.score >= 70
                      ? "bg-gradient-to-r from-green-500 to-green-600"
                      : thought.score >= 50
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                      : "bg-gradient-to-r from-red-500 to-red-600"
                  }`}
                  style={{ width: `${thought.score}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {thought.score >= 70
                  ? "Excellent cognitive health indicator"
                  : thought.score >= 50
                  ? "Moderate cognitive impact"
                  : "Requires attention and reframing"}
              </p>
            </div>

            {/* Mental Energy Impact */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">
                Mental Energy Impact
              </h3>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                {thought.energyImpact === "energizing" ? (
                  <Battery className="w-8 h-8 text-green-600" />
                ) : thought.energyImpact === "neutral" ? (
                  <BatteryMedium className="w-8 h-8 text-yellow-600" />
                ) : (
                  <BatteryLow className="w-8 h-8 text-red-600" />
                )}
                <div>
                  <p
                    className={`font-medium capitalize ${
                      thought.energyImpact === "energizing"
                        ? "text-green-700"
                        : thought.energyImpact === "neutral"
                        ? "text-yellow-700"
                        : "text-red-700"
                    }`}
                  >
                    {thought.energyImpact}
                  </p>
                  <p className="text-sm text-gray-600">
                    {thought.energyImpact === "energizing"
                      ? "This thought boosts your mental energy"
                      : thought.energyImpact === "neutral"
                      ? "This thought has neutral energy impact"
                      : "This thought drains mental energy"}
                  </p>
                </div>
              </div>
            </div>

            {/* Suggested Action */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">
                Suggested Action
              </h3>
              <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <Lightbulb className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-800">{thought.suggestion}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-100 space-y-3">
            {/* Convert to Reminder */}
            <button
              onClick={handleConvertToReminder}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-violet-50 text-violet-700 rounded-xl font-medium hover:bg-violet-100 transition-all"
            >
              <Bell className="w-5 h-5" />
              Convert to Reminder
            </button>

            {/* Share Options */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Share via:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => handleShare("Email")}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">Email</span>
                </button>
                <button
                  onClick={() => handleShare("WhatsApp")}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">WhatsApp</span>
                </button>
                <button
                  onClick={() => handleShare("Twitter")}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all"
                >
                  <Twitter className="w-4 h-4" />
                  <span className="text-sm font-medium">Twitter</span>
                </button>
                <button
                  onClick={() => handleShare("LinkedIn")}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all"
                >
                  <Linkedin className="w-4 h-4" />
                  <span className="text-sm font-medium">LinkedIn</span>
                </button>
              </div>
            </div>

            {/* Edit & Delete */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleEdit}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 rounded-xl font-medium hover:bg-blue-100 transition-all"
              >
                <Edit className="w-5 h-5" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-700 rounded-xl font-medium hover:bg-red-100 transition-all"
              >
                <Trash2 className="w-5 h-5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
