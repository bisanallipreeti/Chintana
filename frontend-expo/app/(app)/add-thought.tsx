import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ErrorState } from "../../src/components/ErrorState";
import { THOUGHT_CATEGORIES, useAppContext } from "../../src/context/AppContext";
import { palette } from "../../src/theme/colors";

type AnalysisResult = {
  type: "Constructive" | "Destructive" | "Neutral";
  score: number;
  classification: string;
  energyImpact: "energizing" | "neutral" | "draining";
  suggestion: string;
};

function getRevisitValue(mode: "none" | "tomorrow" | "week") {
  if (mode === "none") return null;

  const date = new Date();
  if (mode === "tomorrow") {
    date.setDate(date.getDate() + 1);
  } else {
    date.setDate(date.getDate() + 7);
  }

  return date.toISOString();
}

export default function AddThoughtScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const {
    analyzeThoughtDraft,
    saveThought,
    getThoughtById,
  } = useAppContext();

  const thoughtId = typeof edit === "string" ? edit : "";
  const existingThought = useMemo(() => {
    return thoughtId ? getThoughtById(thoughtId) : undefined;
  }, [thoughtId, getThoughtById]);

  const [text, setText] = useState(existingThought?.text || "");
  const [category, setCategory] = useState(existingThought?.category || THOUGHT_CATEGORIES[0]);
  const [allowSharing, setAllowSharing] = useState(existingThought?.allowSharing || false);
  const [confidential, setConfidential] = useState(existingThought?.confidential ?? true);
  const [revisitMode, setRevisitMode] = useState<"none" | "tomorrow" | "week">(
    existingThought?.revisitAt ? "tomorrow" : "none",
  );

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(
    existingThought
      ? {
          type: existingThought.type,
          score: existingThought.score,
          classification: existingThought.classification,
          energyImpact: existingThought.energyImpact,
          suggestion: existingThought.suggestion,
        }
      : null,
  );
  const [analysisError, setAnalysisError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (!existingThought) return;
    setText(existingThought.text);
    setCategory(existingThought.category);
    setAllowSharing(existingThought.allowSharing);
    setConfidential(existingThought.confidential);
    setRevisitMode(existingThought.revisitAt ? "tomorrow" : "none");
    setAnalysis({
      type: existingThought.type,
      score: existingThought.score,
      classification: existingThought.classification,
      energyImpact: existingThought.energyImpact,
      suggestion: existingThought.suggestion,
    });
  }, [existingThought]);

  useEffect(() => {
    if (confidential && allowSharing) {
      setAllowSharing(false);
    }
  }, [confidential, allowSharing]);

  useEffect(() => {
    if (!text.trim() || !category) {
      setAnalysis(null);
      setAnalysisError("");
      return;
    }

    let isCancelled = false;
    const timeout = setTimeout(async () => {
      try {
        setIsAnalyzing(true);
        const result = await analyzeThoughtDraft({ text: text.trim(), category });
        if (isCancelled) return;
        setAnalysis(result as AnalysisResult);
        setAnalysisError("");
      } catch (error) {
        if (isCancelled) return;
        setAnalysisError((error as Error).message || "Analysis preview unavailable.");
      } finally {
        if (!isCancelled) {
          setIsAnalyzing(false);
        }
      }
    }, 450);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [text, category, analyzeThoughtDraft]);

  const onSave = async () => {
    if (!text.trim()) {
      Alert.alert("Missing thought", "Please write your thought before saving.");
      return;
    }

    setIsSaving(true);
    setStatusMessage("");

    try {
      const result = await saveThought(
        {
          text: text.trim(),
          category,
          allowSharing,
          confidential,
          revisitAt: getRevisitValue(revisitMode),
        },
        existingThought?.id,
      );

      setStatusMessage(result.message);

      if (result.ok && result.thoughtId) {
        router.push(`/analysis/${result.thoughtId}`);
      }
    } catch (error) {
      setStatusMessage((error as Error).message || "Unable to save this thought.");
    } finally {
      setIsSaving(false);
    }
  };

  const scoreColor = analysis
    ? analysis.type === "Constructive"
      ? "#10B981"
      : analysis.type === "Destructive"
        ? "#EF4444"
        : "#F59E0B"
    : palette.slate400;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>{existingThought ? "Edit Thought" : "Add Thought"}</Text>
        <Text style={styles.subtitle}>Capture your thought and get instant analysis.</Text>

        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          placeholder="Write what is on your mind..."
          placeholderTextColor={palette.slate400}
          style={styles.textArea}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryWrap}>
          {THOUGHT_CATEGORIES.map((item) => {
            const selected = item === category;
            return (
              <TouchableOpacity
                key={item}
                onPress={() => setCategory(item)}
                style={[styles.categoryChip, selected && styles.categoryChipActive]}
              >
                <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Confidential</Text>
          <Switch
            value={confidential}
            onValueChange={(value) => {
              setConfidential(value);
              if (value) {
                setAllowSharing(false);
              }
            }}
          />
        </View>
        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleLabel}>Allow Sharing</Text>
            {confidential ? <Text style={styles.toggleHint}>Disabled while confidential is on</Text> : null}
          </View>
          <Switch
            value={allowSharing}
            disabled={confidential}
            onValueChange={setAllowSharing}
          />
        </View>

        <Text style={styles.label}>Revisit Reminder</Text>
        <View style={styles.quickRow}>
          {(["none", "tomorrow", "week"] as const).map((mode) => {
            const selected = revisitMode === mode;
            const label = mode === "none" ? "None" : mode === "tomorrow" ? "Tomorrow" : "Next 7 days";
            return (
              <TouchableOpacity
                key={mode}
                onPress={() => setRevisitMode(mode)}
                style={[styles.quickButton, selected && styles.quickButtonActive]}
              >
                <Text style={[styles.quickLabel, selected && styles.quickLabelActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.analysisHead}>
          <Text style={styles.analysisTitle}>Live Analysis</Text>
          {isAnalyzing ? <ActivityIndicator size="small" color={palette.blue} /> : null}
        </View>

        {analysis ? (
          <View style={styles.analysisBody}>
            <View style={styles.analysisScoreRow}>
              <Text style={styles.analysisClass}>{analysis.classification}</Text>
              <Text style={[styles.analysisScore, { color: scoreColor }]}>{analysis.score}/100</Text>
            </View>
            <Text style={styles.analysisMeta}>
              {analysis.type} | {analysis.energyImpact}
            </Text>
            <Text style={styles.analysisSuggestion}>{analysis.suggestion}</Text>
          </View>
        ) : (
          <Text style={styles.placeholder}>Start writing to see AI analysis.</Text>
        )}

        {analysisError ? <ErrorState message={analysisError} /> : null}
      </View>

      {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}

      <TouchableOpacity
        onPress={onSave}
        disabled={isSaving}
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
      >
        <Text style={styles.saveButtonText}>
          {isSaving ? "Saving..." : existingThought ? "Update Thought" : "Save Thought"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.slate50,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  title: {
    color: palette.slate900,
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    color: palette.slate500,
  },
  label: {
    color: palette.slate700,
    fontWeight: "700",
    marginTop: 6,
  },
  textArea: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 12,
    padding: 12,
    textAlignVertical: "top",
    color: palette.slate900,
    backgroundColor: palette.white,
  },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: palette.white,
  },
  categoryChipActive: {
    borderColor: palette.blue,
    backgroundColor: "#DBEAFE",
  },
  categoryText: {
    color: palette.slate700,
    fontSize: 12,
    fontWeight: "600",
  },
  categoryTextActive: {
    color: palette.blue,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  toggleLabel: {
    color: palette.slate900,
    fontWeight: "600",
  },
  toggleCopy: {
    flex: 1,
    gap: 2,
    paddingRight: 8,
  },
  toggleHint: {
    color: palette.slate500,
    fontSize: 11,
  },
  quickRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  quickButton: {
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  quickButtonActive: {
    borderColor: palette.blue,
    backgroundColor: "#DBEAFE",
  },
  quickLabel: {
    color: palette.slate700,
    fontWeight: "600",
    fontSize: 12,
  },
  quickLabelActive: {
    color: palette.blue,
  },
  analysisHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  analysisTitle: {
    color: palette.slate900,
    fontWeight: "700",
    fontSize: 16,
  },
  analysisBody: {
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 12,
    padding: 12,
    gap: 4,
    backgroundColor: palette.slate50,
  },
  analysisScoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  analysisClass: {
    color: palette.slate900,
    fontWeight: "700",
    fontSize: 16,
  },
  analysisScore: {
    fontWeight: "800",
    fontSize: 18,
  },
  analysisMeta: {
    color: palette.slate500,
    textTransform: "capitalize",
    fontSize: 12,
  },
  analysisSuggestion: {
    color: palette.slate700,
    fontSize: 13,
  },
  placeholder: {
    color: palette.slate500,
  },
  statusMessage: {
    textAlign: "center",
    color: palette.slate700,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: palette.blue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: palette.white,
    fontWeight: "700",
    fontSize: 15,
  },
});
