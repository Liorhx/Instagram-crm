import React, { useState } from "react";
import { authService } from "../services/api";
import { toast } from "sonner";
import { Instagram, Eye, EyeOff, Lock, Mail, User, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Auth({ onLogin }: { onLogin: (user: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<"login" | "signup" | "forgot" | "reset">("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    token: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await authService.login({
        email: formData.email,
        password: formData.password,
      });
      localStorage.setItem("token", res.data.token);
      onLogin(res.data.user);
      toast.success("Signed in successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await authService.signup(formData);
      toast.success("Account created! Please sign in.");
      setView("login");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Account creation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await authService.forgotPassword(formData.email);
      toast.success("Reset code sent! Check your email or console.");
      if (res.data?.token) {
        setFormData((prev) => ({ ...prev, token: res.data.token }));
      }
      setView("reset");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to request reset");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await authService.resetPassword({
        token: formData.token,
        password: formData.password,
      });
      toast.success("Password reset! Please sign in with your new password.");
      setView("login");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-2xl p-8 animate-in fade-in-50 duration-300">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-3">
            <Instagram size={26} strokeWidth={2.2} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            InstaCRM
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {view === "login" && "Sign in to manage your Instagram outreach pipeline"}
            {view === "signup" && "Create an account to start managing leads"}
            {view === "forgot" && "Reset your account access"}
            {view === "reset" && "Enter your reset token and new password"}
          </p>
        </div>

        {/* View 1: Login */}
        {view === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setView("forgot")}
                  className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full h-10 pl-9 pr-10 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
            >
              <span>{loading ? "Signing in..." : "Sign In to Workspace"}</span>
              <ArrowRight size={14} />
            </button>

            <div className="pt-4 text-center border-t border-slate-100 text-xs text-slate-500">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setView("signup")}
                className="font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </div>
          </form>
        )}

        {/* View 2: Sign up */}
        {view === "signup" && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Full Name
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Rahul Yadav"
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
            >
              <span>{loading ? "Creating account..." : "Create Account"}</span>
              <ArrowRight size={14} />
            </button>

            <div className="pt-4 text-center border-t border-slate-100 text-xs text-slate-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setView("login")}
                className="font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </div>
          </form>
        )}

        {/* View 3: Forgot Password */}
        {view === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading ? "Sending link..." : "Send Reset Link"}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setView("login")}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Back to Sign in
              </button>
            </div>
          </form>
        )}

        {/* View 4: Reset Password */}
        {view === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Reset Token
              </label>
              <input
                type="text"
                required
                placeholder="Paste reset token here"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                value={formData.token}
                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="New password (min 6 chars)"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading ? "Updating..." : "Set New Password"}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setView("login")}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
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
