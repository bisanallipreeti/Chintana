import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Mic,
  Image as ImageIcon,
  Video,
  Share2,
  Sparkles,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import {
  THOUGHT_CATEGORIES,
  useAppContext,
  type ThoughtAnalysisResult,
  type ThoughtAttachment,
  type ThoughtCategory,
} from "../context/AppContext";
import { normalizeThoughtText } from "../lib/thoughts";
import { apiUploadFile } from "../lib/api";

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognition;
    SpeechRecognition?: new () => SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
  }

  interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent {
    error: string;
  }
}

export function AddThought() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const { analyzeThoughtDraft, saveThought, getThoughtById } = useAppContext();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const analyzeRequestRef = useRef(0);

  const existingThought = editId ? getThoughtById(editId) : undefined;

  const [text, setText] = useState(existingThought?.text ?? "");
  const [category, setCategory] = useState<ThoughtCategory | "">(existingThought?.category ?? "");
  const [isConfidential, setIsConfidential] = useState(existingThought?.confidential ?? true);
  const [canShare, setCanShare] = useState(existingThought?.allowSharing ?? false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<ThoughtAttachment[]>(existingThought?.attachments ?? []);
  const [draftAnalysis, setDraftAnalysis] = useState<ThoughtAnalysisResult | null>(
    existingThought
      ? {
          type: existingThought.type,
          score: existingThought.score,
          classification: existingThought.classification,
          energyImpact: existingThought.energyImpact,
          suggestion: existingThought.suggestion,
          emotionalInsights: existingThought.emotionalInsights,
        }
      : null,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!existingThought) return;
    setText(existingThought.text);
    setCategory(existingThought.category);
    setIsConfidential(existingThought.confidential);
    setCanShare(existingThought.allowSharing);
    setAttachments(existingThought.attachments);
    setDraftAnalysis({
      type: existingThought.type,
      score: existingThought.score,
      classification: existingThought.classification,
      energyImpact: existingThought.energyImpact,
      suggestion: existingThought.suggestion,
      emotionalInsights: existingThought.emotionalInsights,
    });
  }, [existingThought]);

  useEffect(() => {
    return () => {
      attachments.forEach((file) => {
        if (file.url.startsWith("blob:")) URL.revokeObjectURL(file.url);
      });
    };
  }, [attachments]);

  const recognitionClass = useMemo(
    () => window.SpeechRecognition ?? window.webkitSpeechRecognition,
    [],
  );
  const cleanedText = useMemo(() => normalizeThoughtText(text).trim(), [text]);

  useEffect(() => {
    if (!cleanedText || !category) {
      setIsAnalyzing(false);
      setAnalysisError("");
      if (!existingThought || cleanedText !== existingThought.text || category !== existingThought.category) {
        setDraftAnalysis(null);
      }
      return;
    }

    const requestId = analyzeRequestRef.current + 1;
    analyzeRequestRef.current = requestId;
    setIsAnalyzing(true);
    setAnalysisError("");

    const timeoutId = window.setTimeout(async () => {
      try {
        const result = await analyzeThoughtDraft({ text: cleanedText, category });
        if (analyzeRequestRef.current !== requestId) return;
        setDraftAnalysis(result);
      } catch (error) {
        if (analyzeRequestRef.current !== requestId) return;
        setAnalysisError(
          error instanceof Error ? error.message : "Analysis preview is temporarily unavailable.",
        );
      } finally {
        if (analyzeRequestRef.current === requestId) {
          setIsAnalyzing(false);
        }
      }
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [analyzeThoughtDraft, category, cleanedText, existingThought]);

  const handleVoiceInput = () => {
    if (!recognitionClass) {
      toast.error("Speech capture is not supported in this browser.");
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new recognitionClass();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ");

      setText((previous) => normalizeThoughtText(`${previous} ${transcript}`.trim()));
    };

    recognition.onerror = () => {
      toast.error("Voice capture could not start.");
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    toast.success("Voice capture started.");
  };

  const fileMatchesExpectedType = (file: File, expectedType: "image" | "video") => {
    if (file.type) {
      return expectedType === "image"
        ? file.type.startsWith("image/")
        : file.type.startsWith("video/");
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
    const videoExtensions = ["mp4", "webm", "mov"];

    return expectedType === "image"
      ? imageExtensions.includes(extension)
      : videoExtensions.includes(extension);
  };

  const addAttachments = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video",
  ) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    event.target.value = "";

    for (const file of files) {
      if (!fileMatchesExpectedType(file, type)) {
        toast.error(
          type === "image"
            ? `${file.name} is not an image file.`
            : `${file.name} is not a video file.`,
        );
        continue;
      }

      const toastId = toast.loading(`Uploading ${file.name}...`);
      try {
        const response = await apiUploadFile(file, type, (percent) => {
          toast.loading(`Uploading ${file.name}... ${percent}%`, { id: toastId });
        });

        const attachment: ThoughtAttachment = {
          id: crypto.randomUUID(),
          type: response.data.type === "video" ? "video" : "image",
          name: response.data.name || file.name,
          url: response.data.url,
        };

        setAttachments((previous) => [...previous, attachment]);
        toast.success(`${file.name} uploaded.`, { id: toastId });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : `Failed to upload ${file.name}.`,
          { id: toastId },
        );
      }
    }
  };

  const handleAnalyze = async () => {
    if (!cleanedText.trim()) {
      toast.error("Please enter a thought.");
      return;
    }

    if (!category) {
      toast.error("Please select a category.");
      return;
    }

    setIsSubmitting(true);

    try {
      const savedThought = await saveThought(
        {
          text: cleanedText,
          category,
          allowSharing: canShare,
          confidential: isConfidential,
          attachments,
        },
        existingThought?.id,
      );

      toast.success(existingThought ? "Thought updated." : "Thought analyzed.");
      navigate(`/app/analysis/${savedThought.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Thought analysis failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const energyCopy = draftAnalysis
    ? draftAnalysis.energyImpact === "energizing"
      ? "Supports momentum"
      : draftAnalysis.energyImpact === "draining"
      ? "May be emotionally heavy"
      : "Feels relatively balanced"
    : "";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {existingThought ? "Edit Your Thought" : "Capture Your Thought"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Write naturally. Analysis updates as you go and is finalized when you save.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Your Thought</label>
            <textarea
              value={text}
              onChange={(event) => setText(normalizeThoughtText(event.target.value))}
              placeholder="What&apos;s on your mind? Share your thoughts, ideas, concerns, or feelings..."
              className="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{text.length} characters</span>
              {isRecording && (
                <span className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 animate-pulse">
                  <span className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full" />
                  Listening...
                </span>
              )}
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isRecording
                    ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900"
                    : "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900"
                }`}
              >
                <Mic className="w-5 h-5" />
                <span>{isRecording ? "Stop" : "Voice"}</span>
              </button>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-400 rounded-lg font-medium hover:bg-violet-100 dark:hover:bg-violet-900 transition-all"
              >
                <ImageIcon className="w-5 h-5" />
                <span>Image</span>
              </button>
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 rounded-lg font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all"
              >
                <Video className="w-5 h-5" />
                <span>Video</span>
              </button>
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(event) => addAttachments(event, "image")}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              multiple
              hidden
              onChange={(event) => addAttachments(event, "video")}
            />

            {attachments.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                        <Paperclip className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{attachment.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{attachment.type}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments((previous) =>
                          previous.filter((item) => item.id !== attachment.id),
                        )
                      }
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700 pt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {THOUGHT_CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    category === cat
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700 pt-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Live Analysis</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {cleanedText && category
                    ? "This preview refreshes automatically while you write."
                    : "Add a thought and category to generate a preview."}
                </p>
              </div>
              {isAnalyzing && (
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Analyzing...</span>
              )}
            </div>

            {draftAnalysis ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {draftAnalysis.classification}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {draftAnalysis.type} • {energyCopy}
                    </p>
                    {draftAnalysis.emotionalInsights && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Tone: {draftAnalysis.emotionalInsights.emotionalTone || "neutral"} | Distress: {draftAnalysis.emotionalInsights.distressLevel || "low"} | Confidence: {Math.round((draftAnalysis.emotionalInsights.confidence ?? draftAnalysis.aiMeta?.confidence ?? 0.5) * 100)}%
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Cognitive score</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{draftAnalysis.score}/100</p>
                  </div>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      draftAnalysis.type === "Constructive"
                        ? "bg-green-500"
                        : draftAnalysis.type === "Destructive"
                        ? "bg-red-500"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${draftAnalysis.score}%` }}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                      Energy Impact
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 capitalize">
                      {draftAnalysis.energyImpact}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                      Suggested Next Step
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{draftAnalysis.suggestion}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-4 text-sm text-gray-500 dark:text-gray-400">
                Start writing to see classification, score, energy impact, and a suggested next step.
              </div>
            )}

            {analysisError && (
              <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">
                {analysisError}. Saving will still run full analysis on the backend.
              </p>
            )}
          </div>

          <div className="px-6 pb-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Allow Sharing</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Share options will appear only when this is turned on
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCanShare((previous) => !previous)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  canShare ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
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

          <div className="px-6 pb-6">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white py-4 rounded-xl font-medium hover:from-blue-700 hover:to-violet-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-5 h-5" />
              {isSubmitting
                ? "Saving and Analyzing..."
                : existingThought
                ? "Update and Analyze Thought"
                : "Analyze Thought"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

