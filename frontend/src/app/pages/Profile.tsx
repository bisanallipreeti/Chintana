import { useEffect, useMemo, useRef, useState } from "react";
import {
  User,
  Mail,
  Calendar,
  Edit,
  Save,
  X,
  Camera,
  GraduationCap,
  Users,
  Home,
  Plus,
  Trash2,
  Settings2,
  Briefcase,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  getInitials,
  useAppContext,
  type EmergencyContact,
  type ProfileData,
} from "../context/AppContext";
import {
  COUNTRY_OPTIONS,
  getCountryByIso,
  getPhoneDigitLimit,
  getStatesForCountry,
} from "../lib/geo";

const RELATIONSHIP_OPTIONS = ["Parent", "Sibling", "Spouse", "Friend", "Guardian", "Colleague", "Other"];
const GENDER_OPTIONS = ["Female", "Male", "Other", "Prefer not to say"];

function getCurrencyOptions() {
  const displayNames =
    typeof Intl.DisplayNames !== "undefined"
      ? new Intl.DisplayNames(["en"], { type: "currency" })
      : null;

  const values =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("currency")
      : ["INR", "USD", "EUR", "GBP", "AED", "AUD", "CAD", "SGD", "JPY"];

  return values.map((code) => ({
    code,
    label: displayNames?.of(code) ?? code,
  }));
}

export function Profile() {
  const { currentAccount, updateProfile } = useAppContext();
  const choosePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const photoMenuRef = useRef<HTMLDivElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(currentAccount?.profile ?? null);
  const [draft, setDraft] = useState<ProfileData | null>(currentAccount?.profile ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingEmergencyContact, setPendingEmergencyContact] = useState<EmergencyContact | null>(null);

  useEffect(() => {
    setProfileData(currentAccount?.profile ?? null);
    setDraft(currentAccount?.profile ?? null);
    setPendingEmergencyContact(null);
  }, [currentAccount]);

  useEffect(() => {
    if (!showPhotoMenu) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!photoMenuRef.current?.contains(event.target as Node)) {
        setShowPhotoMenu(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showPhotoMenu]);

  const currencies = useMemo(() => getCurrencyOptions(), []);

  if (!currentAccount || !profileData || !draft) return null;

  const today = new Date().toISOString().split("T")[0];
  const states = draft.countryIso ? getStatesForCountry(draft.countryIso) : [];
  const symbolFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: draft.currencyCode || "INR",
    maximumFractionDigits: 0,
  });
  const totalAnnualIncome =
    (Number(draft.monthlyIncome || 0) || 0) * 12 + (Number(draft.additionalAnnualIncome || 0) || 0);
  const monthlyAverage = totalAnnualIncome / 12;

  const updateField = <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => {
    setDraft((previous) => (previous ? { ...previous, [field]: value } : previous));
    setErrors((previous) => ({ ...previous, [String(field)]: "" }));
  };

  const updateEmergencyContact = (
    contactId: string,
    field: keyof EmergencyContact,
    value: string,
  ) => {
    setDraft((previous) =>
      previous
        ? {
            ...previous,
            emergencyContacts: previous.emergencyContacts.map((contact) =>
              contact.id === contactId ? { ...contact, [field]: value } : contact,
            ),
          }
        : previous,
    );
  };

  const validateProfile = () => {
    const nextErrors: Record<string, string> = {};
    const requiredFields: Array<[keyof ProfileData, string]> = [
      ["fullName", "Enter your full name."],
      ["email", "Enter your email address."],
      ["phoneNumber", "Enter your phone number."],
      ["education", "Enter your education details."],
    ];

    requiredFields.forEach(([field, message]) => {
      if (!String(draft[field] ?? "").trim()) {
        nextErrors[String(field)] = message;
      }
    });

    if (draft.phoneNumber && draft.phoneNumber.length !== getPhoneDigitLimit(draft.phoneCountryIso)) {
      nextErrors.phoneNumber = `Enter ${getPhoneDigitLimit(draft.phoneCountryIso)} digits for the selected country code.`;
    }

    const incompleteContact = draft.emergencyContacts.find(
      (contact) => contact.name || contact.phoneNumber
        ? !(contact.name && contact.phoneNumber && contact.relation)
        : false,
    );

    if (incompleteContact) {
      nextErrors.emergencyContacts = "Complete the current emergency contact before saving.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateProfile()) {
      toast.error("Please complete the required profile fields.");
      return;
    }

    await updateProfile(draft);
    setProfileData(draft);
    setPendingEmergencyContact(null);
    setIsEditing(false);
    toast.success("Profile saved.");
  };

  const handleCancel = () => {
    setDraft(profileData);
    setErrors({});
    setPendingEmergencyContact(null);
    setIsEditing(false);
  };

  const handlePhotoSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      updateField("photoDataUrl", String(reader.result ?? ""));
      setShowPhotoMenu(false);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const addEmergencyContact = () => {
    if (draft.emergencyContacts.length >= 5) {
      toast.info("You can add up to 5 emergency contacts.");
      return;
    }

    if (pendingEmergencyContact) {
      toast.info("Complete the contact you are adding first.");
      return;
    }

    if (!isEditing) {
      setIsEditing(true);
    }

    setPendingEmergencyContact({
      id: crypto.randomUUID(),
      name: "",
      relation: "Parent",
      phoneCountryIso: "IN",
      phoneNumber: "",
      phoneType: "Mobile",
    });
  };

  const removeEmergencyContact = (contactId: string) => {
    updateField(
      "emergencyContacts",
      draft.emergencyContacts.filter((contact) => contact.id !== contactId),
    );
  };

  const confirmAddEmergencyContact = () => {
    if (!pendingEmergencyContact) return;

    if (!pendingEmergencyContact.name || !pendingEmergencyContact.phoneNumber || !pendingEmergencyContact.relation) {
      toast.info("Fill the contact details before adding.");
      return;
    }

    if (
      pendingEmergencyContact.phoneNumber.length !==
      getPhoneDigitLimit(pendingEmergencyContact.phoneCountryIso)
    ) {
      toast.info("Enter the correct number of digits for the selected country code.");
      return;
    }

    updateField("emergencyContacts", [...draft.emergencyContacts, pendingEmergencyContact]);
    setPendingEmergencyContact(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">My Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your personal and professional information</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-visible mb-6">
          <div className="relative bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div ref={photoMenuRef} className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden text-blue-600 text-2xl font-bold">
                  {draft.photoDataUrl ? (
                    <img src={draft.photoDataUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(currentAccount)
                  )}
                </div>
                <button
                  onClick={() => setShowPhotoMenu((previous) => !previous)}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all shadow-md border-2 border-blue-600"
                >
                  <Camera className="w-4 h-4" />
                </button>
                {showPhotoMenu && (
                  <div className="absolute top-full mt-3 right-0 w-64 rounded-2xl bg-white border border-gray-200 shadow-2xl p-2 z-10">
                    <button
                      onClick={() => choosePhotoInputRef.current?.click()}
                      className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-800"
                    >
                      Choose from Device
                    </button>
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-800"
                    >
                      Camera
                    </button>
                    {draft.photoDataUrl && (
                      <button
                        onClick={() => {
                          if (window.confirm("Remove the current profile photo?")) {
                            updateField("photoDataUrl", "");
                            setShowPhotoMenu(false);
                          }
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 text-sm font-medium text-red-600"
                      >
                        Remove Profile Photo
                      </button>
                    )}
                  </div>
                )}
                <input
                  ref={choosePhotoInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handlePhotoSelected}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  hidden
                  onChange={handlePhotoSelected}
                />
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-bold text-white mb-1">
                  {draft.fullName || currentAccount.registeredFullName}
                </h2>
                <p className="text-blue-100 dark:text-blue-200 mb-1">{draft.designation || "Profile details not added yet"}</p>
                <p className="text-blue-200 text-sm">{draft.occupation || currentAccount.email}</p>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-md"
                  >
                    <Edit className="w-5 h-5" />
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white text-green-600 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-md"
                    >
                      <Save className="w-5 h-5" />
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-md"
                    >
                      <X className="w-5 h-5" />
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <SectionCard
          title="Personal Information"
          description="Your basic personal details"
          icon={<User className="w-5 h-5 text-blue-600" />}
          iconClass="bg-blue-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField
              label="Full Name"
              icon={<User className="w-5 h-5 text-gray-400" />}
              value={draft.fullName}
              onChange={(value) => updateField("fullName", value)}
              disabled={!isEditing}
              required={isEditing}
              error={errors.fullName}
            />
            <TextField
              label="Email Address"
              icon={<Mail className="w-5 h-5 text-gray-400" />}
              value={draft.email}
              onChange={(value) => updateField("email", value)}
              disabled={!isEditing}
              required={isEditing}
              error={errors.email}
              type="email"
            />

              <div>
                <FieldLabel text="Phone Number" required={isEditing} />
                <div className="grid grid-cols-[108px_1fr] gap-3 items-center">
                  <CountryCodePicker
                    value={draft.phoneCountryIso}
                    onChange={(countryIso) => {
                    updateField("phoneCountryIso", countryIso);
                    updateField("phoneNumber", "");
                  }}
                  disabled={!isEditing}
                />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={draft.phoneNumber}
                  onChange={(event) =>
                    updateField(
                      "phoneNumber",
                      event.target.value.replace(/\D/g, "").slice(0, getPhoneDigitLimit(draft.phoneCountryIso)),
                    )
                  }
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-600 dark:disabled:text-gray-400"
                />
              </div>
              {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>}
            </div>

            <div>
              <FieldLabel text="Date of Birth" required={false} />
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={draft.dateOfBirth}
                  max={today}
                  onChange={(event) => updateField("dateOfBirth", event.target.value)}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-600 dark:disabled:text-gray-400"
                />
              </div>
            </div>

            <div>
              <FieldLabel text="Gender" required={false} />
              <SearchableTextPicker
                value={draft.gender}
                onChange={(gender) => updateField("gender", gender)}
                disabled={!isEditing}
                options={GENDER_OPTIONS.map((option) => ({ value: option, label: option }))}
                placeholder="Select gender"
              />
            </div>

            <TextField
              label="Education"
              icon={<GraduationCap className="w-5 h-5 text-gray-400" />}
              value={draft.education}
              onChange={(value) => updateField("education", value)}
              disabled={!isEditing}
              required={isEditing}
              error={errors.education}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Address Information"
          description="Your residential details"
          icon={<Home className="w-5 h-5 text-violet-600" />}
          iconClass="bg-violet-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <FieldLabel text="Country" required={false} />
              <SearchableTextPicker
                value={draft.countryIso}
                onChange={(countryIso) => {
                  updateField("countryIso", countryIso);
                  updateField("stateCode", "");
                  updateField("city", "");
                }}
                disabled={!isEditing}
                options={COUNTRY_OPTIONS.map((country) => ({
                  value: country.isoCode,
                  label: country.name,
                }))}
                placeholder="Search country"
              />
            </div>

            <div>
              <FieldLabel text="State" required={false} />
              <SearchableTextPicker
                value={draft.stateCode}
                onChange={(stateCode) => {
                  updateField("stateCode", stateCode);
                  updateField("city", "");
                }}
                disabled={!isEditing || !draft.countryIso}
                options={states.map((state) => ({ value: state.isoCode, label: state.name }))}
                placeholder="Search state"
              />
            </div>

            <div>
              <FieldLabel text="City" required={false} />
              <input
                type="text"
                value={draft.city}
                onChange={(event) => updateField("city", event.target.value)}
                disabled={!isEditing}
                placeholder="Search city"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-600 dark:disabled:text-gray-400"
              />
            </div>

            <TextField
              label="Street Address"
              icon={null}
              value={draft.streetAddress}
              onChange={(value) => updateField("streetAddress", value)}
              disabled={!isEditing}
            />

            <TextField
              label="Pincode"
              icon={null}
              value={draft.pincode}
              onChange={(value) => updateField("pincode", value)}
              disabled={!isEditing}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Professional Information"
          description="Your career and work details"
          icon={<Briefcase className="w-5 h-5 text-indigo-600" />}
          iconClass="bg-indigo-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField
              label="Occupation"
              icon={<Briefcase className="w-5 h-5 text-gray-400" />}
              value={draft.occupation}
              onChange={(value) => updateField("occupation", value)}
              disabled={!isEditing}
            />
            <TextField
              label="Designation"
              icon={null}
              value={draft.designation}
              onChange={(value) => updateField("designation", value)}
              disabled={!isEditing}
            />
            <TextField
              label="Years of Experience"
              icon={null}
              value={draft.yearsOfExperience}
              onChange={(value) => updateField("yearsOfExperience", value.replace(/\D/g, ""))}
              disabled={!isEditing}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Financial Information"
          description="Your salary and income details"
          icon={<Settings2 className="w-5 h-5 text-green-600" />}
          iconClass="bg-green-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <FieldLabel text="Currency" required={false} />
              <SearchableTextPicker
                value={draft.currencyCode}
                onChange={(currencyCode) => updateField("currencyCode", currencyCode.toUpperCase())}
                disabled={!isEditing}
                options={currencies.map((currency) => ({
                  value: currency.code,
                  label: `${currency.code} - ${currency.label}`,
                }))}
                placeholder="Search currency"
              />
            </div>

            <TextField
              label="Monthly Income"
              icon={null}
              value={draft.monthlyIncome}
              onChange={(value) => updateField("monthlyIncome", value.replace(/[^\d.]/g, ""))}
              disabled={!isEditing}
              type="text"
            />

            <TextField
              label="Additional Annual Income"
              icon={null}
              value={draft.additionalAnnualIncome}
              onChange={(value) => updateField("additionalAnnualIncome", value.replace(/[^\d.]/g, ""))}
              disabled={!isEditing}
              type="text"
            />

            <div className="md:col-span-2 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-green-700 dark:text-green-400 mb-1">Total Annual Income</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                    {symbolFormatter.format(Number.isFinite(totalAnnualIncome) ? totalAnnualIncome : 0)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-700 dark:text-green-400 mb-1">Monthly Average</p>
                  <p className="text-xl font-bold text-green-900 dark:text-green-300">
                    {symbolFormatter.format(Number.isFinite(monthlyAverage) ? monthlyAverage : 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Emergency Contacts"
          description="People to contact in case of emergency"
          icon={<Users className="w-5 h-5 text-red-600" />}
          iconClass="bg-red-100"
            extraAction={
            isEditing && draft.emergencyContacts.length > 0 ? (
              <button
                onClick={addEmergencyContact}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Emergency Contact
              </button>
            ) : null
          }
        >
          <div className="space-y-4">
            {draft.emergencyContacts.length === 0 ? (
              <div className="p-6 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-center">
                {isEditing ? (
                  <button
                    onClick={addEmergencyContact}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add Emergency Contact
                  </button>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Click Edit Profile to add emergency contacts.</p>
                )}
              </div>
            ) : (
              draft.emergencyContacts.map((contact, index) => (
                <div key={contact.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">Contact {index + 1}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      label="Contact Name"
                      icon={<User className="w-5 h-5 text-gray-400" />}
                      value={contact.name}
                      onChange={(value) => updateEmergencyContact(contact.id, "name", value)}
                      disabled={!isEditing}
                    />

                    <div>
                      <FieldLabel text="Relationship" required={false} />
                      <SearchableTextPicker
                        value={contact.relation}
                        onChange={(relation) => updateEmergencyContact(contact.id, "relation", relation)}
                        disabled={!isEditing}
                        options={RELATIONSHIP_OPTIONS.map((option) => ({ value: option, label: option }))}
                        placeholder="Select relationship"
                      />
                    </div>

                    <div>
                      <FieldLabel text="Contact Phone" required={false} />
                      <div className="flex items-center gap-1">
                        <div className="w-[84px] shrink-0">
                          <CountryCodePicker
                            value={contact.phoneCountryIso}
                            onChange={(countryIso) => updateEmergencyContact(contact.id, "phoneCountryIso", countryIso)}
                            disabled={!isEditing}
                          />
                        </div>
                        <input
                          type="tel"
                          inputMode="numeric"
                          value={contact.phoneNumber}
                          onChange={(event) =>
                            updateEmergencyContact(
                              contact.id,
                              "phoneNumber",
                              event.target.value
                                .replace(/\D/g, "")
                                .slice(0, getPhoneDigitLimit(contact.phoneCountryIso)),
                            )
                          }
                          disabled={!isEditing}
                          className="min-w-0 flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-600 dark:disabled:text-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                  {isEditing && (
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={() => removeEmergencyContact(contact.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        disabled={draft.emergencyContacts.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
            {pendingEmergencyContact && (
              <div className="p-4 border border-blue-200 dark:border-blue-800 rounded-xl bg-blue-50/50 dark:bg-blue-950/30">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">New Emergency Contact</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField
                    label="Contact Name"
                    icon={<User className="w-5 h-5 text-gray-400" />}
                    value={pendingEmergencyContact.name}
                    onChange={(value) =>
                      setPendingEmergencyContact((previous) =>
                        previous ? { ...previous, name: value } : previous,
                      )
                    }
                    disabled={!isEditing}
                  />

                  <div>
                    <FieldLabel text="Relationship" required={false} />
                    <SearchableTextPicker
                      value={pendingEmergencyContact.relation}
                      onChange={(relation) =>
                        setPendingEmergencyContact((previous) =>
                          previous ? { ...previous, relation } : previous,
                        )
                      }
                      disabled={!isEditing}
                      options={RELATIONSHIP_OPTIONS.map((option) => ({ value: option, label: option }))}
                      placeholder="Select relationship"
                    />
                  </div>

                  <div>
                    <FieldLabel text="Contact Phone" required={false} />
                    <div className="flex items-center gap-1">
                      <div className="w-[84px] shrink-0">
                        <CountryCodePicker
                          value={pendingEmergencyContact.phoneCountryIso}
                          onChange={(countryIso) =>
                            setPendingEmergencyContact((previous) =>
                              previous
                                ? { ...previous, phoneCountryIso: countryIso, phoneNumber: "" }
                                : previous,
                            )
                          }
                          disabled={!isEditing}
                        />
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={pendingEmergencyContact.phoneNumber}
                        onChange={(event) =>
                          setPendingEmergencyContact((previous) =>
                            previous
                              ? {
                                  ...previous,
                                  phoneNumber: event.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, getPhoneDigitLimit(previous.phoneCountryIso)),
                                }
                              : previous,
                          )
                        }
                        disabled={!isEditing}
                        className="min-w-0 flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50 disabled:text-gray-600"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setPendingEmergencyContact(null)}
                    className="px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAddEmergencyContact}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
                  >
                    Add Contact
                  </button>
                </div>
              </div>
            )}
            {errors.emergencyContacts && <p className="text-sm text-red-600">{errors.emergencyContacts}</p>}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon,
  iconClass,
  children,
  extraAction,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
  children: React.ReactNode;
  extraAction?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-visible mb-6">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${iconClass} rounded-lg flex items-center justify-center`}>{icon}</div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
            </div>
          </div>
          {extraAction}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function FieldLabel({ text, required }: { text: string; required: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {text}
      {required && <span className="text-red-600 dark:text-red-400 ml-1">*</span>}
    </label>
  );
}

function TextField({
  label,
  icon,
  value,
  onChange,
  disabled,
  required = false,
  error,
  type = "text",
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  required?: boolean;
  error?: string;
  type?: string;
}) {
  return (
    <div>
      <FieldLabel text={label} required={required} />
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={`w-full ${icon ? "pl-10" : "pl-4"} pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-600 dark:disabled:text-gray-400 ${
            error ? "border-red-400" : "border-gray-300 dark:border-gray-600"
          }`}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

function CountryCodePicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (countryIso: string) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selected = getCountryByIso(value || "IN");
  const filtered = COUNTRY_OPTIONS.filter((country) => {
    const haystack = `${country.name} +${country.phonecode}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        className="w-full h-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-left bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-600 dark:disabled:text-gray-400"
      >
        <span className="text-base mr-1">{selected.flag}</span>
        <span className="text-xs font-semibold">+{selected.phonecode}</span>
      </button>
      {open && !disabled && (
        <div className="absolute z-20 mt-2 w-[30rem] max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
          <div className="sticky top-0 z-10 p-3 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search country or code"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto overscroll-contain">
            {filtered.map((country) => (
              <button
                key={country.isoCode}
                type="button"
                onClick={() => {
                  onChange(country.isoCode);
                  setQuery("");
                  setOpen(false);
                }}
                className="w-full px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between gap-6"
              >
                <span className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-lg">{country.flag}</span>
                  <span className="text-sm text-gray-800 dark:text-gray-200 whitespace-normal break-words leading-6">
                    {country.name}
                  </span>
                </span>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 shrink-0 whitespace-nowrap min-w-[7rem] text-right">
                  +{country.phonecode}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchableTextPicker({
  value,
  onChange,
  disabled,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value);
  const filtered = options.filter((option) =>
    option.label.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-left bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-600 dark:disabled:text-gray-400"
      >
        {selected?.label || placeholder}
      </button>
      {open && !disabled && (
        <div className="absolute z-20 mt-2 w-[34rem] max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
          <div className="sticky top-0 z-10 p-3 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={placeholder}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto overscroll-contain">
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setQuery("");
                  setOpen(false);
                }}
                className="w-full px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-800 dark:text-gray-200 whitespace-normal"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
