import { useState } from "react";
import { useNavigate } from "react-router";
import { Brain, Mail, ArrowLeft, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";
import { apiForgotPassword } from "../lib/api";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      setEmailError("Enter your email address.");
      return;
    }

    setEmailError("");
    setIsLoading(true);

    try {
      await apiForgotPassword(email.trim().toLowerCase());
      setIsSubmitted(true);
    } catch (error) {
      setEmailError((error as Error).message || "Failed to send reset link.");
      toast.error("Could not send reset link.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/30 p-8 border border-gray-100 dark:border-gray-700">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Chintana</h1>
          <p className="text-gray-600 dark:text-gray-400">Reset your password</p>
        </div>

        {!isSubmitted ? (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Forgot Password?</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Enter your email address and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setEmailError("");
                    }}
                    placeholder="your@email.com"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 ${
                      emailError ? "border-red-400" : "border-gray-300 dark:border-gray-600"
                    }`}
                  />
                </div>
                {emailError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{emailError}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-violet-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Reset Link
                  </>
                )}
              </button>
            </form>

            <div className="mt-6">
              <button
                onClick={() => navigate("/")}
                className="w-full flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium py-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="inline-flex w-16 h-16 bg-green-100 dark:bg-green-950 rounded-full items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Check Your Email</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">We sent a password reset link to:</p>
            <p className="text-blue-600 dark:text-blue-400 font-medium mb-6">{email}</p>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900 dark:text-blue-300 leading-relaxed">
                Open the email and follow the link to set a new password.
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-violet-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
