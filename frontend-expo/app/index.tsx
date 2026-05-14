import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppContext } from "../src/context/AppContext";
import { palette } from "../src/theme/colors";

interface AuthForm {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  otp: string;
}

const initialForm: AuthForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  otp: "",
};

function passwordMeetsPolicy(password: string) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export default function AuthScreen() {
  const { login, register, verifyEmail, resendOtp, isAuthenticated, needsOnboarding } = useAppContext();
  const [isLogin, setIsLogin] = useState(true);
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    if (needsOnboarding) {
      router.replace("/onboarding");
    } else {
      router.replace("/(app)/dashboard");
    }
  }

  const canSubmit = useMemo(() => {
    if (awaitingOtp) {
      return form.email.trim().length > 0 && form.otp.trim().length === 6;
    }

    if (isLogin) {
      return form.email.trim().length > 0 && form.password.trim().length > 0;
    }

    return (
      form.fullName.trim().length > 1 &&
      form.email.trim().length > 0 &&
      passwordMeetsPolicy(form.password) &&
      form.password === form.confirmPassword
    );
  }, [awaitingOtp, form, isLogin]);

  const update = (key: keyof AuthForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage("");
  };

  const submit = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (awaitingOtp) {
        const result = await verifyEmail(form.email.trim().toLowerCase(), form.otp.trim());
        setMessage(result.message);
        if (result.ok) {
          router.replace("/onboarding");
        }
        return;
      }

      if (isLogin) {
        const result = await login(form.email.trim().toLowerCase(), form.password);
        setMessage(result.message);
        if (result.ok) {
          router.replace("/(app)/dashboard");
        }
        return;
      }

      const result = await register({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      setMessage(result.message);
      if (result.ok) {
        setAwaitingOtp(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <View style={styles.wrapper}>
        <View style={styles.logoBlock}>
          <LinearGradient colors={[palette.blue, palette.violet]} style={styles.logoCircle}>
            <Text style={styles.logoText}>C</Text>
          </LinearGradient>
          <Text style={styles.brand}>Chintana</Text>
          <Text style={styles.subtitle}>
            {awaitingOtp
              ? "Verify your email to continue"
              : isLogin
                ? "Sign in to continue"
                : "Create your account"}
          </Text>
        </View>

        {!awaitingOtp && (
          <View style={styles.modeSwitch}>
            <TouchableOpacity
              onPress={() => {
                setIsLogin(true);
                setMessage("");
              }}
              style={[styles.modeButton, isLogin && styles.modeButtonActive]}
            >
              <Text style={[styles.modeLabel, isLogin && styles.modeLabelActive]}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setIsLogin(false);
                setMessage("");
              }}
              style={[styles.modeButton, !isLogin && styles.modeButtonActive]}
            >
              <Text style={[styles.modeLabel, !isLogin && styles.modeLabelActive]}>Register</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          {!awaitingOtp ? (
            <>
              {!isLogin && (
                <TextInput
                  value={form.fullName}
                  onChangeText={(value) => update("fullName", value)}
                  placeholder="Full Name"
                  placeholderTextColor={palette.slate400}
                  style={styles.input}
                />
              )}

              <TextInput
                value={form.email}
                onChangeText={(value) => update("email", value)}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                placeholderTextColor={palette.slate400}
                style={styles.input}
              />

              <TextInput
                value={form.password}
                onChangeText={(value) => update("password", value)}
                placeholder="Password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType={isLogin ? "password" : "newPassword"}
                placeholderTextColor={palette.slate400}
                style={styles.input}
              />

              {!isLogin && (
                <TextInput
                  value={form.confirmPassword}
                  onChangeText={(value) => update("confirmPassword", value)}
                  placeholder="Confirm Password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  placeholderTextColor={palette.slate400}
                  style={styles.input}
                />
              )}

              {isLogin && (
                <TouchableOpacity onPress={() => router.push("/forgot-password")}>
                  <Text style={styles.forgot}>Forgot Password?</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Text style={styles.otpHelp}>Enter the 6-digit OTP sent to {form.email.trim().toLowerCase()}</Text>
              <TextInput
                value={form.otp}
                onChangeText={(value) => update("otp", value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                keyboardType="number-pad"
                placeholderTextColor={palette.slate400}
                style={[styles.input, styles.otpInput]}
              />
              <TouchableOpacity
                onPress={async () => {
                  const result = await resendOtp(form.email.trim().toLowerCase());
                  setMessage(result.message);
                }}
              >
                <Text style={styles.forgot}>Resend OTP</Text>
              </TouchableOpacity>
            </>
          )}

          {message ? <Text style={styles.message}>{message}</Text> : null}

          <TouchableOpacity
            onPress={submit}
            disabled={!canSubmit || isSubmitting}
            style={[styles.submitButton, (!canSubmit || isSubmitting) && styles.submitButtonDisabled]}
          >
            <LinearGradient colors={[palette.blue, palette.violet]} style={styles.submitGradient}>
              <Text style={styles.submitText}>
                {isSubmitting
                  ? "Please wait..."
                  : awaitingOtp
                    ? "Verify OTP"
                    : isLogin
                      ? "Login to Chintana"
                      : "Create Account"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.slate50,
    justifyContent: "center",
    padding: 20,
  },
  wrapper: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    gap: 14,
  },
  logoBlock: {
    alignItems: "center",
    gap: 8,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 36,
    fontWeight: "800",
    color: palette.white,
  },
  brand: {
    fontSize: 32,
    fontWeight: "800",
    color: palette.slate900,
  },
  subtitle: {
    color: palette.slate500,
  },
  modeSwitch: {
    flexDirection: "row",
    backgroundColor: palette.slate100,
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  modeButtonActive: {
    backgroundColor: palette.white,
  },
  modeLabel: {
    color: palette.slate500,
    fontWeight: "600",
  },
  modeLabelActive: {
    color: palette.blue,
    fontWeight: "700",
  },
  card: {
    backgroundColor: palette.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.slate200,
    padding: 20,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: palette.slate900,
    backgroundColor: palette.white,
  },
  otpInput: {
    letterSpacing: 8,
    fontWeight: "700",
    textAlign: "center",
    fontSize: 20,
  },
  forgot: {
    color: palette.blue,
    fontWeight: "600",
    textAlign: "right",
  },
  otpHelp: {
    color: palette.slate500,
    textAlign: "center",
  },
  message: {
    fontSize: 13,
    color: palette.slate700,
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  submitGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: "700",
  },
});
