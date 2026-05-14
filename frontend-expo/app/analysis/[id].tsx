import { router, useLocalSearchParams } from "expo-router";
import { Alert, Linking, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";
import { ConfirmModal } from "../../src/components/ConfirmModal";
import { EmptyState } from "../../src/components/EmptyState";
import { useAppContext } from "../../src/context/AppContext";
import { palette } from "../../src/theme/colors";

function formatTime(value: string) {
  return new Date(value).toLocaleString();
}

export default function ThoughtAnalysisScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getThoughtById, deleteThought } = useAppContext();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const thoughtId = typeof id === "string" ? id : "";
  const thought = thoughtId ? getThoughtById(thoughtId) : undefined;

  if (!thought) {
    return (
      <View style={styles.missingWrap}>
        <EmptyState
          title="Thought not found"
          description="This thought was removed or is unavailable right now."
          actionLabel="Back to History"
          onAction={() => router.replace("/(app)/history")}
        />
      </View>
    );
  }

  const onDelete = () => {
    setShowDeleteConfirm(true);
  };

  const shareText = `${thought.text}\n\nCategory: ${thought.category}\nType: ${thought.type}\nScore: ${thought.score}`;

  const canShare = thought.allowSharing && !thought.confidential;

  const onShareViaEmail = async () => {
    if (!canShare) return;
    const url = `mailto:?subject=${encodeURIComponent("Chintana Thought")}&body=${encodeURIComponent(shareText)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        throw new Error("No email app found.");
      }
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert("Unable to share", (error as Error).message);
    }
  };

  const onShareViaWhatsApp = async () => {
    if (!canShare) return;
    const encoded = encodeURIComponent(shareText);
    const nativeUrl = `whatsapp://send?text=${encoded}`;
    const webUrl = `https://wa.me/?text=${encoded}`;

    try {
      const nativeSupported = await Linking.canOpenURL(nativeUrl);
      if (nativeSupported) {
        await Linking.openURL(nativeUrl);
        return;
      }

      const webSupported = await Linking.canOpenURL(webUrl);
      if (!webSupported) {
        throw new Error("WhatsApp is not available.");
      }
      await Linking.openURL(webUrl);
    } catch (error) {
      Alert.alert("Unable to share", (error as Error).message);
    }
  };

  const onShareViaSystem = async () => {
    if (!canShare) return;
    try {
      await Share.share({
        title: "Chintana Thought",
        message: shareText,
      });
    } catch (error) {
      Alert.alert("Unable to share", (error as Error).message);
    }
  };

  const confirmDelete = async () => {
    await deleteThought(thought.id);
    setShowDeleteConfirm(false);
    router.replace("/(app)/history");
  };

  const scoreColor =
    thought.type === "Constructive"
      ? "#10B981"
      : thought.type === "Destructive"
        ? "#EF4444"
        : "#F59E0B";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.categoryBadge}>{thought.category}</Text>
          <Text style={styles.typeBadge}>{thought.type}</Text>
        </View>
        <Text style={styles.text}>{thought.text}</Text>
        <Text style={styles.time}>{formatTime(thought.createdAt)}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.scoreRow}>
          <Text style={styles.sectionTitle}>Cognitive Score</Text>
          <Text style={[styles.score, { color: scoreColor }]}>{thought.score}/100</Text>
        </View>
        <Text style={styles.classification}>{thought.classification}</Text>
        <Text style={styles.energyMeta}>Energy impact: {thought.energyImpact}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Suggestion</Text>
        <Text style={styles.suggestion}>{thought.suggestion}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Share Thought</Text>
        <Text style={styles.shareHint}>
          {canShare
            ? "Choose where you want to share this thought."
            : "Sharing is disabled for this thought. Turn off confidential and enable sharing while editing."}
        </Text>
        <View style={styles.shareActions}>
          <TouchableOpacity
            style={[styles.shareButton, !canShare && styles.shareButtonDisabled]}
            onPress={() => {
              void onShareViaEmail();
            }}
            disabled={!canShare}
          >
            <Text style={[styles.shareButtonText, !canShare && styles.shareButtonTextDisabled]}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareButton, !canShare && styles.shareButtonDisabled]}
            onPress={() => {
              void onShareViaWhatsApp();
            }}
            disabled={!canShare}
          >
            <Text style={[styles.shareButtonText, !canShare && styles.shareButtonTextDisabled]}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shareButton, !canShare && styles.shareButtonDisabled]}
            onPress={() => {
              void onShareViaSystem();
            }}
            disabled={!canShare}
          >
            <Text style={[styles.shareButtonText, !canShare && styles.shareButtonTextDisabled]}>Other Apps</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push({ pathname: "/(app)/add-thought", params: { edit: thought.id } })}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={onDelete}>
          <Text style={[styles.actionButtonText, styles.dangerText]}>Delete</Text>
        </TouchableOpacity>
      </View>
      <ConfirmModal
        visible={showDeleteConfirm}
        title="Confirm delete?"
        message="This thought will be removed permanently."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
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
  missingWrap: {
    flex: 1,
    backgroundColor: palette.slate50,
    justifyContent: "center",
    padding: 16,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: palette.white,
    borderColor: palette.slate200,
    borderWidth: 1,
  },
  backButtonText: {
    color: palette.slate700,
    fontWeight: "700",
  },
  card: {
    backgroundColor: palette.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.slate200,
    padding: 14,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  categoryBadge: {
    backgroundColor: "#DBEAFE",
    color: palette.blue,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "700",
  },
  typeBadge: {
    backgroundColor: palette.slate100,
    color: palette.slate700,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "700",
  },
  text: {
    color: palette.slate900,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 26,
  },
  time: {
    color: palette.slate500,
    fontSize: 12,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: palette.slate900,
    fontSize: 16,
    fontWeight: "700",
  },
  score: {
    fontSize: 24,
    fontWeight: "800",
  },
  classification: {
    color: palette.slate700,
    fontWeight: "600",
  },
  energyMeta: {
    color: palette.slate500,
    textTransform: "capitalize",
  },
  suggestion: {
    color: palette.slate700,
    lineHeight: 20,
  },
  shareHint: {
    color: palette.slate500,
    fontSize: 13,
  },
  shareActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  shareButton: {
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: palette.white,
  },
  shareButtonDisabled: {
    backgroundColor: palette.slate100,
    borderColor: palette.slate200,
  },
  shareButtonText: {
    color: palette.slate700,
    fontWeight: "600",
  },
  shareButtonTextDisabled: {
    color: palette.slate400,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.slate200,
    backgroundColor: palette.white,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionButtonText: {
    color: palette.slate700,
    fontWeight: "700",
  },
  dangerButton: {
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  dangerText: {
    color: "#B91C1C",
  },
});
