import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ConfirmModal } from "../../src/components/ConfirmModal";
import { EmptyState } from "../../src/components/EmptyState";
import { useAppContext } from "../../src/context/AppContext";
import { palette } from "../../src/theme/colors";

function formatTime(value: string) {
  return new Date(value).toLocaleString();
}

export default function HistoryScreen() {
  const { thoughts, deleteThought } = useAppContext();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "score">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const list = thoughts.filter((thought) =>
      thought.text.toLowerCase().includes(normalizedSearch),
    );

    return [...list].sort((left, right) => {
      const direction = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "score") {
        return (left.score - right.score) * direction;
      }
      return (+new Date(left.createdAt) - +new Date(right.createdAt)) * direction;
    });
  }, [thoughts, search, sortBy, sortOrder]);

  const onDelete = (id: string) => {
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    await deleteThought(pendingDeleteId);
    setPendingDeleteId(null);
  };

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Thought History</Text>
          <Text style={styles.subtitle}>Search, review, and manage your captured thoughts.</Text>
        </View>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search thoughts..."
          placeholderTextColor={palette.slate400}
          style={styles.search}
        />

        <View style={styles.sortRow}>
          <TouchableOpacity
            onPress={() => setSortBy("date")}
            style={[styles.sortButton, sortBy === "date" && styles.sortButtonActive]}
          >
            <Text style={[styles.sortText, sortBy === "date" && styles.sortTextActive]}>
              Sort by Date
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortBy("score")}
            style={[styles.sortButton, sortBy === "score" && styles.sortButtonActive]}
          >
            <Text style={[styles.sortText, sortBy === "score" && styles.sortTextActive]}>
              Sort by Score
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSortOrder((current) => (current === "asc" ? "desc" : "asc"))}
            style={[styles.sortButton, styles.orderButton]}
          >
            <Text style={styles.sortText}>
              {sortOrder === "desc" ? "Descending" : "Ascending"}
            </Text>
          </TouchableOpacity>
        </View>

        {filtered.length === 0 ? (
          <EmptyState
            title="No thoughts found"
            description={thoughts.length === 0 ? "Start by adding your first thought." : "Try a different search query."}
            actionLabel={thoughts.length === 0 ? "Add Thought" : undefined}
            onAction={thoughts.length === 0 ? () => router.push("/(app)/add-thought") : undefined}
          />
        ) : (
          filtered.map((thought) => (
            <TouchableOpacity
              key={thought.id}
              style={styles.card}
              onPress={() => router.push(`/analysis/${thought.id}`)}
            >
              <View style={styles.cardTop}>
                <View style={styles.badges}>
                  <Text style={styles.categoryBadge}>{thought.category}</Text>
                  <Text style={styles.typeBadge}>{thought.type}</Text>
                </View>
                <Text style={styles.score}>{thought.score}</Text>
              </View>

              <Text numberOfLines={2} style={styles.text}>
                {thought.text}
              </Text>

              <Text style={styles.time}>{formatTime(thought.createdAt)}</Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={(event) => {
                    event.stopPropagation();
                    router.push({ pathname: "/(app)/add-thought", params: { edit: thought.id } });
                  }}
                >
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnDanger]}
                  onPress={(event) => {
                    event.stopPropagation();
                    onDelete(thought.id);
                  }}
                >
                  <Text style={[styles.actionText, styles.actionTextDanger]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <ConfirmModal
        visible={Boolean(pendingDeleteId)}
        title="Confirm delete?"
        message="This thought will be removed permanently."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.slate50,
  },
  content: {
    padding: 16,
    gap: 10,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 2,
  },
  title: {
    color: palette.slate900,
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: palette.slate500,
  },
  search: {
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: palette.white,
    color: palette.slate900,
  },
  sortRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  sortButton: {
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: "center",
    backgroundColor: palette.white,
  },
  orderButton: {
    minWidth: 110,
  },
  sortButtonActive: {
    borderColor: palette.blue,
    backgroundColor: "#DBEAFE",
  },
  sortText: {
    color: palette.slate700,
    fontWeight: "600",
    fontSize: 12,
  },
  sortTextActive: {
    color: palette.blue,
  },
  card: {
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 14,
    backgroundColor: palette.white,
    padding: 12,
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badges: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  categoryBadge: {
    backgroundColor: "#DBEAFE",
    color: palette.blue,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: "700",
    fontSize: 11,
  },
  typeBadge: {
    backgroundColor: palette.slate100,
    color: palette.slate700,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: "600",
    fontSize: 11,
  },
  score: {
    color: palette.slate900,
    fontWeight: "800",
    fontSize: 22,
  },
  text: {
    color: palette.slate900,
    fontWeight: "600",
  },
  time: {
    color: palette.slate500,
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: palette.white,
  },
  actionBtnDanger: {
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  actionText: {
    color: palette.slate700,
    fontWeight: "600",
  },
  actionTextDanger: {
    color: "#B91C1C",
  },
});
