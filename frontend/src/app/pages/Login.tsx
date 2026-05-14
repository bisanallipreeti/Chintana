import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Brain,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Check,
} from "lucide-react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { toast } from "sonner";
import { useAppContext } from "../context/AppContext";
import { apiCheckEmail } from "../lib/api";

interface AuthFormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  otp: string;
}

const initialFormState: AuthFormState = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  otp: "",
};

function getPasswordRules(password: string) {
  return [
    { label: "1 uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "1 lowercase letter", valid: /[a-z]/.test(password) },
    { label: "1 number", valid: /\d/.test(password) },
    { label: "1 special character", valid: /[^A-Za-z0-9]/.test(password) },
    { label: "8 characters", valid: password.length >= 8 },
  ];
}

export function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, register, verifyEmail, resendOtp } = useAppContext();
  const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const [isLogin, setIsLogin] = useState(true);
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState<AuthFormState>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof AuthFormState, string>>>({});

  const passwordRules = useMemo(() => getPasswordRules(form.password), [form.password]);

  const switchMode = (nextIsLogin: boolean) => {
    setIsLogin(nextIsLogin);
    setAwaitingOtp(false);
    setErrors({});
    setForm(initialFormState);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const updateField = (field: keyof AuthFormState, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const preventPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    toast.info("Copy and paste is disabled for the password fields.");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof AuthFormState, string>> = {};
    const email = form.email.trim().toLowerCase();

    if (!email) {
      nextErrors.email = "Enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    } else if (awaitingOtp) {
      if (form.otp.trim().length !== 6) {
        nextErrors.otp = "Enter the 6-digit OTP.";
      }
    } else if (!form.password) {
      nextErrors.password = isLogin
        ? "Enter your password."
        : "Create a password to continue.";
    }

    if (!isLogin && !awaitingOtp) {
      if (!form.fullName.trim()) {
        nextErrors.fullName = "Enter your full name.";
      }

      if (form.password && passwordRules.some((rule) => !rule.valid)) {
        nextErrors.password = "Your password does not meet all the requirements.";
      }

      if (!form.confirmPassword) {
        nextErrors.confirmPassword = "Confirm your password.";
      } else if (form.password !== form.confirmPassword) {
        nextErrors.confirmPassword = "Passwords do not match.";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (awaitingOtp) {
      const result = await verifyEmail(email, form.otp.trim());
      if (!result.ok) {
        setErrors({ otp: result.message || "Invalid OTP." });
        return;
      }

      toast.success("Email verified. Welcome to Chintana.");
      navigate("/app/dashboard");
      return;
    }

    if (isLogin) {
      try {
        const check = await apiCheckEmail(email, "login");
        if (!check?.data?.exists) {
          setErrors({
            email: check?.message || "Account does not exist.",
          });
          return;
        }
      } catch (error) {
        setErrors({
          email: (error as Error).message || "Unable to validate email right now.",
        });
        return;
      }

      const result = await login(email, form.password);
      if (!result.ok) {
        setErrors({
          password: result.message || "Invalid email or password.",
        });
        return;
      }

      toast.success("Welcome back.");
      navigate("/app/dashboard");
      return;
    }

    try {
      const check = await apiCheckEmail(email, "register");
      if (check?.data?.exists) {
        setErrors({
          email: check?.message || "An account with this email already exists.",
        });
        return;
      }
    } catch (error) {
      setErrors({
        email: (error as Error).message || "Unable to validate email right now.",
      });
      return;
    }

    const result = await register({
      fullName: form.fullName,
      email,
      password: form.password,
      twoFactorAuth: false,
    });

    if (!result.ok) {
      setErrors({ email: result.message });
      return;
    }

    if (result.requiresVerification) {
      setAwaitingOtp(true);
      toast.info(result.message || "Enter the OTP sent to your email.");
      return;
    }

    toast.success("Your account has been created.");
    navigate("/app/dashboard");
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    const credential = response.credential;
    if (!credential) {
      setErrors({ email: "Google sign-in token was not received. Please try again." });
      return;
    }

    const result = await loginWithGoogle(credential);
    if (!result.ok) {
      setErrors({ email: result.message || "Google sign-in failed." });
      return;
    }

    toast.success("Welcome.");
    navigate("/app/dashboard");
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/30 p-8 border border-gray-100 dark:border-gray-700">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Chintana</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isLogin ? "Sign in to continue" : "Create your Chintana account"}
          </p>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <button
            onClick={() => switchMode(true)}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              isLogin
                ? "bg-white dark:bg-gray-600 text-blue-700 dark:text-blue-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => switchMode(false)}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              !isLogin
                ? "bg-white dark:bg-gray-600 text-blue-700 dark:text-blue-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!awaitingOtp && !isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  placeholder="Your full name"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                    errors.fullName ? "border-red-400" : "border-gray-300 dark:border-gray-600"
                  }`}
                />
              </div>
              {errors.fullName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fullName}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={form.email}
                disabled={awaitingOtp}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="your@email.com"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                  errors.email ? "border-red-400" : "border-gray-300 dark:border-gray-600"
                }`}
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
          </div>

          {awaitingOtp ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email OTP
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.otp}
                  onChange={(event) => updateField("otp", event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 tracking-[0.4em] text-center ${
                    errors.otp ? "border-red-400" : "border-gray-300 dark:border-gray-600"
                  }`}
                />
              </div>
              {errors.otp && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.otp}</p>}
              <button
                type="button"
                onClick={async () => {
                  const result = await resendOtp(form.email.trim().toLowerCase());
                  if (result.ok) toast.success(result.message || "OTP sent.");
                  else setErrors({ otp: result.message || "Could not resend OTP." });
                }}
                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Resend OTP
              </button>
            </div>
          ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                onPaste={!isLogin ? preventPaste : undefined}
                onCopy={!isLogin ? (event) => event.preventDefault() : undefined}
                autoComplete={isLogin ? "current-password" : "new-password"}
                placeholder="Enter password"
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                  errors.password ? "border-red-400" : "border-gray-300 dark:border-gray-600"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
          </div>
          )}

          {!awaitingOtp && !isLogin && (
            <>
              <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-4 space-y-2">
                {passwordRules.map((rule) => (
                  <div key={rule.label} className="flex items-center gap-2 text-sm">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        rule.valid ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400" : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span className={rule.valid ? "text-green-700 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}>{rule.label}</span>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(event) => updateField("confirmPassword", event.target.value)}
                    onPaste={preventPaste}
                    onCopy={(event) => event.preventDefault()}
                    autoComplete="new-password"
                    placeholder="Re-enter password"
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                      errors.confirmPassword ? "border-red-400" : "border-gray-300 dark:border-gray-600"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((previous) => !previous)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                )}
              </div>

            </>
          )}

          {isLogin && !awaitingOtp && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-violet-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
          >
            {awaitingOtp ? "Verify Email" : isLogin ? "Login to Chintana" : "Create Account"}
          </button>

          {googleEnabled && !awaitingOtp && (
            <>
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">or</span>
                </div>
              </div>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setErrors({ email: "Google sign-in failed. Please try again." })}
                  text={isLogin ? "signin_with" : "signup_with"}
                  theme="outline"
                  shape="rectangular"
                  width="320"
                />
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
