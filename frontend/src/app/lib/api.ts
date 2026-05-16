import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

const STORAGE_KEY = "chintana-auth-token";

if (!API_BASE_URL) {
  throw new Error(
    "VITE_API_BASE_URL is not defined in environment variables"
  );
}

/* =========================================
   AXIOS CLIENT
========================================= */

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

/* =========================================
   ATTACH JWT TOKEN
========================================= */

apiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(STORAGE_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  }
);

/* =========================================
   GLOBAL ERROR HANDLER
========================================= */

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

    return Promise.reject(
      new Error(message)
    );
  }
);

/* =========================================
   AUTH APIs
========================================= */

export async function apiRegister(
  payload: any
) {
  const { data } = await apiClient.post(
    "/auth/register",
    payload
  );

  return data;
}

export async function apiLogin(
  email: string,
  password: string
) {
  const { data } = await apiClient.post(
    "/auth/login",
    {
      email,
      password,
    }
  );

  return data;
}

/* =========================================
   GOOGLE LOGIN
========================================= */

export async function apiGoogleLogin(
  credential: string
) {
  const { data } = await apiClient.post(
    "/auth/google",
    {
      credential,
    }
  );

  return data;
}

/* =========================================
   LOGOUT
========================================= */

export async function apiLogout() {
  const { data } = await apiClient.post(
    "/auth/logout"
  );

  return data;
}

export async function apiCheckEmail(
  email: string,
  purpose: "login" | "register"
) {
  const { data } = await apiClient.post(
    "/auth/check-email",
    {
      email,
      purpose,
    }
  );

  return data;
}

export async function apiVerifyEmail(
  payload: any
) {
  const { data } = await apiClient.post(
    "/auth/verify-email",
    payload
  );

  return data;
}

export async function apiResendOtp(
  email: string
) {
  const { data } = await apiClient.post(
    "/auth/resend-otp",
    { email }
  );

  return data;
}

export async function apiForgotPassword(
  email: string
) {
  const { data } = await apiClient.post(
    "/auth/forgot-password",
    { email }
  );

  return data;
}

export async function apiResetPassword(
  payload: any
) {
  const { data } = await apiClient.post(
    "/auth/reset-password",
    payload
  );

  return data;
}

export async function apiChangePassword(
  payload: any
) {
  const { data } = await apiClient.post(
    "/auth/change-password",
    payload
  );

  return data;
}

export async function apiDeleteAccount() {
  const { data } = await apiClient.delete(
    "/auth/account"
  );

  return data;
}

export async function apiGetMe() {
  const { data } = await apiClient.get(
    "/auth/me"
  );

  return data;
}

/* =========================================
   DASHBOARD APIs
========================================= */

export async function apiGetDashboardSummary() {
  const { data } = await apiClient.get(
    "/dashboard/summary"
  );

  return data;
}

/* =========================================
   THOUGHT APIs
========================================= */

export async function apiListThoughts() {
  const { data } = await apiClient.get(
    "/thoughts"
  );

  return data;
}

export async function apiCreateThought(
  payload: any
) {
  const { data } = await apiClient.post(
    "/thoughts",
    payload
  );

  return data;
}

export async function apiAnalyzeThought(
  payload: any
) {
  const { data } = await apiClient.post(
    "/thoughts/analyze",
    payload
  );

  return data;
}

export async function apiUpdateThought(
  id: string,
  payload: any
) {
  const { data } = await apiClient.put(
    `/thoughts/${id}`,
    payload
  );

  return data;
}

export async function apiDeleteThought(
  id: string
) {
  const { data } = await apiClient.delete(
    `/thoughts/${id}`
  );

  return data;
}

export async function apiDeleteAllThoughts() {
  const { data } = await apiClient.delete(
    "/thoughts"
  );

  return data;
}

export async function apiUploadFile(
  file: File,
  expectedType: "image" | "video",
  onProgress?: (percent: number) => void
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("expectedType", expectedType);

  const { data } = await apiClient.post(
    "/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(
          Math.round((event.loaded * 100) / event.total)
        );
      },
    }
  );

  return data;
}

export async function apiExportThoughtsPdf() {
  const { data } = await apiClient.get(
    "/exports/thoughts/pdf",
    {
      responseType: "blob",
    }
  );

  return data as Blob;
}

/* =========================================
   PROFILE APIs
========================================= */

export async function apiUpdateProfile(
  payload: any
) {
  const { data } = await apiClient.put(
    "/profile",
    payload
  );

  return data;
}

export async function apiUpdateSettings(
  payload: any
) {
  const { data } = await apiClient.put(
    "/settings",
    payload
  );

  return data;
}

/* =========================================
   EXPORT CLIENT
========================================= */

export default apiClient;
