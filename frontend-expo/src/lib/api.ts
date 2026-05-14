import axios from "axios";
import {
  clearSessionTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "./storage";
import type { ApiEnvelope, DashboardSummary, Thought, UserData } from "../types/app";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshingPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
  if (refreshingPromise) {
    return refreshingPromise;
  }

  refreshingPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await client.post<ApiEnvelope<{ accessToken: string; refreshToken: string }>>(
        "/auth/refresh-token",
        { refreshToken },
      );

      await setAccessToken(response.data.data.accessToken);
      await setRefreshToken(response.data.data.refreshToken);

      return response.data.data.accessToken;
    } catch {
      await clearSessionTokens();
      return null;
    } finally {
      refreshingPromise = null;
    }
  })();

  return refreshingPromise;
}

client.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config;
    if (
      error.response?.status === 401 &&
      !originalConfig?._retry &&
      !String(originalConfig?.url || "").includes("/auth/refresh-token")
    ) {
      originalConfig._retry = true;
      const nextAccessToken = await refreshAccessToken();
      if (nextAccessToken) {
        originalConfig.headers.Authorization = `Bearer ${nextAccessToken}`;
        return client(originalConfig);
      }
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong. Please try again.";

    return Promise.reject(new Error(message));
  },
);

export async function apiRegister(payload: {
  fullName: string;
  email: string;
  password: string;
}) {
  const { data } = await client.post<ApiEnvelope<{
    user: { id: string; email: string };
    accessToken?: string;
    refreshToken?: string;
  }>>(
    "/auth/register",
    payload,
  );
  return data;
}

export async function apiVerifyEmail(payload: { email: string; otp: string }) {
  const { data } = await client.post<ApiEnvelope<{ accessToken: string; refreshToken: string; user: UserData }>>(
    "/auth/verify-email",
    payload,
  );
  return data;
}

export async function apiResendOtp(email: string) {
  const { data } = await client.post<ApiEnvelope<{ message: string }>>("/auth/resend-otp", { email });
  return data;
}

export async function apiLogin(payload: { email: string; password: string }) {
  const { data } = await client.post<ApiEnvelope<{ accessToken: string; refreshToken: string; user: UserData }>>(
    "/auth/login",
    payload,
  );
  return data;
}

export async function apiForgotPassword(email: string) {
  const { data } = await client.post<ApiEnvelope<{ message: string }>>("/auth/forgot-password", { email });
  return data;
}

export async function apiResetPassword(token: string, newPassword: string) {
  const { data } = await client.post<ApiEnvelope<{ message: string }>>("/auth/reset-password", {
    token,
    newPassword,
  });
  return data;
}

export async function apiChangePassword(payload: { currentPassword: string; newPassword: string }) {
  const { data } = await client.post<ApiEnvelope<{ message: string }>>("/auth/change-password", payload);
  return data;
}

export async function apiLogout() {
  const refreshToken = await getRefreshToken();
  try {
    await client.post("/auth/logout", { refreshToken });
  } finally {
    await clearSessionTokens();
  }
}

export async function apiGetMe() {
  const { data } = await client.get<ApiEnvelope<UserData>>("/auth/me");
  return data;
}

export async function apiGetDashboardSummary() {
  const { data } = await client.get<ApiEnvelope<DashboardSummary>>("/dashboard/summary");
  return data;
}

export async function apiListThoughts(params?: {
  search?: string;
  category?: string;
  type?: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}) {
  const { data } = await client.get<ApiEnvelope<Thought[]>>("/thoughts", { params });
  return data;
}

export async function apiCreateThought(payload: {
  text: string;
  category: string;
  allowSharing: boolean;
  confidential: boolean;
  attachments?: Array<{
    type: "image" | "video";
    name: string;
    url: string;
    publicId?: string;
    size?: number;
    mimeType?: string;
  }>;
  revisitAt?: string | null;
}) {
  const { data } = await client.post<ApiEnvelope<Thought>>("/thoughts", payload);
  return data;
}

export async function apiUpdateThought(
  id: string,
  payload: Partial<{
    text: string;
    category: string;
    allowSharing: boolean;
    confidential: boolean;
    attachments: Array<{
      type: "image" | "video";
      name: string;
      url: string;
      publicId?: string;
      size?: number;
      mimeType?: string;
    }>;
    revisitAt: string | null;
  }>,
) {
  const { data } = await client.put<ApiEnvelope<Thought>>(`/thoughts/${id}`, payload);
  return data;
}

export async function apiAnalyzeThoughtDraft(payload: { text: string; category: string }) {
  const { data } = await client.post<ApiEnvelope<any>>("/thoughts/analyze", payload);
  return data;
}

export async function apiDeleteThought(id: string) {
  const { data } = await client.delete<ApiEnvelope<{ id: string }>>(`/thoughts/${id}`);
  return data;
}

export async function apiUpdateProfile(payload: Partial<UserData["profile"]>) {
  const { data } = await client.put<ApiEnvelope<UserData["profile"]>>("/profile", payload);
  return data;
}

export async function apiUpdateSettings(payload: Partial<UserData["settings"]>) {
  const { data } = await client.put<ApiEnvelope<UserData["settings"]>>("/settings", payload);
  return data;
}

export async function apiRegisterPushToken(payload: {
  token: string;
  platform: "ios" | "android" | "web";
}) {
  const { data } = await client.post<ApiEnvelope<{ registered: boolean; totalTokens: number }>>(
    "/settings/push-token",
    payload,
  );
  return data;
}

export async function apiChangePin(payload: { currentPin?: string; newPin: string }) {
  const { data } = await client.post<ApiEnvelope<{ updated: boolean }>>("/settings/change-pin", payload);
  return data;
}

export async function apiChangeRegisteredPhone(payload: {
  phoneCountryIso: string;
  phoneNumber: string;
}) {
  const { data } = await client.post<ApiEnvelope<{ phoneCountryIso: string; phoneNumber: string }>>(
    "/settings/change-phone",
    payload,
  );
  return data;
}

export async function apiExportCsv() {
  const response = await client.get("/exports/thoughts/csv", {
    responseType: "arraybuffer",
  });
  return response.data as ArrayBuffer;
}

export async function apiExportPdf() {
  const response = await client.get("/exports/thoughts/pdf", {
    responseType: "arraybuffer",
  });
  return response.data as ArrayBuffer;
}

export { client };
