import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { apiForgotPassword } from "../src/lib/api";
import { palette } from "../src/theme/colors";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const response = await apiForgotPassword(email.trim().toLowerCase());
      setStatusMessage(response.message || "Check your email for reset instructions.");
    } catch (error) {
      setStatusMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your email and we will send reset instructions.</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        {statusMessage ? <Text style={styles.message}>{statusMessage}</Text> : null}

        <TouchableOpacity onPress={submit} disabled={loading} style={styles.primaryButton}>
          <Text style={styles.primaryButtonLabel}>{loading ? "Sending..." : "Send Reset Link"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/")}>
          <Text style={styles.back}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.slate50,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: palette.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.slate200,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: palette.slate900,
  },
  subtitle: {
    color: palette.slate500,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: palette.white,
  },
  message: {
    color: palette.slate700,
    fontSize: 13,
  },
  primaryButton: {
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: palette.blue,
    paddingVertical: 13,
    alignItems: "center",
  },
  primaryButtonLabel: {
    color: palette.white,
    fontWeight: "700",
  },
  back: {
    textAlign: "center",
    color: palette.blue,
    fontWeight: "600",
  },
});
