import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { EmptyState } from "../../src/components/EmptyState";
import { useAppContext } from "../../src/context/AppContext";
import {
  COUNTRY_OPTIONS,
  getCitiesForState,
  getCountryByIso,
  getPhoneDigitLimit,
  getStatesForCountry,
} from "../../src/lib/geo";
import { palette } from "../../src/theme/colors";

type PickerOption = {
  value: string;
  label: string;
  subLabel?: string;
};

const INDIAN_NATIONALITY = "Indian";

export default function ProfileScreen() {
  const { user, updateProfile } = useAppContext();
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [form, setForm] = useState(() => ({
    fullName: user?.profile?.fullName || user?.fullName || "",
    email: user?.profile?.email || user?.email || "",
    occupation: user?.profile?.occupation || "",
    designation: user?.profile?.designation || "",
    education: user?.profile?.education || "",
    city: user?.profile?.city || "",
    stateCode: user?.profile?.stateCode || "",
    countryIso: user?.profile?.countryIso || "IN",
    nationality: user?.profile?.nationality || INDIAN_NATIONALITY,
    phoneCountryIso: user?.profile?.phoneCountryIso || "IN",
    phoneNumber: user?.profile?.phoneNumber || "",
    monthlyIncome: user?.profile?.monthlyIncome || "",
    additionalAnnualIncome: user?.profile?.additionalAnnualIncome || "",
    currencyCode: user?.profile?.currencyCode || "INR",
  }));

  const headerName = useMemo(() => {
    return form.fullName.trim() || user?.fullName || "User";
  }, [form.fullName, user?.fullName]);

  const states = useMemo(() => getStatesForCountry(form.countryIso), [form.countryIso]);
  const cities = useMemo(() => {
    if (!form.countryIso || !form.stateCode) return [];
    return getCitiesForState(form.countryIso, form.stateCode);
  }, [form.countryIso, form.stateCode]);

  const nationalityOptions = useMemo<PickerOption[]>(
    () =>
      COUNTRY_OPTIONS.map((country) => ({
        value: country.name,
        label: country.name,
      })),
    [],
  );

  const countryOptions = useMemo<PickerOption[]>(
    () =>
      COUNTRY_OPTIONS.map((country) => ({
        value: country.isoCode,
        label: country.name,
        subLabel: country.flag,
      })),
    [],
  );

  const phoneCodeOptions = useMemo<PickerOption[]>(
    () =>
      COUNTRY_OPTIONS.map((country) => ({
        value: country.isoCode,
        label: `${country.flag} ${country.name}`,
        subLabel: `+${country.phonecode}`,
      })),
    [],
  );

  const stateOptions = useMemo<PickerOption[]>(
    () => states.map((state) => ({ value: state.isoCode, label: state.name })),
    [states],
  );

  const cityOptions = useMemo<PickerOption[]>(
    () => cities.map((city) => ({ value: city.name, label: city.name })),
    [cities],
  );

  const phoneCountry = useMemo(() => getCountryByIso(form.phoneCountryIso || "IN"), [form.phoneCountryIso]);
  const phoneDigitLimit = useMemo(() => getPhoneDigitLimit(form.phoneCountryIso || "IN"), [form.phoneCountryIso]);

  const annualSalary = useMemo(() => {
    const monthly = Number(form.monthlyIncome || 0) || 0;
    const additional = Number(form.additionalAnnualIncome || 0) || 0;
    return monthly * 12 + additional;
  }, [form.monthlyIncome, form.additionalAnnualIncome]);

  useEffect(() => {
    if (!user) return;

    setForm({
      fullName: user.profile?.fullName || user.fullName || "",
      email: user.profile?.email || user.email || "",
      occupation: user.profile?.occupation || "",
      designation: user.profile?.designation || "",
      education: user.profile?.education || "",
      city: user.profile?.city || "",
      stateCode: user.profile?.stateCode || "",
      countryIso: user.profile?.countryIso || "IN",
      nationality: user.profile?.nationality || INDIAN_NATIONALITY,
      phoneCountryIso: user.profile?.phoneCountryIso || "IN",
      phoneNumber: user.profile?.phoneNumber || "",
      monthlyIncome: user.profile?.monthlyIncome || "",
      additionalAnnualIncome: user.profile?.additionalAnnualIncome || "",
      currencyCode: user.profile?.currencyCode || "INR",
    });
  }, [user]);

  if (!user) {
    return (
      <View style={styles.emptyWrap}>
        <EmptyState title="Profile unavailable" description="Sign in again to load your profile." />
      </View>
    );
  }

  const saveProfile = async () => {
    setStatusMessage("");

    if (form.phoneNumber && form.phoneNumber.length !== phoneDigitLimit) {
      setStatusMessage(`Phone number must be ${phoneDigitLimit} digits for selected country code.`);
      return;
    }

    setIsSaving(true);

    try {
      await updateProfile(form);
      setStatusMessage("Profile updated successfully.");
    } catch (error) {
      setStatusMessage((error as Error).message || "Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setStatusMessage("");
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{headerName.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroName}>{headerName}</Text>
          <Text style={styles.heroEmail}>{form.email || user.email}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personal Information</Text>

        <Field label="Full Name" value={form.fullName} onChange={(value) => update("fullName", value)} />
        <Field
          label="Email"
          value={form.email}
          onChange={(value) => update("email", value)}
          keyboardType="email-address"
        />

        <PickerField
          label="Phone Country Code"
          value={`${phoneCountry.flag} +${phoneCountry.phonecode}`}
          options={phoneCodeOptions}
          onSelect={(value) => {
            update("phoneCountryIso", value);
            update("phoneNumber", "");
          }}
          selectedValue={form.phoneCountryIso}
          placeholder="Select country code"
        />

        <Field
          label={`Phone Number (${phoneDigitLimit} digits)`}
          value={form.phoneNumber}
          keyboardType="number-pad"
          onChange={(value) => update("phoneNumber", value.replace(/\D/g, "").slice(0, phoneDigitLimit))}
        />

        <Field label="Occupation" value={form.occupation} onChange={(value) => update("occupation", value)} />
        <Field label="Designation" value={form.designation} onChange={(value) => update("designation", value)} />
        <Field label="Education" value={form.education} onChange={(value) => update("education", value)} />

        <PickerField
          label="Country"
          value={countryOptions.find((item) => item.value === form.countryIso)?.label || "Select country"}
          options={countryOptions}
          onSelect={(value) => {
            update("countryIso", value);
            update("stateCode", "");
            update("city", "");
          }}
          selectedValue={form.countryIso}
          placeholder="Search country"
        />

        <PickerField
          label="State"
          value={stateOptions.find((item) => item.value === form.stateCode)?.label || "Select state"}
          options={stateOptions}
          onSelect={(value) => {
            update("stateCode", value);
            update("city", "");
          }}
          selectedValue={form.stateCode}
          placeholder={form.countryIso ? "Search state" : "Select country first"}
          disabled={!form.countryIso}
        />

        <PickerField
          label="City"
          value={form.city || "Select city"}
          options={cityOptions}
          onSelect={(value) => update("city", value)}
          selectedValue={form.city}
          placeholder={form.stateCode ? "Search city" : "Select state first"}
          disabled={!form.stateCode}
        />

        <PickerField
          label="Nationality"
          value={form.nationality || INDIAN_NATIONALITY}
          options={nationalityOptions}
          onSelect={(value) => update("nationality", value)}
          selectedValue={form.nationality}
          placeholder="Search nationality"
        />

        <Field
          label="Monthly Salary"
          value={form.monthlyIncome}
          keyboardType="number-pad"
          onChange={(value) => update("monthlyIncome", value.replace(/[^\d.]/g, ""))}
        />

        <Field
          label="Additional Income (Annual)"
          value={form.additionalAnnualIncome}
          keyboardType="number-pad"
          onChange={(value) => update("additionalAnnualIncome", value.replace(/[^\d.]/g, ""))}
        />

        <View style={styles.annualWrap}>
          <Text style={styles.annualLabel}>Annual Salary (Auto-calculated)</Text>
          <Text style={styles.annualValue}>₹{Math.round(annualSalary).toLocaleString("en-IN")}</Text>
        </View>
      </View>

      {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}

      <TouchableOpacity
        disabled={isSaving}
        onPress={() => {
          void saveProfile();
        }}
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
      >
        <Text style={styles.saveButtonText}>{isSaving ? "Saving..." : "Save Profile"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboardType,
  autoCapitalize = "words",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  keyboardType?: "default" | "email-address" | "number-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType || "default"}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={palette.slate400}
        style={styles.input}
      />
    </View>
  );
}

function PickerField({
  label,
  value,
  options,
  selectedValue,
  onSelect,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  options: PickerOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;

    return options.filter((item) => {
      const haystack = `${item.label} ${item.subLabel || ""}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [options, query]);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, styles.pickerTrigger, disabled && styles.pickerDisabled]}
        disabled={disabled}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.pickerText}>{value || placeholder}</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{label}</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={placeholder}
              placeholderTextColor={palette.slate400}
              style={styles.modalSearch}
            />
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              style={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    selectedValue === item.value && styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    setQuery("");
                    setVisible(false);
                  }}
                >
                  <Text style={styles.modalOptionLabel}>{item.label}</Text>
                  {item.subLabel ? <Text style={styles.modalOptionMeta}>{item.subLabel}</Text> : null}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => {
                setQuery("");
                setVisible(false);
              }}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 32,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    backgroundColor: palette.slate50,
  },
  hero: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroCopy: {
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: palette.blue,
    fontSize: 24,
    fontWeight: "800",
  },
  heroName: {
    color: palette.slate900,
    fontSize: 20,
    fontWeight: "800",
  },
  heroEmail: {
    color: palette.slate500,
    fontSize: 12,
  },
  card: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    color: palette.slate900,
    fontSize: 17,
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
  pickerTrigger: {
    justifyContent: "center",
    minHeight: 44,
  },
  pickerDisabled: {
    backgroundColor: palette.slate100,
  },
  pickerText: {
    color: palette.slate900,
    fontSize: 14,
  },
  annualWrap: {
    borderWidth: 1,
    borderColor: "#BBF7D0",
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  annualLabel: {
    color: "#065F46",
    fontSize: 12,
    fontWeight: "600",
  },
  annualValue: {
    color: "#064E3B",
    fontSize: 21,
    fontWeight: "800",
  },
  status: {
    color: palette.slate700,
    textAlign: "center",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.4)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: palette.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.slate200,
    maxHeight: "80%",
    padding: 12,
    gap: 8,
  },
  modalTitle: {
    color: palette.slate900,
    fontSize: 17,
    fontWeight: "700",
  },
  modalSearch: {
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: palette.slate900,
  },
  modalList: {
    minHeight: 120,
  },
  modalOption: {
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: palette.white,
  },
  modalOptionActive: {
    borderColor: palette.blue,
    backgroundColor: "#DBEAFE",
  },
  modalOptionLabel: {
    color: palette.slate900,
    fontWeight: "600",
  },
  modalOptionMeta: {
    color: palette.slate500,
    marginTop: 2,
    fontSize: 12,
  },
  modalClose: {
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: palette.white,
  },
  modalCloseText: {
    color: palette.slate700,
    fontWeight: "700",
  },
});
