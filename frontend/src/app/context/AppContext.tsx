import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  apiGoogleLogin,
  apiRegister,
  apiLogin,
  apiLogout,
  apiVerifyEmail,
  apiResendOtp,
  apiGetMe,
  apiListThoughts,
  apiCreateThought,
  apiUpdateThought,
  apiDeleteThought,
  apiDeleteAllThoughts,
  apiAnalyzeThought,
  apiGetDashboardSummary,
  apiUpdateProfile,
  apiUpdateSettings,
} from "../lib/api";

const STORAGE_KEY = "chintana-auth-token";

export const THOUGHT_CATEGORIES = [
  "Business",
  "IT",
  "Personal",
  "Emotional",
  "Strategic",
  "Creative",
  "Health",
  "Financial",
  "Relationship",
  "Career",
  "Education",
  "Family",
  "Travel",
  "Spiritual",
  "Others",
] as const;

export type ThoughtCategory = (typeof THOUGHT_CATEGORIES)[number];
export type ThoughtType = "Constructive" | "Destructive" | "Neutral";

export interface ThoughtAttachment {
  id: string;
  type: "image" | "video";
  name: string;
  url: string;
}

export interface Thought {
  id: string;
  text: string;
  category: ThoughtCategory;
  type: ThoughtType;
  score: number;
  classification: string;
  energyImpact: "energizing" | "neutral" | "draining";
  suggestion: string;
  allowSharing: boolean;
  confidential: boolean;
  attachments: ThoughtAttachment[];
  aiMeta?: {
    source?: string;
    model?: string;
    cacheHit?: boolean;
    confidence?: number;
    pipeline?: string;
  };
  emotionalInsights?: {
    emotionalTone?: string;
    constructiveness?: string;
    distressLevel?: string;
    resilienceLevel?: string;
    actionOrientation?: string;
    cognitiveDistortion?: string;
    emotionalIntensity?: number;
    copingIndicators?: string[];
    riskSignals?: string[];
    confidence?: number;
    summary?: string;
    recommendation?: string;
    safety?: {
      riskLevel?: string;
      crisisDetected?: boolean;
      reasons?: string[];
      confidence?: number;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phoneCountryIso: string;
  phoneNumber: string;
  phoneType: string;
}

export interface ProfileData {
  fullName: string;
  email: string;
  phoneCountryIso: string;
  phoneNumber: string;
  phoneType: string;
  dateOfBirth: string;
  gender: string;
  education: string;
  occupation: string;
  designation: string;
  yearsOfExperience: string;
  countryIso: string;
  stateCode: string;
  city: string;
  streetAddress: string;
  pincode: string;
  currencyCode: string;
  monthlyIncome: string;
  additionalAnnualIncome: string;
  photoDataUrl: string;
  emergencyContacts: EmergencyContact[];
}

export interface SettingsData {
  twoFactorAuth: boolean;
  dataEncryption: boolean;
  autoDelete: boolean;
  notifications: boolean;
}



interface AccountData {
  id: string;
  email: string;
  registeredFullName: string;
  createdAt: string;
  profile: ProfileData;
  settings: SettingsData;
  thoughts: Thought[];
}

interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  twoFactorAuth: boolean;
}

interface AuthActionResult {
  ok: boolean;
  message?: string;
  requiresVerification?: boolean;
}

interface SaveThoughtPayload {
  text: string;
  category: ThoughtCategory;
  allowSharing: boolean;
  confidential: boolean;
  attachments: ThoughtAttachment[];
}

export interface MentalLoadMetrics {
  mentalLoadScore: number;
  energyDistribution: {
    energizing: number;
    neutral: number;
    draining: number;
  };
  stressLevels: {
    minimal: number;
    low: number;
    moderate: number;
    high: number;
  };
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  averageScore: number;
}

export interface DashboardSummary {
  totalThoughts: number;
  averageCognitiveScore: number | null;
  weeklyCognitiveStability: Array<{ day: string; date: string; score: number | null }>;
  weeklyCognitiveStabilityMeta: {
    mode: "recent" | "activity";
    title: string;
    subtitle: string;
  };
  thoughtDistribution: Array<{ name: string; value: number | null; count: number }>;
  mentalLoadMetrics: MentalLoadMetrics | null;
  categoryBreakdown: CategoryBreakdown[];
  latestThoughts: Thought[];
}

export interface ThoughtAnalysisResult {
  type: ThoughtType;
  score: number;
  classification: string;
  energyImpact: "energizing" | "neutral" | "draining";
  suggestion: string;
  emotionalInsights?: Thought["emotionalInsights"];
  aiMeta?: {
    source?: string;
    model?: string;
    cacheHit?: boolean;
    confidence?: number;
    pipeline?: string;
  };
}

interface AppContextValue {
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  currentAccount: AccountData | null;
  currentThoughts: Thought[];
  dashboardSummary: DashboardSummary | null;
  register: (payload: RegisterPayload) => Promise<AuthActionResult>;
  verifyEmail: (email: string, otp: string) => Promise<AuthActionResult>;
  resendOtp: (email: string) => Promise<AuthActionResult>;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  loginWithGoogle: (credential: string) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
  analyzeThoughtDraft: (
    payload: Pick<SaveThoughtPayload, "text" | "category">,
  ) => Promise<ThoughtAnalysisResult>;
  saveThought: (payload: SaveThoughtPayload, thoughtId?: string) => Promise<Thought>;
  deleteThought: (thoughtId: string) => Promise<void>;
  deleteAllThoughts: () => Promise<number>;
  getThoughtById: (thoughtId: string) => Thought | undefined;
  updateProfile: (profile: ProfileData) => Promise<void>;
  updateSettings: (settings: Partial<SettingsData>) => Promise<void>;
  refreshSession: () => Promise<void>;
}

interface UserResponse {
  id: string;
  fullName: string;
  email: string;
  profile: ProfileData;
  settings: SettingsData;
  createdAt: string;
}

function getStoredToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEY) || "";
}

function setStoredToken(token: string) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(STORAGE_KEY, token);
  else window.localStorage.removeItem(STORAGE_KEY);
}

function normalizeThought(raw: any): Thought {
  return {
    id: String(raw._id || raw.id),
    text: raw.text || "",
    category: raw.category,
    type: raw.type,
    score: raw.score,
    classification: raw.classification,
    energyImpact: raw.energyImpact,
    suggestion: raw.suggestion,
    allowSharing: Boolean(raw.allowSharing),
    confidential: Boolean(raw.confidential),
    attachments: (raw.attachments || []).map((attachment: any) => ({
      id: String(attachment._id || attachment.id),
      type: attachment.type,
      name: attachment.name,
      url: attachment.url,
    })),
    aiMeta: raw.aiMeta || undefined,
    emotionalInsights: raw.emotionalInsights || undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function normalizeContact(raw: any): ContactData {
  return {
    id: String(raw._id || raw.id),
    name: raw.name || "",
    email: raw.email || "",
    phone: raw.phone || "",
    phoneCountryIso: raw.phoneCountryIso || "IN",
    relation: raw.relation || "Other",
    influence: raw.influence || "neutral",
    notes: raw.notes || "",
    productivityScore: raw.productivityScore ?? 50,
    interactionFrequency: raw.interactionFrequency || "Low",
    totalInteractions: raw.totalInteractions ?? 0,
    averageThoughtScore: raw.averageThoughtScore ?? 0,
    trend: raw.trend || "stable",
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function normalizeAccount(user: UserResponse, thoughts: Thought[]): AccountData {
  return {
    id: user.id,
    email: user.email,
    registeredFullName: user.fullName,
    createdAt: user.createdAt,
    profile: {
      ...user.profile,
      emergencyContacts: (user.profile?.emergencyContacts || []).map((contact: any) => ({
        id: String(contact._id || contact.id),
        name: contact.name || "",
        relation: contact.relation || "Parent",
        phoneCountryIso: contact.phoneCountryIso || "IN",
        phoneNumber: contact.phoneNumber || "",
        phoneType: contact.phoneType || "Mobile",
      })),
    },
    settings: user.settings,
    thoughts,
  };
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState(getStoredToken);
  const [currentAccount, setCurrentAccount] = useState<AccountData | null>(null);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);

  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const refreshDashboardSummary = async (activeToken = token) => {
    if (!activeToken) {
      setDashboardSummary(null);
      return;
    }

    try {
      const response = await apiGetDashboardSummary();
      setDashboardSummary({
        ...response.data,
        latestThoughts: (response.data.latestThoughts || []).map(normalizeThought),
      });
    } catch {
      setDashboardSummary(null);
    }
  };

  const refreshSession = async (activeToken = token) => {
    if (!activeToken) {
      setCurrentAccount(null);
      setDashboardSummary(null);
      setIsBootstrapping(false);
      return;
    }

    try {
      const [userResponse, thoughtsResponse] = await Promise.all([
        apiGetMe(),
        apiListThoughts(),
      ]);

      const thoughts = (thoughtsResponse.data || []).map(normalizeThought);
      setCurrentAccount(normalizeAccount(userResponse.data, thoughts));
      await refreshDashboardSummary(activeToken);
    } catch {
      setCurrentAccount(null);
      setDashboardSummary(null);
      setToken("");
      setStoredToken("");
    } finally {
      setIsBootstrapping(false);
    }
  };

  useEffect(() => {
    void refreshSession();
  }, [token]);



  const value = useMemo<AppContextValue>(() => {
    return {
      isAuthenticated: Boolean(currentAccount && token),
      isBootstrapping,
      currentAccount,
      currentThoughts: currentAccount?.thoughts ?? [],
      dashboardSummary,

      async register(payload) {
        try {
          const response = await apiRegister(payload);
          const nextToken = response.data?.accessToken || response.data?.token || "";

          if (nextToken) {
            setIsBootstrapping(true);
            setToken(nextToken);
            setStoredToken(nextToken);
            await refreshSession(nextToken);
          }

          return {
            ok: true,
            message: response.message,
            requiresVerification: !nextToken,
          };
        } catch (error) {
          return { ok: false, message: (error as Error).message };
        }
      },
      async verifyEmail(email, otp) {
        try {
          const response = await apiVerifyEmail({ email, otp });
          const nextToken = response.data?.accessToken || response.data?.token || "";
          if (!nextToken) {
            return { ok: false, message: "Email verified, but no access token was returned." };
          }

          setIsBootstrapping(true);
          setToken(nextToken);
          setStoredToken(nextToken);
          await refreshSession(nextToken);
          return { ok: true, message: response.message || "Email verified." };
        } catch (error) {
          return { ok: false, message: (error as Error).message };
        }
      },
      async resendOtp(email) {
        try {
          const response = await apiResendOtp(email);
          return { ok: true, message: response.message || "OTP sent." };
        } catch (error) {
          return { ok: false, message: (error as Error).message };
        }
      },
      async login(email, password) {
        try {
          const response = await apiLogin(email, password);
          const nextToken = response.data?.accessToken || response.data?.token || "";
          if (!nextToken) {
            return { ok: false, message: "Login succeeded, but no access token was returned." };
          }

          setIsBootstrapping(true);
          setToken(nextToken);
          setStoredToken(nextToken);
          await refreshSession(nextToken);
          return { ok: true };
        } catch (error) {
          return { ok: false, message: (error as Error).message };
        }
      },
      async loginWithGoogle(credential) {
        try {
          const response = await apiGoogleLogin(credential);
          const nextToken = response.data?.accessToken || response.data?.token || "";
          if (!nextToken) {
            return { ok: false, message: "Login succeeded, but no access token was returned." };
          }

          setIsBootstrapping(true);
          setToken(nextToken);
          setStoredToken(nextToken);
          await refreshSession(nextToken);
          return { ok: true, message: response.message };
        } catch (error) {
          return { ok: false, message: (error as Error).message || "Google sign-in failed." };
        }
      },
      async logout() {
        try {
          await apiLogout();
        } catch {
          // Local cleanup must still proceed even if server logout fails.
        }
        setCurrentAccount(null);
        setDashboardSummary(null);
        setToken("");
        setStoredToken("");
      },
      async analyzeThoughtDraft(payload) {
        if (!token) throw new Error("Authentication required");
        const response = await apiAnalyzeThought(payload);
        return response.data;
      },
      async saveThought(payload, thoughtId) {
        if (!token) throw new Error("Authentication required");

        const response = thoughtId
          ? await apiUpdateThought(thoughtId, payload)
          : await apiCreateThought(payload);

        const thought = normalizeThought(response.data);
        setCurrentAccount((previous) => {
          if (!previous) return previous;
          const exists = previous.thoughts.some((item) => item.id === thought.id);
          const thoughts = exists
            ? previous.thoughts.map((item) => (item.id === thought.id ? thought : item))
            : [thought, ...previous.thoughts];
          return { ...previous, thoughts };
        });
        await refreshDashboardSummary();
        return thought;
      },
      async deleteThought(thoughtId) {
        if (!token) throw new Error("Authentication required");
        await apiDeleteThought(thoughtId);
        setCurrentAccount((previous) =>
          previous
            ? {
                ...previous,
                thoughts: previous.thoughts.filter((thought) => thought.id !== thoughtId),
              }
            : previous,
        );
        await refreshDashboardSummary();
      },
      async deleteAllThoughts() {
        if (!token) throw new Error("Authentication required");
        const response = await apiDeleteAllThoughts();
        const deletedCount = Number(response?.data?.deletedCount || 0);

        setCurrentAccount((previous) =>
          previous
            ? {
                ...previous,
                thoughts: [],
              }
            : previous,
        );
        await refreshDashboardSummary();
        return deletedCount;
      },
      getThoughtById(thoughtId) {
        return currentAccount?.thoughts.find((thought) => thought.id === thoughtId);
      },
      async updateProfile(profile) {
        if (!token) throw new Error("Authentication required");
        const response = await apiUpdateProfile(profile);

        setCurrentAccount((previous) =>
          previous
            ? {
                ...previous,
                email: response.data.email || profile.email,
                registeredFullName: response.data.fullName || profile.fullName,
                profile: {
                  ...response.data,
                  emergencyContacts: (response.data.emergencyContacts || []).map((contact: any) => ({
                    id: String(contact._id || contact.id),
                    name: contact.name || "",
                    relation: contact.relation || "Parent",
                    phoneCountryIso: contact.phoneCountryIso || "IN",
                    phoneNumber: contact.phoneNumber || "",
                    phoneType: contact.phoneType || "Mobile",
                  })),
                },
              }
            : previous,
        );
        await refreshDashboardSummary();
      },
      async updateSettings(settings) {
        if (!token) throw new Error("Authentication required");
        const response = await apiUpdateSettings(settings);

        setCurrentAccount((previous) =>
          previous
            ? {
                ...previous,
                settings: response.data,
              }
            : previous,
        );
      },
      refreshSession,
    };
  }, [currentAccount, dashboardSummary, isBootstrapping, token]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }

  return context;
}

export function getInitials(account: AccountData | null) {
  const name = account?.profile.fullName || account?.registeredFullName || account?.email || "";
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "N";
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();
  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

export function getDisplayName(account: AccountData | null) {
  return account?.profile.fullName || account?.registeredFullName || account?.email || "User";
}
