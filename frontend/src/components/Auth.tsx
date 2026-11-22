import React, { useState, useMemo } from "react";
import { authService } from "../services/api";
import { toast } from "sonner";
import {
  Instagram,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  XCircle,
  Check,
  Shield,
  ShieldCheck,
} from "lucide-react";

interface AuthProps {
  onLogin: (user: any) => void;
}

// RFC 5322 based email validator with valid domain and at least 2-character TLD
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

const isValidEmail = (email: string): boolean => {
  if (!email || email.length > 254) return false;
  const trimmed = email.trim();
  return EMAIL_REGEX.test(trimmed) && !trimmed.includes("..");
};

interface PasswordRequirements {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

const checkPasswordRequirements = (pwd: string): PasswordRequirements => ({
  minLength: pwd.length >= 8,
  hasUpper: /[A-Z]/.test(pwd),
  hasLower: /[a-z]/.test(pwd),
  hasNumber: /[0-9]/.test(pwd),
  hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(pwd),
});

export default function Auth({ onLogin }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [view, setView] = useState<"login" | "signup" | "forgot" | "reset">("login");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    token: "",
  });

  const clearErrors = () => {
    setErrorMessage(null);
  };

  const switchView = (newView: "login" | "signup" | "forgot" | "reset") => {
    clearErrors();
    setView(newView);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // Password criteria calculations
  const pwdReqs = useMemo(
    () => checkPasswordRequirements(formData.password),
    [formData.password]
  );

  const pwdScore = useMemo(() => {
    const list = [
      pwdReqs.minLength,
      pwdReqs.hasUpper,
      pwdReqs.hasLower,
      pwdReqs.hasNumber,
      pwdReqs.hasSpecial,
    ];
    return list.filter(Boolean).length;
  }, [pwdReqs]);

  const isPasswordValid = pwdScore === 5;
  const isEmailValid = useMemo(() => isValidEmail(formData.email), [formData.email]);
  const doPasswordsMatch =
    Boolean(formData.password) &&
    formData.password === formData.confirmPassword;

  const getStrengthLabel = () => {
    if (!formData.password) return { text: "None", color: "text-slate-400" };
    if (pwdScore <= 2) return { text: "Weak", color: "text-rose-500" };
    if (pwdScore <= 4) return { text: "Medium", color: "text-amber-500" };
    return { text: "Strong", color: "text-emerald-600" };
  };

  const getFriendlyErrorMessage = (error: any, fallback: string): string => {
    if (!error.response) {
      if (
        error.code === "ERR_NETWORK" ||
        error.message?.includes("Network Error") ||
        error.message?.includes("failed to fetch")
      ) {
        return "Cannot connect to backend server. Make sure the backend is running on http://localhost:5000 (run: npm run dev:backend).";
      }
      return error.message || fallback;
    }

    const status = error.response.status;
    const serverError = error.response.data?.error || error.response.data?.message;

    if (serverError) {
      return serverError;
    }

    if (status === 400) return "Please review input requirements and try again.";
    if (status === 401) return "Incorrect email or password. Please verify credentials.";
    if (status === 404) return "Account not found. Please check your email or create an account.";
    if (status === 409) return "An account with this email address already exists. Please sign in.";
    if (status === 503) return "Database unavailable. Please verify MongoDB status.";
    if (status >= 500) return "Server error occurred. Please check backend console logs.";

    return fallback;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const emailTrimmed = formData.email.trim();
    if (!emailTrimmed || !formData.password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    if (!isValidEmail(emailTrimmed)) {
      setErrorMessage("Please enter a valid email address (e.g. name@company.com).");
      return;
    }

    try {
      setLoading(true);
      const res = await authService.login({
        email: emailTrimmed,
        password: formData.password,
      });

      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        toast.success("Signed in successfully!");
        onLogin(res.data.user);
      } else {
        throw new Error("No authorization token received.");
      }
    } catch (error: any) {
      const msg = getFriendlyErrorMessage(error, "Sign in failed. Please check credentials.");
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const nameTrimmed = formData.name.trim();
    if (!nameTrimmed || nameTrimmed.length < 2) {
      setErrorMessage("Please enter your full name (minimum 2 characters).");
      return;
    }

    const emailTrimmed = formData.email.trim();
    if (!isValidEmail(emailTrimmed)) {
      setErrorMessage("Please enter a valid email address with a valid domain (e.g. name@company.com).");
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage("Password must meet all 5 security standards (8+ chars, upper, lower, number, symbol).");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter your confirmation password.");
      return;
    }

    try {
      setLoading(true);
      const res = await authService.signup({
        name: nameTrimmed,
        email: emailTrimmed,
        password: formData.password,
      });

      toast.success("Account created successfully!");

      // If backend returns session token, log in directly
      if (res.data?.token && res.data?.user) {
        localStorage.setItem("token", res.data.token);
        onLogin(res.data.user);
      } else {
        switchView("login");
      }
    } catch (error: any) {
      const msg = getFriendlyErrorMessage(error, "Account creation failed.");
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const emailTrimmed = formData.email.trim();
    if (!isValidEmail(emailTrimmed)) {
      setErrorMessage("Please provide a valid email address.");
      return;
    }

    try {
      setLoading(true);
      const res = await authService.forgotPassword(emailTrimmed);
      toast.success(res.data?.message || "Reset token generated!");

      if (res.data?.token) {
        setFormData((prev) => ({ ...prev, token: res.data.token }));
      }
      switchView("reset");
    } catch (error: any) {
      const msg = getFriendlyErrorMessage(error, "Failed to send reset link.");
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!formData.token.trim()) {
      setErrorMessage("Please provide the reset token.");
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage("New password must satisfy all 5 security criteria.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const res = await authService.resetPassword({
        token: formData.token.trim(),
        password: formData.password,
      });

      toast.success(res.data?.message || "Password updated! Please sign in.");
      switchView("login");
    } catch (error: any) {
      const msg = getFriendlyErrorMessage(error, "Password reset failed.");
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-7 md:p-8 animate-in fade-in-50 duration-300">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-3">
            <Instagram size={24} strokeWidth={2.4} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            InstaCRM
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {view === "login" && "Sign in to manage your Instagram leads and outreach"}
            {view === "signup" && "Create an account to start your outreach pipeline"}
            {view === "forgot" && "Reset your account password"}
            {view === "reset" && "Enter your token to set a new password"}
          </p>
        </div>

        {/* View Switcher Tabs (Sign In / Sign Up) */}
        {(view === "login" || view === "signup") && (
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => switchView("login")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                view === "login"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchView("signup")}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                view === "signup"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Inline Error Alert Banner */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in-50 duration-200">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold block text-rose-900 mb-0.5">Authentication Notice</span>
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-700 cursor-pointer shrink-0"
              title="Dismiss error"
            >
              <XCircle size={15} />
            </button>
          </div>
        )}

        {/* VIEW 1: LOGIN */}
        {view === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@company.com"
                  className="w-full h-10 pl-10 pr-3.5 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                  value={formData.email}
                  onChange={(e) => {
                    clearErrors();
                    setFormData({ ...formData, email: e.target.value });
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => switchView("forgot")}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full h-10 pl-10 pr-10 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                  value={formData.password}
                  onChange={(e) => {
                    clearErrors();
                    setFormData({ ...formData, password: e.target.value });
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1 transition"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        )}

        {/* VIEW 2: SIGN UP */}
        {view === "signup" && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Rahul Yadav"
                  minLength={2}
                  maxLength={60}
                  className="w-full h-10 pl-10 pr-3.5 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                  value={formData.name}
                  onChange={(e) => {
                    clearErrors();
                    setFormData({ ...formData, name: e.target.value });
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Email Address
                </label>
                {formData.email && (
                  <span
                    className={`text-[11px] font-medium ${
                      isEmailValid ? "text-emerald-600" : "text-amber-500"
                    }`}
                  >
                    {isEmailValid ? "Valid format" : "Standard email required"}
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@company.com"
                  className={`w-full h-10 pl-10 pr-3.5 rounded-lg border text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                    formData.email && !isEmailValid
                      ? "border-amber-300 focus:ring-amber-500"
                      : "border-slate-300 focus:ring-indigo-600 focus:border-transparent"
                  }`}
                  value={formData.email}
                  onChange={(e) => {
                    clearErrors();
                    setFormData({ ...formData, email: e.target.value });
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Must include a valid domain and TLD (e.g. user@company.com)
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Strength:</span>
                  <span className={`text-[11px] font-bold ${getStrengthLabel().color}`}>
                    {getStrengthLabel().text}
                  </span>
                </div>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  className="w-full h-10 pl-10 pr-10 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                  value={formData.password}
                  onChange={(e) => {
                    clearErrors();
                    setFormData({ ...formData, password: e.target.value });
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1 transition"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Dynamic 5-bar Strength Progress */}
              {formData.password && (
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-5 gap-1.5 h-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`rounded-full transition-all duration-300 ${
                          pwdScore >= level
                            ? pwdScore <= 2
                              ? "bg-rose-500"
                              : pwdScore <= 4
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                            : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Requirements Checklist */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                      Security Standards Checklist
                    </span>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                      <div
                        className={`flex items-center gap-1.5 ${
                          pwdReqs.minLength ? "text-emerald-700 font-medium" : "text-slate-500"
                        }`}
                      >
                        {pwdReqs.minLength ? (
                          <Check size={12} className="text-emerald-600 stroke-[3]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-0.5" />
                        )}
                        <span>8+ characters</span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 ${
                          pwdReqs.hasUpper ? "text-emerald-700 font-medium" : "text-slate-500"
                        }`}
                      >
                        {pwdReqs.hasUpper ? (
                          <Check size={12} className="text-emerald-600 stroke-[3]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-0.5" />
                        )}
                        <span>Uppercase (A-Z)</span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 ${
                          pwdReqs.hasLower ? "text-emerald-700 font-medium" : "text-slate-500"
                        }`}
                      >
                        {pwdReqs.hasLower ? (
                          <Check size={12} className="text-emerald-600 stroke-[3]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-0.5" />
                        )}
                        <span>Lowercase (a-z)</span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 ${
                          pwdReqs.hasNumber ? "text-emerald-700 font-medium" : "text-slate-500"
                        }`}
                      >
                        {pwdReqs.hasNumber ? (
                          <Check size={12} className="text-emerald-600 stroke-[3]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-0.5" />
                        )}
                        <span>Number (0-9)</span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 col-span-2 ${
                          pwdReqs.hasSpecial ? "text-emerald-700 font-medium" : "text-slate-500"
                        }`}
                      >
                        {pwdReqs.hasSpecial ? (
                          <Check size={12} className="text-emerald-600 stroke-[3]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-0.5" />
                        )}
                        <span>Special character (!@#$%^&*...)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Confirm Password
                </label>
                {formData.confirmPassword && (
                  <span
                    className={`text-[11px] font-medium ${
                      doPasswordsMatch ? "text-emerald-600" : "text-rose-500"
                    }`}
                  >
                    {doPasswordsMatch ? "Passwords match" : "Does not match"}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  className={`w-full h-10 pl-10 pr-10 rounded-lg border text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                    formData.confirmPassword && !doPasswordsMatch
                      ? "border-rose-300 focus:ring-rose-500"
                      : "border-slate-300 focus:ring-indigo-600 focus:border-transparent"
                  }`}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    clearErrors();
                    setFormData({ ...formData, confirmPassword: e.target.value });
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1 transition"
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid || !isEmailValid || !doPasswordsMatch}
              className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold transition shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Validating & Creating...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  <span>Create Secure Account</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* VIEW 3: FORGOT PASSWORD */}
        {view === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@company.com"
                  className="w-full h-10 pl-10 pr-3.5 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                  value={formData.email}
                  onChange={(e) => {
                    clearErrors();
                    setFormData({ ...formData, email: e.target.value });
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Enter your account email to receive your password reset token.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !isValidEmail(formData.email)}
              className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold transition shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Sending reset token...</span>
                </>
              ) : (
                <>
                  <KeyRound size={14} />
                  <span>Generate Reset Token</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => switchView("login")}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
              >
                Back to Sign in
              </button>
            </div>
          </form>
        )}

        {/* VIEW 4: RESET PASSWORD */}
        {view === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Reset Token
              </label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Paste your 64-character token"
                  className="w-full h-10 pl-10 pr-3.5 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                  value={formData.token}
                  onChange={(e) => {
                    clearErrors();
                    setFormData({ ...formData, token: e.target.value });
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  New Password
                </label>
                <span className={`text-[11px] font-bold ${getStrengthLabel().color}`}>
                  {getStrengthLabel().text}
                </span>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="At least 8 characters with symbols"
                  className="w-full h-10 pl-10 pr-10 rounded-lg border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                  value={formData.password}
                  onChange={(e) => {
                    clearErrors();
                    setFormData({ ...formData, password: e.target.value });
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1 transition"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {formData.password && (
                <div className="mt-2 space-y-1.5 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                    Security Requirements
                  </span>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
                    <div
                      className={`flex items-center gap-1.5 ${
                        pwdReqs.minLength ? "text-emerald-700 font-medium" : "text-slate-500"
                      }`}
                    >
                      {pwdReqs.minLength ? (
                        <Check size={12} className="text-emerald-600 stroke-[3]" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-0.5" />
                      )}
                      <span>8+ characters</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 ${
                        pwdReqs.hasUpper ? "text-emerald-700 font-medium" : "text-slate-500"
                      }`}
                    >
                      {pwdReqs.hasUpper ? (
                        <Check size={12} className="text-emerald-600 stroke-[3]" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-0.5" />
                      )}
                      <span>Uppercase (A-Z)</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 ${
                        pwdReqs.hasLower ? "text-emerald-700 font-medium" : "text-slate-500"
                      }`}
                    >
                      {pwdReqs.hasLower ? (
                        <Check size={12} className="text-emerald-600 stroke-[3]" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-0.5" />
                      )}
                      <span>Lowercase (a-z)</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 ${
                        pwdReqs.hasNumber ? "text-emerald-700 font-medium" : "text-slate-500"
                      }`}
                    >
                      {pwdReqs.hasNumber ? (
                        <Check size={12} className="text-emerald-600 stroke-[3]" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-0.5" />
                      )}
                      <span>Number (0-9)</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 col-span-2 ${
                        pwdReqs.hasSpecial ? "text-emerald-700 font-medium" : "text-slate-500"
                      }`}
                    >
                      {pwdReqs.hasSpecial ? (
                        <Check size={12} className="text-emerald-600 stroke-[3]" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-0.5" />
                      )}
                      <span>Special symbol (!@#$%^&*...)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Confirm New Password
                </label>
                {formData.confirmPassword && (
                  <span
                    className={`text-[11px] font-medium ${
                      doPasswordsMatch ? "text-emerald-600" : "text-rose-500"
                    }`}
                  >
                    {doPasswordsMatch ? "Passwords match" : "Does not match"}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Re-enter new password"
                  className={`w-full h-10 pl-10 pr-10 rounded-lg border text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition ${
                    formData.confirmPassword && !doPasswordsMatch
                      ? "border-rose-300 focus:ring-rose-500"
                      : "border-slate-300 focus:ring-indigo-600 focus:border-transparent"
                  }`}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    clearErrors();
                    setFormData({ ...formData, confirmPassword: e.target.value });
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1 transition"
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid || !doPasswordsMatch}
              className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold transition shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Set New Password</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => switchView("login")}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
              >
                Back to Sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}