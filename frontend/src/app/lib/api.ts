import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const STORAGE_KEY = "chintana-auth-token";

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not defined in environment variables");
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ── Attach JWT token ─────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Handle errors globally ────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.href = "/";
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong.";

    return Promise.reject(new Error(message));
  }
);

// ── AUTH ──────────────────────────────────────────
export async function apiRegister(payload: any) {
  const { data } = await apiClient.post("/auth/register", payload);
  return data;
}

export async function apiLogin(email: string, password: string) {
  const { data } = await apiClient.post("/auth/login", { email, password });
  return data;
}

export async function apiCheckEmail(
  email: string,
  purpose: "login" | "register"
) {
  const { data } = await apiClient.post("/auth/check-email", {
    email,
    purpose,
  });
  return data;
}

export async function apiVerifyEmail(payload: any) {
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

export default apiClient;
