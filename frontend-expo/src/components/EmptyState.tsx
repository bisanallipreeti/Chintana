import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { palette } from "../theme/colors";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.button} onPress={onAction}>
          <Text style={styles.buttonLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: palette.slate200,
    borderStyle: "dashed",
    borderRadius: 16,
    backgroundColor: palette.white,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: palette.slate900,
    fontWeight: "700",
    fontSize: 18,
  },
  description: {
    color: palette.slate500,
    textAlign: "center",
    fontSize: 14,
  },
  button: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: palette.blue,
  },
  buttonLabel: {
    color: palette.white,
    fontWeight: "700",
  },
});
