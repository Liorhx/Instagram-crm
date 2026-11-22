import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  Users,
  MessageSquare,
  History,
  Settings,
  Upload,
  RefreshCw,
  LogOut,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Instagram,
  UserCheck,
  Search,
  ExternalLink,
} from "lucide-react";

// Components
import UserTable from "./components/UserTable";
import TemplateManager from "./components/TemplateManager";
import ActivityLogs from "./components/ActivityLogs";
import UploadSection from "./components/UploadSection";
import SettingsPanel from "./components/SettingsPanel";
import Auth from "./components/Auth";

// Services
import {
  userService,
  templateService,
  logService,
  authService,
  systemService,
} from "./services/api";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "templates" | "logs" | "upload" | "settings">("users");
  const [dbStatus, setDbStatus] = useState<"connected" | "disconnected" | "checking">("checking");
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [newLead, setNewLead] = useState({ username: "", name: "", bio: "", profession: "" });
  const [creatingLead, setCreatingLead] = useState(false);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await authService.getMe();
      setUser(res.data);
    } catch (error) {
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!user) return;
    try {
      setRefreshing(true);
      const [usersRes, templatesRes, logsRes, healthRes] = await Promise.all([
        userService.getAll().catch(() => ({ data: [] })),
        templateService.getAll().catch(() => ({ data: [] })),
        logService.getAll().catch(() => ({ data: [] })),
        systemService
          .getHealth()
          .catch(() => ({ data: { mongodb: "disconnected" } })),
      ]);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setTemplates(Array.isArray(templatesRes.data) ? templatesRes.data : []);
      setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
      setDbStatus(healthRes.data?.mongodb === "connected" ? "connected" : "disconnected");
    } catch (error) {
      toast.error("Failed to sync latest CRM data");
      setDbStatus("disconnected");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    toast.success("Signed out successfully");
  };

  const handleCreateSingleLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = newLead.username.replace(/^@/, "").trim();
    if (!cleanUsername) {
      toast.error("Instagram username is required");
      return;
    }
    try {
      setCreatingLead(true);
      await userService.upload([
        {
          username: cleanUsername,
          name: newLead.name.trim(),
          bio: newLead.bio.trim(),
          profession: newLead.profession.trim() || "general",
        },
      ]);
      toast.success(`@${cleanUsername} added to leads`);
      setNewLead({ username: "", name: "", bio: "", profession: "" });
      setIsAddLeadOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to add lead");
    } finally {
      setCreatingLead(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Derived KPI Stats
  const totalLeads = users.length;
  const contactedLeads = users.filter((u) => u.status !== "new").length;
  const convertedLeads = users.filter((u) => u.status === "converted").length;
  const now = new Date();
  const dueFollowUps = users.filter((u) => {
    if (!u.nextFollowUpDate || u.status === "converted" || u.status === "not-interested") return false;
    return new Date(u.nextFollowUpDate) <= now;
  }).length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  if (loading && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 animate-pulse">
          <Instagram className="h-6 w-6 text-white" />
        </div>
        <p className="text-sm font-medium text-slate-400">Loading InstaCRM...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Auth onLogin={setUser} />
        <Toaster position="bottom-right" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Application Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Workspace Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/25">
              <Instagram size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900">
                  InstaCRM
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                  Pipeline
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Direct Message & Outreach Workspace
              </p>
            </div>
          </div>

          {/* Quick Header Actions & Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Database Connection Status Chip */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
              <span
                className={`w-2 h-2 rounded-full ${
                  dbStatus === "connected"
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    : "bg-rose-500"
                }`}
              />
              <span className="text-[11px]">
                {dbStatus === "connected" ? "Live Sync" : "Offline"}
              </span>
            </div>

            {/* Refresh Data Button */}
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh CRM Pipeline"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin text-indigo-600" : ""} />
            </button>

            {/* Quick Add Lead Button */}
            <button
              onClick={() => setIsAddLeadOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Add Lead</span>
            </button>

            {/* User Profile & Sign Out */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200 ml-1">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 uppercase">
                {user.name ? user.name.slice(0, 2) : user.email?.slice(0, 2) || "U"}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">
                  {user.name || "User"}
                </span>
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  {user.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 cursor-pointer"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Strip */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Leads */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Leads</span>
              <Users size={16} className="text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">{totalLeads}</span>
              <span className="text-[11px] text-slate-500 font-medium">in database</span>
            </div>
          </div>

          {/* Contacted */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Contacted</span>
              <UserCheck size={16} className="text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">{contactedLeads}</span>
              <span className="text-[11px] text-indigo-600 font-semibold">
                {totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0}% outreach
              </span>
            </div>
          </div>

          {/* Follow-ups Due */}
          <div
            onClick={() => setActiveTab("users")}
            className={`rounded-xl border p-4 shadow-xs cursor-pointer transition-all ${
              dueFollowUps > 0
                ? "bg-amber-50/50 border-amber-200 hover:border-amber-300"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-600">
                Follow-ups Due
              </span>
              <Clock size={16} className={dueFollowUps > 0 ? "text-amber-600" : "text-slate-400"} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">{dueFollowUps}</span>
              {dueFollowUps > 0 ? (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                  Requires Attention
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">All caught up</span>
              )}
            </div>
          </div>

          {/* Converted */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Converted</span>
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">{convertedLeads}</span>
              <span className="text-[11px] text-emerald-600 font-semibold">
                {conversionRate}% conversion
              </span>
            </div>
          </div>
        </section>

        {/* Tab Navigation Pill Bar */}
        <nav className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl max-w-fit overflow-x-auto scrollbar-none border border-slate-200">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "users"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users size={14} />
            <span>Leads</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
              {totalLeads}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "templates"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MessageSquare size={14} />
            <span>Templates</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
              {templates.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "logs"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <History size={14} />
            <span>Activity</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "upload"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Upload size={14} />
            <span>Import</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Settings size={14} />
            <span>Settings</span>
          </button>
        </nav>

        {/* Tab Views */}
        <div>
          {activeTab === "users" && (
            <UserTable
              users={users}
              templates={templates}
              onRefresh={fetchData}
            />
          )}

          {activeTab === "templates" && (
            <TemplateManager
              templates={templates}
              onRefresh={fetchData}
            />
          )}

          {activeTab === "logs" && (
            <ActivityLogs logs={logs} />
          )}

          {activeTab === "upload" && (
            <UploadSection onRefresh={fetchData} />
          )}

          {activeTab === "settings" && (
            <SettingsPanel />
          )}
        </div>
      </main>

      {/* Add Lead Modal */}
      {isAddLeadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add New Lead</h3>
                <p className="text-xs text-slate-500">Add an individual Instagram profile to your pipeline</p>
              </div>
              <button
                onClick={() => setIsAddLeadOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSingleLead} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Instagram Handle <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">@</span>
                  <input
                    type="text"
                    required
                    placeholder="username"
                    className="w-full h-9 pl-7 pr-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    value={newLead.username}
                    onChange={(e) => setNewLead({ ...newLead, username: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Profession / Niche
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dentist, Coach"
                    className="w-full h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    value={newLead.profession}
                    onChange={(e) => setNewLead({ ...newLead, profession: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Profile Bio / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Bio info, follower count or personal context..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={newLead.bio}
                  onChange={(e) => setNewLead({ ...newLead, bio: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddLeadOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingLead}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  {creatingLead ? "Adding..." : "Add to Pipeline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Toaster position="bottom-right" />
    </div>
  );
}
