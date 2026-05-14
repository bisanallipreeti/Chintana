import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Mic,
  Image as ImageIcon,
  Video,
  Send,
  Lock,
  Share2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const categories = [
  "Business",
  "IT",
  "Personal",
  "Emotional",
  "Strategic",
  "Creative",
  "Health",
  "Financial",
  "Relationship",
  "Career",
  "Others",
];

export function AddThought() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [isConfidential, setIsConfidential] = useState(true);
  const [canShare, setCanShare] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast.success("Voice recording started");
    } else {
      toast.success("Voice recording stopped");
    }
  };

  const handleImageUpload = () => {
    toast.info("Image upload feature");
  };

  const handleVideoUpload = () => {
    toast.info("Video upload feature");
  };

  const handleAnalyze = () => {
    if (!text.trim()) {
      toast.error("Please enter a thought");
      return;
    }
    if (!category) {
      toast.error("Please select a category");
      return;
    }

    toast.success("Analyzing thought...");
    // Navigate to analysis page
    setTimeout(() => {
      navigate("/app/analysis/new");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Capture Your Thought
          </h1>
          <p className="text-gray-600">
            Express your thoughts freely. Our AI will analyze and classify them.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Text Input Area */}
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Your Thought
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind? Share your thoughts, ideas, concerns, or feelings..."
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-gray-900 placeholder-gray-400"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-500">
                {text.length} characters
              </span>
              {isRecording && (
                <span className="flex items-center gap-2 text-sm text-red-600 animate-pulse">
                  <span className="w-2 h-2 bg-red-600 rounded-full" />
                  Recording...
                </span>
              )}
            </div>
          </div>

          {/* Input Methods */}
          <div className="px-6 pb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={handleVoiceInput}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isRecording
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}
              >
                <Mic className="w-5 h-5" />
                <span className="hidden sm:inline">
                  {isRecording ? "Stop" : "Voice"}
                </span>
              </button>
              <button
                onClick={handleImageUpload}
                className="flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-700 rounded-lg font-medium hover:bg-violet-100 transition-all"
              >
                <ImageIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Image</span>
              </button>
              <button
                onClick={handleVideoUpload}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100 transition-all"
              >
                <Video className="w-5 h-5" />
                <span className="hidden sm:inline">Video</span>
              </button>
            </div>
          </div>

          {/* Category Selection */}
          <div className="px-6 pb-6 border-t border-gray-100 pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    category === cat
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="px-6 pb-6 space-y-4">
            {/* Confidential Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Confidential</p>
                  <p className="text-sm text-gray-500">
                    Keep this thought private
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConfidential(!isConfidential)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  isConfidential ? "bg-green-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    isConfidential ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Share Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Enable Sharing</p>
                  <p className="text-sm text-gray-500">
                    Allow sharing via email or social media
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCanShare(!canShare)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  canShare ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    canShare ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Analyze Button */}
          <div className="px-6 pb-6">
            <button
              onClick={handleAnalyze}
              className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white py-4 rounded-xl font-medium hover:from-blue-700 hover:to-violet-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Analyze Thought
            </button>
          </div>

          {/* Info Banner */}
          <div className="px-6 pb-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-800">
                <strong>AI Analysis:</strong> Your thought will be analyzed for
                sentiment, cognitive impact, and classified into appropriate
                categories. This helps you understand your mental patterns better.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}