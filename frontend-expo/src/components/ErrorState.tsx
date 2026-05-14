import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { palette } from "../theme/colors";

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity onPress={onRetry} style={styles.button}>
          <Text style={styles.buttonLabel}>Try Again</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  title: {
    color: "#B91C1C",
    fontWeight: "700",
  },
  message: {
    color: "#991B1B",
  },
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: palette.white,
    borderRadius: 8,
  },
  buttonLabel: {
    color: "#B91C1C",
    fontWeight: "600",
  },
});
