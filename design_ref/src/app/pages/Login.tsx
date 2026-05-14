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
import { toast } from "sonner";
import { useAppContext } from "../context/AppContext";

interface AuthFormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const initialFormState: AuthFormState = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
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
  const { login, register } = useAppContext();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState<AuthFormState>(initialFormState);
  const [errors, setErrors] = useState<Partial<Record<keyof AuthFormState, string>>>({});

  const passwordRules = useMemo(() => getPasswordRules(form.password), [form.password]);

  const switchMode = (nextIsLogin: boolean) => {
    setIsLogin(nextIsLogin);
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof AuthFormState, string>> = {};
    const email = form.email.trim().toLowerCase();

    if (!email) {
      nextErrors.email = "Enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    } else if (!form.password) {
      nextErrors.password = isLogin
        ? "Enter your password."
        : "Create a password to continue.";
    }

    if (!isLogin) {
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

    if (isLogin) {
      const result = login(email, form.password);
      if (!result.ok) {
        setErrors({
          email: " ",
          password: result.message,
        });
        return;
      }

      toast.success("Welcome back.");
      navigate("/app/dashboard");
      return;
    }

    const result = register({
      fullName: form.fullName,
      email,
      password: form.password,
      twoFactorAuth: false,
    });

    if (!result.ok) {
      setErrors({ email: result.message });
      return;
    }

    toast.success("Your account has been created.");
    navigate("/app/dashboard");
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">NeuroSync</h1>
          <p className="text-gray-600">
            {isLogin ? "Sign in to continue" : "Create your NeuroSync account"}
          </p>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => switchMode(true)}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              isLogin
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => switchMode(false)}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              !isLogin
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  placeholder="Your full name"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                    errors.fullName ? "border-red-400" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="your@email.com"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                  errors.email ? "border-red-400" : "border-gray-300"
                }`}
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                placeholder="Enter password"
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                  errors.password ? "border-red-400" : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          {!isLogin && (
            <>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
                {passwordRules.map((rule) => (
                  <div key={rule.label} className="flex items-center gap-2 text-sm">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        rule.valid ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span className={rule.valid ? "text-green-700" : "text-gray-600"}>{rule.label}</span>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    placeholder="Re-enter password"
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                      errors.confirmPassword ? "border-red-400" : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((previous) => !previous)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

            </>
          )}

          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-violet-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
          >
            {isLogin ? "Login to NeuroSync" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
