import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ConfirmModal } from "../../src/components/ConfirmModal";
import { EmptyState } from "../../src/components/EmptyState";
import { useAppContext } from "../../src/context/AppContext";
import { getPhoneDigitLimit } from "../../src/lib/geo";
import { palette } from "../../src/theme/colors";

export default function SettingsScreen() {
  const {
    user,
    updateSettings,
    logout,
    changePassword,
    changePin,
    changeRegisteredPhone,
  } = useAppContext();

  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [pinForm, setPinForm] = useState({
    currentPin: "",
    newPin: "",
    confirmPin: "",
  });

  const [phoneForm, setPhoneForm] = useState({
    phoneCountryIso: user?.profile?.phoneCountryIso || "IN",
    phoneNumber: user?.profile?.phoneNumber || "",
  });

  useEffect(() => {
    if (!user) return;
    setPhoneForm({
      phoneCountryIso: user.profile.phoneCountryIso || "IN",
      phoneNumber: user.profile.phoneNumber || "",
    });
  }, [user]);

  const phoneLimit = useMemo(() => getPhoneDigitLimit(phoneForm.phoneCountryIso || "IN"), [phoneForm.phoneCountryIso]);

  if (!user) {
    return (
      <View style={styles.emptyWrap}>
        <EmptyState title="Settings unavailable" description="Sign in again to access account settings." />
      </View>
    );
  }

  const settings = user.settings;

  const toggle = async (key: keyof typeof settings, value: boolean) => {
    setIsSaving(true);
    setStatus("");
    try {
      await updateSettings({ [key]: value });
      setStatus("Settings updated.");
    } catch (error) {
      setStatus((error as Error).message || "Unable to update settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const onChangePassword = async () => {
    setStatus("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setStatus("Enter current and new password.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatus("New password and confirm password do not match.");
      return;
    }

    setIsSaving(true);

    try {
      const result = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setStatus(result.message);
      if (result.ok) {
        router.replace("/");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const onChangePin = async () => {
    setStatus("");

    if (!pinForm.newPin) {
      setStatus("Enter a new PIN.");
      return;
    }

    if (pinForm.newPin !== pinForm.confirmPin) {
      setStatus("PIN confirmation does not match.");
      return;
    }

    if (!/^\d{4,8}$/.test(pinForm.newPin)) {
      setStatus("PIN must be 4 to 8 digits.");
      return;
    }

    setIsSaving(true);

    try {
      const result = await changePin({
        currentPin: pinForm.currentPin,
        newPin: pinForm.newPin,
      });
      setStatus(result.message);

      if (result.ok) {
        setPinForm({ currentPin: "", newPin: "", confirmPin: "" });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const onChangePhone = async () => {
    setStatus("");

    if (!phoneForm.phoneCountryIso.trim()) {
      setStatus("Enter a valid country ISO code.");
      return;
    }

    if (!phoneForm.phoneNumber || phoneForm.phoneNumber.length !== phoneLimit) {
      setStatus(`Phone number must be ${phoneLimit} digits for selected country code.`);
      return;
    }

    setIsSaving(true);

    try {
      const result = await changeRegisteredPhone({
        phoneCountryIso: phoneForm.phoneCountryIso.trim().toUpperCase(),
        phoneNumber: phoneForm.phoneNumber,
      });
      setStatus(result.message);
    } finally {
      setIsSaving(false);
    }
  };

  const onLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    router.replace("/");
  };

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage account security and privacy preferences.</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>App Controls</Text>
          <SettingRow
            label="Two-factor authentication"
            value={settings.twoFactorAuth}
            onToggle={(value) => {
              void toggle("twoFactorAuth", value);
            }}
          />
          <SettingRow
            label="Notifications"
            value={settings.notifications}
            onToggle={(value) => {
              void toggle("notifications", value);
            }}
          />
          <SettingRow
            label="Biometric lock"
            value={settings.biometricEnabled}
            onToggle={(value) => {
              void toggle("biometricEnabled", value);
            }}
          />

          <View style={styles.autoDeleteWrap}>
            <SettingRow
              label="Auto Delete Thoughts"
              value={settings.autoDelete}
              onToggle={(value) => {
                void toggle("autoDelete", value);
              }}
            />
            <Text style={styles.autoDeleteDescription}>
              Automatically removes your thoughts after 7 days from the date they are created to help maintain privacy and reduce data clutter.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Controls</Text>

          <View style={styles.group}>
            <Text style={styles.groupTitle}>Change Password</Text>
            <Field
              label="Current Password"
              value={passwordForm.currentPassword}
              secureTextEntry
              onChange={(value) => setPasswordForm((prev) => ({ ...prev, currentPassword: value }))}
            />
            <Field
              label="New Password"
              value={passwordForm.newPassword}
              secureTextEntry
              onChange={(value) => setPasswordForm((prev) => ({ ...prev, newPassword: value }))}
            />
            <Field
              label="Confirm New Password"
              value={passwordForm.confirmPassword}
              secureTextEntry
              onChange={(value) => setPasswordForm((prev) => ({ ...prev, confirmPassword: value }))}
            />
            <TouchableOpacity
              style={styles.secondaryButton}
              disabled={isSaving}
              onPress={() => {
                void onChangePassword();
              }}
            >
              <Text style={styles.secondaryButtonText}>Change Password</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.group}>
            <Text style={styles.groupTitle}>Change PIN</Text>
            <Field
              label="Current PIN (if already set)"
              value={pinForm.currentPin}
              keyboardType="number-pad"
              secureTextEntry
              onChange={(value) => setPinForm((prev) => ({ ...prev, currentPin: value.replace(/\D/g, "").slice(0, 8) }))}
            />
            <Field
              label="New PIN"
              value={pinForm.newPin}
              keyboardType="number-pad"
              secureTextEntry
              onChange={(value) => setPinForm((prev) => ({ ...prev, newPin: value.replace(/\D/g, "").slice(0, 8) }))}
            />
            <Field
              label="Confirm New PIN"
              value={pinForm.confirmPin}
              keyboardType="number-pad"
              secureTextEntry
              onChange={(value) => setPinForm((prev) => ({ ...prev, confirmPin: value.replace(/\D/g, "").slice(0, 8) }))}
            />
            <TouchableOpacity
              style={styles.secondaryButton}
              disabled={isSaving}
              onPress={() => {
                void onChangePin();
              }}
            >
              <Text style={styles.secondaryButtonText}>Change PIN</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.group}>
            <Text style={styles.groupTitle}>Change Registered Phone Number</Text>
            <Field
              label="Country ISO (e.g. IN, US)"
              value={phoneForm.phoneCountryIso}
              autoCapitalize="characters"
              onChange={(value) => setPhoneForm((prev) => ({ ...prev, phoneCountryIso: value.toUpperCase().slice(0, 5) }))}
            />
            <Field
              label={`Phone Number (${phoneLimit} digits)`}
              value={phoneForm.phoneNumber}
              keyboardType="number-pad"
              onChange={(value) =>
                setPhoneForm((prev) => ({
                  ...prev,
                  phoneNumber: value.replace(/\D/g, "").slice(0, phoneLimit),
                }))
              }
            />
            <TouchableOpacity
              style={styles.secondaryButton}
              disabled={isSaving}
              onPress={() => {
                void onChangePhone();
              }}
            >
              <Text style={styles.secondaryButtonText}>Change Phone Number</Text>
            </TouchableOpacity>
          </View>
        </View>

        {status ? <Text style={styles.status}>{status}</Text> : null}

        <TouchableOpacity
          onPress={() => setShowLogoutConfirm(true)}
          style={styles.logoutButton}
          disabled={isSaving}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmModal
        visible={showLogoutConfirm}
        title="Are you sure you want to logout?"
        message="You will need to sign in again to continue."
        confirmLabel="Yes"
        cancelLabel="No"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          void onLogout();
        }}
      />
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboardType,
  autoCapitalize = "none",
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  keyboardType?: "default" | "email-address" | "number-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType || "default"}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={palette.slate400}
        style={styles.input}
      />
    </View>
  );
}

function SettingRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onToggle} />
    </View>
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
    paddingBottom: 24,
  },
  emptyWrap: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    backgroundColor: palette.slate50,
  },
  title: {
    color: palette.slate900,
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    color: palette.slate500,
  },
  card: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    color: palette.slate900,
    fontWeight: "700",
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  rowLabel: {
    color: palette.slate900,
    fontWeight: "600",
    flex: 1,
    paddingRight: 10,
  },
  autoDeleteWrap: {
    gap: 4,
    paddingTop: 2,
  },
  autoDeleteDescription: {
    color: palette.slate500,
    fontSize: 12,
    lineHeight: 18,
  },
  group: {
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  groupTitle: {
    color: palette.slate900,
    fontWeight: "700",
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    color: palette.slate700,
    fontWeight: "600",
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: palette.white,
    color: palette.slate900,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: palette.blue,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#DBEAFE",
    marginTop: 4,
  },
  secondaryButtonText: {
    color: palette.blue,
    fontWeight: "700",
  },
  status: {
    color: palette.slate700,
    textAlign: "center",
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: {
    color: palette.white,
    fontWeight: "700",
    fontSize: 15,
  },
});
