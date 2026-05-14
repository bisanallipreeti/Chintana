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
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import { formatThoughtTimestamp } from "../lib/thoughts";
import { useAppContext } from "../context/AppContext";

export function ThoughtAnalysis() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getThoughtById, deleteThought } = useAppContext();
  const thought = id ? getThoughtById(id) : undefined;

  if (!thought) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center max-w-md w-full">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Thought not found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">This thought may have been removed or has not been created yet.</p>
          <button
            onClick={() => navigate("/app/history")}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all"
          >
            Go to History
          </button>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    if (!thought.allowSharing) {
      toast.info("Turn on sharing for this thought before using share options.");
      return;
    }

    const shareText = `${thought.text}\n\nCategory: ${thought.category}\nType: ${thought.type}\nScore: ${thought.score}`;

    if (navigator.share) {
      await navigator.share({ title: "Chintana Thought", text: shareText });
      return;
    }

    await navigator.clipboard.writeText(shareText);
    toast.success("Thought copied to your clipboard.");
  };

  const handleDelete = async () => {
    if (window.confirm("Delete this thought?")) {
      await deleteThought(thought.id);
      toast.success("Thought deleted.");
      navigate("/app/history");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div
            className={`p-6 ${
              thought.type === "Constructive"
                ? "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950"
                : thought.type === "Destructive"
                ? "bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950"
                : "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  thought.type === "Constructive"
                    ? "bg-green-100 dark:bg-green-900"
                    : thought.type === "Destructive"
                    ? "bg-red-100 dark:bg-red-900"
                    : "bg-yellow-100 dark:bg-yellow-900"
                }`}
              >
                {thought.type === "Constructive" ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                ) : thought.type === "Destructive" ? (
                  <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                ) : (
                  <MinusCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{thought.classification}</h1>
                    <p className="text-gray-600 dark:text-gray-400">{formatThoughtTimestamp(thought.createdAt)}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/70 dark:bg-gray-800/70 text-gray-800 dark:text-gray-200">
                    {thought.category}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Your Thought</h2>
            <p className="text-lg text-gray-900 dark:text-gray-100 leading-relaxed">{thought.text}</p>
          </div>

          {thought.attachments.length > 0 && (
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Attached Files</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {thought.attachments.map((attachment) => (
                  <div key={attachment.id} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900">
                    {attachment.type === "image" ? (
                      <img src={attachment.url} alt={attachment.name} className="h-48 w-full object-cover" />
                    ) : (
                      <video src={attachment.url} controls className="h-48 w-full object-cover bg-black" />
                    )}
                    <div className="px-4 py-3 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Paperclip className="w-4 h-4" />
                      <span className="truncate">{attachment.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Cognitive Score</h3>
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {thought.score}
                  <span className="text-lg text-gray-400">/100</span>
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-600" style={{ width: `${thought.score}%` }} />
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Mental Energy Impact</h3>
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                {thought.energyImpact === "energizing" ? (
                  <Battery className="w-8 h-8 text-green-600 dark:text-green-400" />
                ) : thought.energyImpact === "neutral" ? (
                  <BatteryMedium className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                ) : (
                  <BatteryLow className="w-8 h-8 text-red-600 dark:text-red-400" />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{thought.energyImpact}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {thought.energyImpact === "energizing"
                      ? "This thought appears to support your mental momentum."
                      : thought.energyImpact === "neutral"
                      ? "This thought appears balanced."
                      : "This thought may be weighing on your mental energy."}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Suggested Action</h3>
              <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl">
                <Lightbulb className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-800 dark:text-gray-200">{thought.suggestion}</p>
              </div>
            </div>

            {thought.emotionalInsights && (
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Emotional Insights</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tone</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 capitalize">{thought.emotionalInsights.emotionalTone || "neutral"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Distress</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 capitalize">{thought.emotionalInsights.distressLevel || "low"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Confidence</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{Math.round((thought.emotionalInsights.confidence ?? thought.aiMeta?.confidence ?? 0.5) * 100)}%</p>
                  </div>
                </div>
                {thought.emotionalInsights.summary && (
                  <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{thought.emotionalInsights.summary}</p>
                )}
                {thought.emotionalInsights.safety?.riskLevel && thought.emotionalInsights.safety.riskLevel !== "none" && (
                  <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
                    Safety signal: {thought.emotionalInsights.safety.riskLevel}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-100 dark:border-gray-700 space-y-3">
            <button
              onClick={handleShare}
              disabled={!thought.allowSharing}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                thought.allowSharing
                  ? "bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Share2 className="w-5 h-5" />
              {thought.allowSharing ? "Share Thought" : "Sharing Disabled"}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate(`/app/add-thought?edit=${thought.id}`)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-xl font-medium hover:bg-blue-100 dark:hover:bg-blue-900 transition-all"
              >
                <Edit className="w-5 h-5" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900 transition-all"
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
