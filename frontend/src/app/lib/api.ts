import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
const STORAGE_KEY = "chintana-auth-token";

/**
 * Centralized Axios client for all API requests.
 * - Automatically injects the JWT token from localStorage.
 * - On 401 responses, clears the stored token and redirects to login.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ── Request interceptor: attach token ────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: normalize errors & handle 401 ──────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEY);
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }

    const message =
      error.response?.data?.message || error.message || "Something went wrong.";
    return Promise.reject(new Error(message));
  },
);

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function apiRegister(payload: {
  fullName: string;
  email: string;
  password: string;
  twoFactorAuth: boolean;
}) {
  const { data } = await apiClient.post("/auth/register", payload);
  return data;
}

export async function apiLogin(email: string, password: string) {
  const { data } = await apiClient.post("/auth/login", { email, password });
  return data;
}

export async function apiCheckEmail(email: string, purpose: "login" | "register") {
  const { data } = await apiClient.post("/auth/check-email", { email, purpose });
  return data;
}

export async function apiGoogleLogin(credential: string) {
  const { data } = await apiClient.post("/auth/google", { credential });
  return data;
}

export async function apiVerifyEmail(payload: { email: string; otp: string }) {
  const { data } = await apiClient.post("/auth/verify-email", payload);
  return data;
}

export async function apiResendOtp(email: string) {
  const { data } = await apiClient.post("/auth/resend-otp", { email });
  return data;
}

export async function apiGetMe() {
  const { data } = await apiClient.get("/auth/me");
  return data;
}

export async function apiForgotPassword(email: string) {
  const { data } = await apiClient.post("/auth/forgot-password", { email });
  return data;
}

export async function apiResetPassword(payload: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const { data } = await apiClient.post("/auth/reset-password", payload);
  return data;
}

export async function apiChangePassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const { data } = await apiClient.post("/auth/change-password", payload);
  return data;
}

export async function apiDeleteAccount() {
  const { data } = await apiClient.delete("/auth/account");
  return data;
}

export async function apiLogout(refreshToken?: string) {
  const { data } = await apiClient.post("/auth/logout", refreshToken ? { refreshToken } : {});
  return data;
}

// ── Thoughts ─────────────────────────────────────────────────────────────────

export async function apiListThoughts(params?: {
  search?: string;
  category?: string;
  type?: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}) {
  const { data } = await apiClient.get("/thoughts", { params });
  return data;
}

export async function apiGetThought(id: string) {
  const { data } = await apiClient.get(`/thoughts/${id}`);
  return data;
}

export async function apiCreateThought(payload: any) {
  const { data } = await apiClient.post("/thoughts", payload);
  return data;
}

export async function apiUpdateThought(id: string, payload: any) {
  const { data } = await apiClient.put(`/thoughts/${id}`, payload);
  return data;
}

export async function apiDeleteThought(id: string) {
  const { data } = await apiClient.delete(`/thoughts/${id}`);
  return data;
}

export async function apiDeleteAllThoughts() {
  const { data } = await apiClient.delete("/thoughts");
  return data;
}

export async function apiAnalyzeThought(payload: { text: string; category: string }) {
  const { data } = await apiClient.post("/thoughts/analyze", payload);
  return data;
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function apiGetDashboardSummary() {
  const { data } = await apiClient.get("/dashboard/summary");
  return data;
}

// ── Profile ──────────────────────────────────────────────────────────────────

export async function apiGetProfile() {
  const { data } = await apiClient.get("/profile");
  return data;
}

export async function apiUpdateProfile(payload: any) {
  const { data } = await apiClient.put("/profile", payload);
  return data;
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function apiGetSettings() {
  const { data } = await apiClient.get("/settings");
  return data;
}

export async function apiUpdateSettings(payload: any) {
  const { data } = await apiClient.put("/settings", payload);
  return data;
}

export async function apiExportThoughtsPdf(params?: {
  search?: string;
  category?: string;
  type?: string;
  sort?: string;
  order?: string;
  dateFrom?: string;
  dateTo?: string;
  minScore?: number;
  maxScore?: number;
}) {
  const response = await apiClient.get("/exports/thoughts/pdf", {
    params,
    responseType: "blob",
  });

  return response.data as Blob;
}

// ── Contacts ─────────────────────────────────────────────────────────────────

export async function apiListContacts(params?: {
  search?: string;
  influence?: string;
  sort?: string;
  order?: string;
}) {
  const { data } = await apiClient.get("/contacts", { params });
  return data;
}

export async function apiGetContact(id: string) {
  const { data } = await apiClient.get(`/contacts/${id}`);
  return data;
}

export async function apiCreateContact(payload: any) {
  const { data } = await apiClient.post("/contacts", payload);
  return data;
}

export async function apiUpdateContact(id: string, payload: any) {
  const { data } = await apiClient.put(`/contacts/${id}`, payload);
  return data;
}

export async function apiDeleteContact(id: string) {
  const { data } = await apiClient.delete(`/contacts/${id}`);
  return data;
}

export async function apiGetContactStats() {
  const { data } = await apiClient.get("/contacts/stats");
  return data;
}

// ── File Upload ──────────────────────────────────────────────────────────────

export async function apiUploadFile(
  file: File,
  expectedType: "image" | "video",
  onProgress?: (percent: number) => void,
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("expectedType", expectedType);

  const { data } = await apiClient.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });

  return data;
}

export default apiClient;
