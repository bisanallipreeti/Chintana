import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { palette } from "../theme/colors";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={palette.blue} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: palette.slate50,
  },
  label: {
    color: palette.slate500,
    fontSize: 14,
    fontWeight: "600",
  },
});
