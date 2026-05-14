import NetInfo from "@react-native-community/netinfo";
import * as LocalAuthentication from "expo-local-authentication";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import {
  apiAnalyzeThoughtDraft,
  apiChangePassword,
  apiChangePin,
  apiChangeRegisteredPhone,
  apiCreateThought,
  apiDeleteThought,
  apiGetDashboardSummary,
  apiGetMe,
  apiListThoughts,
  apiLogin,
  apiLogout,
  apiRegisterPushToken,
  apiRegister,
  apiResendOtp,
  apiUpdateThought,
  apiUpdateProfile,
  apiUpdateSettings,
  apiVerifyEmail,
} from "../lib/api";
import { registerPushToken as registerDevicePushToken } from "../hooks/usePushNotifications";
import {
  clearSessionTokens,
  getAccessToken,
  getOfflineQueue,
  isOnboardingComplete,
  pushOfflineQueueItem,
  setAccessToken,
  setOfflineQueue,
  setOnboardingComplete,
  setRefreshToken,
} from "../lib/storage";
import type {
  DashboardSummary,
  SettingsData,
  Thought,
  ThoughtCategory,
  UserData,
} from "../types/app";

export const THOUGHT_CATEGORIES: ThoughtCategory[] = [
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
];

interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

interface AppContextValue {
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  biometricLocked: boolean;
  needsOnboarding: boolean;
  isOnline: boolean;
  user: UserData | null;
  thoughts: Thought[];
  dashboard: DashboardSummary | null;
  register: (input: RegisterInput) => Promise<{ ok: boolean; message: string }>;
  verifyEmail: (email: string, otp: string) => Promise<{ ok: boolean; message: string }>;
  resendOtp: (email: string) => Promise<{ ok: boolean; message: string }>;
  login: (email: string, password: string) => Promise<{ ok: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  unlockWithBiometric: () => Promise<boolean>;
  completeOnboarding: () => Promise<void>;
  analyzeThoughtDraft: (payload: { text: string; category: string }) => Promise<any>;
  saveThought: (payload: {
    text: string;
    category: ThoughtCategory;
    allowSharing: boolean;
    confidential: boolean;
    attachments?: Thought["attachments"];
    revisitAt?: string | null;
  }, thoughtId?: string) => Promise<{ ok: boolean; offline: boolean; message: string; thoughtId?: string }>;
  deleteThought: (id: string) => Promise<void>;
  getThoughtById: (id: string) => Thought | undefined;
  updateProfile: (payload: Partial<UserData["profile"]>) => Promise<void>;
  updateSettings: (payload: Partial<SettingsData>) => Promise<void>;
  changePassword: (payload: { currentPassword: string; newPassword: string }) => Promise<{ ok: boolean; message: string }>;
  changePin: (payload: { currentPin?: string; newPin: string }) => Promise<{ ok: boolean; message: string }>;
  changeRegisteredPhone: (payload: { phoneCountryIso: string; phoneNumber: string }) => Promise<{ ok: boolean; message: string }>;
}

const AppContext = createContext<AppContextValue | null>(null);

function normalizeThought(raw: any): Thought {
  return {
    id: String(raw.id || raw._id),
    text: raw.text || "",
    category: raw.category,
    type: raw.type,
    score: raw.score,
    classification: raw.classification,
    energyImpact: raw.energyImpact,
    stressLevel: raw.stressLevel || "low",
    suggestion: raw.suggestion,
    emotionalInsights: raw.emotionalInsights || undefined,
    aiMeta: raw.aiMeta || undefined,
    allowSharing: Boolean(raw.allowSharing),
    confidential: Boolean(raw.confidential),
    attachments: (raw.attachments || []).map((item: any) => ({
      id: String(item.id || item._id || Math.random()),
      type: item.type,
      name: item.name,
      url: item.url,
      publicId: item.publicId,
      size: item.size,
      mimeType: item.mimeType,
    })),
    revisitAt: raw.revisitAt || null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

async function maybeBiometricGate(user: UserData | null) {
  if (!user?.settings?.biometricEnabled) {
    return true;
  }

  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || !isEnrolled) {
    return true;
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock Chintana",
    fallbackLabel: "Use device passcode",
  });

  return result.success;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [biometricLocked, setBiometricLocked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);

  const hydrateSession = async () => {
    const [token, onboardingDone] = await Promise.all([
      getAccessToken(),
      isOnboardingComplete(),
    ]);

    setNeedsOnboarding(!onboardingDone);

    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setThoughts([]);
      setDashboard(null);
      return;
    }

    try {
      const me = await apiGetMe();
      const allow = await maybeBiometricGate(me.data);
      if (!allow) {
        setBiometricLocked(true);
        return;
      }

      setBiometricLocked(false);
      setUser(me.data);
      setIsAuthenticated(true);

      const [thoughtsResponse, dashboardResponse] = await Promise.all([
        apiListThoughts({ limit: 100 }),
        apiGetDashboardSummary(),
      ]);

      setThoughts((thoughtsResponse.data || []).map(normalizeThought));
      setDashboard(dashboardResponse.data || null);
    } catch {
      await clearSessionTokens();
      setIsAuthenticated(false);
      setUser(null);
      setThoughts([]);
      setDashboard(null);
    }
  };

  const syncOfflineQueue = async () => {
    if (!isOnline || !isAuthenticated) return;

    const queue = await getOfflineQueue();
    if (queue.length === 0) return;

    const remaining = [] as typeof queue;

    for (const item of queue) {
      try {
        if (item.type === "CREATE_THOUGHT") {
          await apiCreateThought(item.payload as any);
        }
      } catch {
        remaining.push(item);
      }
    }

    await setOfflineQueue(remaining);

    if (remaining.length === 0) {
      await refreshSession();
    }
  };

  const refreshSession = async () => {
    await hydrateSession();
    await syncOfflineQueue();
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected));
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    void (async () => {
      await hydrateSession();
      setIsBootstrapping(false);
    })();
  }, []);

  useEffect(() => {
    if (isOnline) {
      void syncOfflineQueue();
    }
  }, [isOnline, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !isOnline) return;

    void (async () => {
      try {
        const token = await registerDevicePushToken();
        if (!token) return;

        const platform = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
        await apiRegisterPushToken({ token, platform });
      } catch {
        // Non-blocking: push token registration failures should not interrupt app usage.
      }
    })();
  }, [isAuthenticated, isOnline]);

  const value = useMemo<AppContextValue>(
    () => ({
      isBootstrapping,
      isAuthenticated,
      biometricLocked,
      needsOnboarding,
      isOnline,
      user,
      thoughts,
      dashboard,

      async register(input) {
        try {
          const response = await apiRegister(input);
          if (response.data?.accessToken && response.data?.refreshToken) {
            await setAccessToken(response.data.accessToken);
            await setRefreshToken(response.data.refreshToken);
            await refreshSession();
          }

          return {
            ok: true,
            message: response.message || "Account created. Check your email OTP.",
          };
        } catch (error) {
          return { ok: false, message: (error as Error).message };
        }
      },

      async verifyEmail(email, otp) {
        try {
          const response = await apiVerifyEmail({ email, otp });
          await setAccessToken(response.data.accessToken);
          await setRefreshToken(response.data.refreshToken);
          await refreshSession();
          return { ok: true, message: "Email verified." };
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
          const response = await apiLogin({ email, password });
          await setAccessToken(response.data.accessToken);
          await setRefreshToken(response.data.refreshToken);
          await refreshSession();
          return { ok: true, message: "Welcome back." };
        } catch (error) {
          return { ok: false, message: (error as Error).message };
        }
      },

      async logout() {
        await apiLogout();
        setUser(null);
        setThoughts([]);
        setDashboard(null);
        setIsAuthenticated(false);
        setBiometricLocked(false);
      },

      async refreshSession() {
        await refreshSession();
      },

      async unlockWithBiometric() {
        const allow = await maybeBiometricGate(user);
        setBiometricLocked(!allow);
        return allow;
      },

      async completeOnboarding() {
        await setOnboardingComplete();
        setNeedsOnboarding(false);
      },

      async analyzeThoughtDraft(payload) {
        const response = await apiAnalyzeThoughtDraft(payload);
        return response.data;
      },

      async saveThought(payload, thoughtId) {
        const normalizedPayload = {
          ...payload,
          allowSharing: payload.confidential ? false : payload.allowSharing,
        };

        if (!isOnline && thoughtId) {
          return {
            ok: false,
            offline: true,
            message: "Editing while offline is not supported yet.",
          };
        }

        if (!isOnline && !thoughtId) {
          const now = Date.now();
          await pushOfflineQueueItem({
            id: String(now),
            type: "CREATE_THOUGHT",
            payload: normalizedPayload,
            createdAt: new Date().toISOString(),
          });

          const queuedThoughtId = `offline-${now}`;
          const queuedThought: Thought = {
            id: queuedThoughtId,
            text: payload.text,
            category: payload.category,
            type: "Neutral",
            score: 50,
            classification: "Queued Offline",
            energyImpact: "neutral",
            stressLevel: "low",
            suggestion: "This thought is queued and will sync when you are online.",
            allowSharing: normalizedPayload.allowSharing,
            confidential: payload.confidential,
            attachments: payload.attachments || [],
            revisitAt: payload.revisitAt || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          setThoughts((current) => [queuedThought, ...current]);

          return {
            ok: true,
            offline: true,
            message: "Saved offline. Will sync automatically.",
            thoughtId: queuedThoughtId,
          };
        }

        let savedThoughtId = thoughtId;
        if (thoughtId) {
          const response = await apiUpdateThought(thoughtId, normalizedPayload);
          const thoughtData = response.data as any;
          savedThoughtId = String(thoughtData.id || thoughtData._id || thoughtId);
        } else {
          const response = await apiCreateThought(normalizedPayload);
          const thoughtData = response.data as any;
          savedThoughtId = String(thoughtData.id || thoughtData._id || "");
        }

        await refreshSession();
        return {
          ok: true,
          offline: false,
          message: thoughtId ? "Thought updated." : "Thought saved.",
          thoughtId: savedThoughtId,
        };
      },

      async deleteThought(id) {
        await apiDeleteThought(id);
        setThoughts((current) => current.filter((thought) => thought.id !== id));
      },

      getThoughtById(id) {
        return thoughts.find((thought) => thought.id === id);
      },

      async updateProfile(payload) {
        const response = await apiUpdateProfile(payload);
        setUser((current) =>
          current
            ? {
                ...current,
                profile: {
                  ...current.profile,
                  ...response.data,
                },
              }
            : current,
        );
      },

      async updateSettings(payload) {
        const response = await apiUpdateSettings(payload);
        setUser((current) =>
          current
            ? {
                ...current,
                settings: {
                  ...current.settings,
                  ...response.data,
                },
              }
            : current,
        );
      },

      async changePassword(payload) {
        try {
          await apiChangePassword(payload);
          await apiLogout();
          setUser(null);
          setThoughts([]);
          setDashboard(null);
          setIsAuthenticated(false);
          setBiometricLocked(false);
          return {
            ok: true,
            message: "Password changed successfully. Please login again.",
          };
        } catch (error) {
          return { ok: false, message: (error as Error).message };
        }
      },

      async changePin(payload) {
        try {
          await apiChangePin(payload);
          return { ok: true, message: "PIN updated successfully." };
        } catch (error) {
          return { ok: false, message: (error as Error).message };
        }
      },

      async changeRegisteredPhone(payload) {
        try {
          const response = await apiChangeRegisteredPhone(payload);
          setUser((current) =>
            current
              ? {
                  ...current,
                  profile: {
                    ...current.profile,
                    phoneCountryIso: response.data.phoneCountryIso,
                    phoneNumber: response.data.phoneNumber,
                  },
                }
              : current,
          );
          return { ok: true, message: "Registered phone number updated." };
        } catch (error) {
          return { ok: false, message: (error as Error).message };
        }
      },
    }),
    [
      isBootstrapping,
      isAuthenticated,
      biometricLocked,
      needsOnboarding,
      isOnline,
      user,
      thoughts,
      dashboard,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }
  return context;
}
