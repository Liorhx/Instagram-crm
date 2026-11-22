import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authService } from "../services/api";
import { toast } from "sonner";
import { Loader2, Lock, Mail, User, Eye, EyeOff } from "lucide-react";

export default function Auth({ onLogin }: { onLogin: (user: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<"auth" | "forgot" | "reset">("auth");
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
      toast.success("Welcome back!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await authService.signup(formData);
      toast.success("Account created! Please login.");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await authService.forgotPassword(formData.email);
      toast.success("Check your email for reset link");
      setView("reset");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to process request");
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
      toast.success("Password reset successful! Please login.");
      setView("auth");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (view === "forgot") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <Card className="w-full max-w-md border-none shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Forgot Password
            </CardTitle>
            <CardDescription>
              Enter your email to receive a reset token
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-[1.01] active:scale-[0.99]"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Send Reset Token"
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full hover:bg-zinc-100 transition-colors"
                onClick={() => setView("auth")}
              >
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === "reset") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <Card className="w-full max-w-md border-none shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Reset Password
            </CardTitle>
            <CardDescription>Enter your token and new password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-token">Reset Token</Label>
                <Input
                  id="reset-token"
                  required
                  value={formData.token}
                  onChange={(e) =>
                    setFormData({ ...formData, token: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                  <Input
                    id="reset-password"
                    type={showPassword ? "text" : "password"}
                    className="pl-10 pr-10"
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-[1.01] active:scale-[0.99]"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white mb-4">
            <Lock size={24} />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            InstaSmart CRM
          </CardTitle>
          <CardDescription>
            Enter your credentials to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger
                value="login"
                className="transition-all hover:bg-zinc-50 cursor-pointer"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="transition-all hover:bg-zinc-50 cursor-pointer"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      className="text-xs text-indigo-600 hover:underline cursor-pointer"
                      onClick={() => setView("forgot")}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="pl-10 pr-10"
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <Input
                      id="signup-name"
                      placeholder="John Doe"
                      className="pl-10"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      className="pl-10 pr-10"
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-[1.01] active:scale-[0.99]"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-xs text-center text-zinc-500">
            By clicking continue, you agree to our Terms of Service and Privacy
            Policy.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
