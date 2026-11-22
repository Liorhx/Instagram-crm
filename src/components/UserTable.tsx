import React, { useState, useEffect } from "react";
import {
  Search,
  Send,
  Trash2,
  Clock,
  ExternalLink,
  Instagram,
  User,
  Filter,
  Check,
  ChevronDown,
  Copy,
  MessageSquare,
  AlertCircle,
  MoreVertical,
  X,
  FileText,
  Calendar,
} from "lucide-react";
import { format, isToday, isPast } from "date-fns";
import { toast } from "sonner";
import { messageService, userService, settingsService } from "../services/api";

export default function UserTable({
  users,
  templates,
  onRefresh,
}: {
  users: any[];
  templates: any[];
  onRefresh: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dueFilter, setDueFilter] = useState<"all" | "due" | "overdue">("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [activeLead, setActiveLead] = useState<any | null>(null);
  const [settings, setSettings] = useState<any>({ followUpInterval: 2, maxFollowUps: 4 });

  // Outreach Modal State
  const [outreachModalOpen, setOutreachModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<any | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [customMessage, setCustomMessage] = useState<string>("");

  // Bulk Message Modal State
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkTemplateId, setBulkTemplateId] = useState<string>("");

  useEffect(() => {
    settingsService.get().then((res) => {
      if (res.data) setSettings(res.data);
    }).catch(() => {});
  }, []);

  // Update preview message when template changes
  useEffect(() => {
    if (targetUser && selectedTemplateId) {
      const tpl = templates.find((t) => t._id === selectedTemplateId);
      if (tpl) {
        const msg = tpl.content
          .replace(/{name}/g, targetUser.name || targetUser.username)
          .replace(/{username}/g, targetUser.username)
          .replace(/{profession}/g, targetUser.profession || "professional");
        setCustomMessage(msg);
      }
    }
  }, [selectedTemplateId, targetUser]);

  // Filter Logic
  const filteredUsers = (Array.isArray(users) ? users : []).filter((user) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      user.username.toLowerCase().includes(term) ||
      (user.name && user.name.toLowerCase().includes(term)) ||
      (user.profession && user.profession.toLowerCase().includes(term));

    const matchesStatus = statusFilter === "all" || user.status === statusFilter;

    let matchesDue = true;
    if (dueFilter === "due") {
      matchesDue = user.nextFollowUpDate && isToday(new Date(user.nextFollowUpDate));
    } else if (dueFilter === "overdue") {
      matchesDue =
        user.nextFollowUpDate &&
        isPast(new Date(user.nextFollowUpDate)) &&
        !isToday(new Date(user.nextFollowUpDate)) &&
        user.status !== "converted" &&
        user.status !== "not-interested";
    }

    return matchesSearch && matchesStatus && matchesDue;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map((u) => u._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await userService.update(userId, { status: newStatus });
      toast.success("Lead status updated");
      onRefresh();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteOne = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this lead?")) return;
    try {
      await userService.delete(userId);
      toast.success("Lead removed");
      setSelectedUsers((prev) => prev.filter((id) => id !== userId));
      if (activeLead?._id === userId) setActiveLead(null);
      onRefresh();
    } catch (err) {
      toast.error("Failed to delete lead");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedUsers.length} selected leads?`)) return;
    try {
      await userService.bulkDelete(selectedUsers);
      toast.success(`Removed ${selectedUsers.length} leads`);
      setSelectedUsers([]);
      onRefresh();
    } catch (err) {
      toast.error("Bulk delete failed");
    }
  };

  const openOutreach = (user: any) => {
    setTargetUser(user);
    if (templates.length > 0) {
      setSelectedTemplateId(templates[0]._id);
      const msg = templates[0].content
        .replace(/{name}/g, user.name || user.username)
        .replace(/{username}/g, user.username)
        .replace(/{profession}/g, user.profession || "professional");
      setCustomMessage(msg);
    } else {
      setCustomMessage(`Hi ${user.name || user.username}!`);
    }
    setOutreachModalOpen(true);
  };

  const handleSendDM = async () => {
    if (!targetUser || !selectedTemplateId) return;
    try {
      setIsSending(true);
      await messageService.send({
        userId: targetUser._id,
        templateId: selectedTemplateId,
      });
      toast.success(`Outreach recorded for @${targetUser.username}`);
      setOutreachModalOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to record message");
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyAndOpenIG = () => {
    if (!targetUser) return;
    navigator.clipboard.writeText(customMessage);
    toast.success("Message copied! Opening Instagram...");
    window.open(`https://ig.me/m/${targetUser.username}`, "_blank");
  };

  const handleBulkSend = async () => {
    if (!bulkTemplateId || selectedUsers.length === 0) return;
    try {
      setIsSending(true);
      await messageService.bulkSend({
        userIds: selectedUsers,
        templateId: bulkTemplateId,
      });
      toast.success(`Outreach queued for ${selectedUsers.length} leads`);
      setIsBulkDialogOpen(false);
      setSelectedUsers([]);
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Bulk dispatch failed");
    } finally {
      setIsSending(false);
    }
  };

  // Status Styling Dictionary
  const statusStyles: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    new: { label: "New", bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400" },
    contacted: { label: "Contacted", bg: "bg-blue-50 border border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
    "follow-up-1": { label: "Follow-Up 1", bg: "bg-amber-50 border border-amber-200", text: "text-amber-800", dot: "bg-amber-500" },
    "follow-up-2": { label: "Follow-Up 2", bg: "bg-orange-50 border border-orange-200", text: "text-orange-800", dot: "bg-orange-500" },
    interested: { label: "Interested", bg: "bg-emerald-50 border border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-500" },
    converted: { label: "Converted", bg: "bg-indigo-50 border border-indigo-200", text: "text-indigo-800", dot: "bg-indigo-500" },
    "not-interested": { label: "Not Interested", bg: "bg-rose-50 border border-rose-200", text: "text-rose-700", dot: "bg-rose-400" },
  };

  return (
    <div className="space-y-4">
      {/* Control Bar: Search & Quick Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads by username, name, or profession..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Status:
          </span>

          <button
            onClick={() => { setStatusFilter("all"); setDueFilter("all"); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === "all" && dueFilter === "all"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All
          </button>

          <button
            onClick={() => setDueFilter(dueFilter === "due" ? "all" : "due")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
              dueFilter === "due"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
            }`}
          >
            <Clock size={12} />
            Due Today
          </button>

          <button
            onClick={() => setDueFilter(dueFilter === "overdue" ? "all" : "overdue")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
              dueFilter === "overdue"
                ? "bg-rose-600 text-white"
                : "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
            }`}
          >
            <AlertCircle size={12} />
            Overdue
          </button>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-7 text-xs rounded-lg border border-slate-200 bg-white px-2 text-slate-700 cursor-pointer"
          >
            <option value="all">Any Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="follow-up-1">Follow-Up 1</option>
            <option value="follow-up-2">Follow-Up 2</option>
            <option value="interested">Interested</option>
            <option value="converted">Converted</option>
            <option value="not-interested">Not Interested</option>
          </select>
        </div>
      </div>

      {/* Leads Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredUsers.length > 0 &&
                      selectedUsers.length === filteredUsers.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 h-3.5 w-3.5 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Lead Profile</th>
                <th className="py-3 px-4">Niche</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Cadence</th>
                <th className="py-3 px-4">Next Due</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <User size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600 text-sm">No leads found</p>
                    <p className="text-[11px] mt-0.5">Try adjusting your search filters or import new leads.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUsers.includes(user._id);
                  const st = statusStyles[user.status] || statusStyles.new;
                  const isOverdue =
                    user.nextFollowUpDate &&
                    isPast(new Date(user.nextFollowUpDate)) &&
                    !isToday(new Date(user.nextFollowUpDate)) &&
                    user.status !== "converted" &&
                    user.status !== "not-interested";
                  const isDueToday =
                    user.nextFollowUpDate && isToday(new Date(user.nextFollowUpDate));

                  return (
                    <tr
                      key={user._id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? "bg-indigo-50/30" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(user._id)}
                          className="rounded border-slate-300 text-indigo-600 h-3.5 w-3.5 cursor-pointer"
                        />
                      </td>

                      {/* Lead Identity */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => setActiveLead(user)}
                            className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center font-bold text-slate-700 uppercase shrink-0 cursor-pointer hover:border-indigo-400 transition-colors"
                          >
                            {user.name ? user.name[0] : user.username[0]}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                onClick={() => setActiveLead(user)}
                                className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer truncate"
                              >
                                {user.name || `@${user.username}`}
                              </span>
                              <a
                                href={`https://instagram.com/${user.username}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Open Instagram Profile"
                              >
                                <ExternalLink size={11} />
                              </a>
                            </div>
                            <span className="text-[11px] font-mono text-slate-500 truncate">
                              @{user.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Niche / Profession */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 capitalize">
                          {user.profession || "General"}
                        </span>
                      </td>

                      {/* Status Selector */}
                      <td className="py-3 px-4">
                        <select
                          value={user.status || "new"}
                          onChange={(e) => handleStatusChange(user._id, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded-full border-none cursor-pointer focus:outline-none ${st.bg} ${st.text}`}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="follow-up-1">Follow-Up 1</option>
                          <option value="follow-up-2">Follow-Up 2</option>
                          <option value="interested">Interested</option>
                          <option value="converted">Converted</option>
                          <option value="not-interested">Not Interested</option>
                        </select>
                      </td>

                      {/* Follow-up Count */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
                          <span>{user.followUpCount || 0}</span>
                          <span className="text-slate-400">/{settings.maxFollowUps || 4} sent</span>
                        </div>
                      </td>

                      {/* Next Due Date */}
                      <td className="py-3 px-4">
                        {user.nextFollowUpDate ? (
                          <div className="flex items-center gap-1">
                            {isOverdue && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                                Overdue
                              </span>
                            )}
                            {isDueToday && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                Today
                              </span>
                            )}
                            <span className="text-[11px] text-slate-600 font-medium">
                              {format(new Date(user.nextFollowUpDate), "MMM d")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openOutreach(user)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer"
                            title="Compose Outreach DM"
                          >
                            <Send size={12} />
                            <span>Outreach</span>
                          </button>

                          <button
                            onClick={() => handleDeleteOne(user._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bottom Bulk Bar */}
      {selectedUsers.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
            <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold">
              {selectedUsers.length}
            </span>
            <span className="text-xs font-medium">Selected</span>
          </div>

          <button
            onClick={() => setIsBulkDialogOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Send size={13} />
            <span>Send Bulk Outreach</span>
          </button>

          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>

          <button
            onClick={() => setSelectedUsers([])}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {/* Slide-over Lead Detail Drawer */}
      {activeLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-2xs">
          <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center uppercase">
                  {activeLead.name ? activeLead.name[0] : activeLead.username[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{activeLead.name || activeLead.username}</h3>
                  <a
                    href={`https://instagram.com/${activeLead.username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-mono"
                  >
                    @{activeLead.username} <ExternalLink size={10} />
                  </a>
                </div>
              </div>
              <button
                onClick={() => setActiveLead(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-4 flex-1">
              {/* Bio */}
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Bio / Overview
                </span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/60 whitespace-pre-wrap">
                  {activeLead.bio || "No profile bio provided"}
                </p>
              </div>

              {/* Lead Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Status</span>
                  <span className="font-semibold text-slate-800 capitalize mt-0.5 block">{activeLead.status}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Niche</span>
                  <span className="font-semibold text-slate-800 capitalize mt-0.5 block">
                    {activeLead.profession || "General"}
                  </span>
                </div>
              </div>

              {/* Message History */}
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Outreach History ({activeLead.messageHistory?.length || 0})
                </span>
                {!activeLead.messageHistory || activeLead.messageHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No messages logged yet.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {activeLead.messageHistory.map((m: any, idx: number) => (
                      <div key={idx} className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100 text-xs">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-semibold uppercase text-indigo-700">{m.type || "outreach"}</span>
                          <span>{m.sentAt ? format(new Date(m.sentAt), "MMM d, HH:mm") : ""}</span>
                        </div>
                        <p className="text-slate-700 font-mono text-[11px]">{m.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  const lead = activeLead;
                  setActiveLead(null);
                  openOutreach(lead);
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send size={13} />
                <span>Compose DM</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Outreach Modal with Instagram DM Launcher */}
      {outreachModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Outreach to @{targetUser.username}
                </h3>
                <p className="text-xs text-slate-500">
                  Select a template or edit custom text, then copy and launch Instagram DM.
                </p>
              </div>
              <button
                onClick={() => setOutreachModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Template Picker */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Message Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 text-xs px-2.5 bg-white text-slate-800"
                >
                  {templates.map((tpl) => (
                    <option key={tpl._id} value={tpl._id}>
                      {tpl.name} ({tpl.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Message Composer & Live Preview */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Message Preview (Ready for Instagram)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {customMessage.length} chars
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  {/* Simulated Instagram Chat Bubble */}
                  <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs p-3.5 rounded-2xl rounded-br-xs max-w-sm ml-auto shadow-sm whitespace-pre-wrap leading-relaxed">
                    {customMessage || "No message content"}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCopyAndOpenIG}
                  className="w-full sm:flex-1 py-2 px-3 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy size={13} />
                  <span>Copy & Open Instagram DM</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendDM}
                  disabled={isSending}
                  className="w-full sm:flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Check size={13} />
                  <span>{isSending ? "Saving..." : "Record as Sent & Next Due"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Outreach Modal */}
      {isBulkDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Bulk Outreach ({selectedUsers.length} leads)
                </h3>
                <p className="text-xs text-slate-500">Advance pipeline cadence for selected recipients</p>
              </div>
              <button
                onClick={() => setIsBulkDialogOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Select Template
                </label>
                <select
                  value={bulkTemplateId}
                  onChange={(e) => setBulkTemplateId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 text-xs px-2.5 bg-white text-slate-800"
                >
                  <option value="">Select a template...</option>
                  {templates.map((tpl) => (
                    <option key={tpl._id} value={tpl._id}>
                      {tpl.name} ({tpl.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-xs flex gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-600" />
                <span>
                  This advances the follow-up counter and calculates the next due date for all{" "}
                  <strong>{selectedUsers.length}</strong> selected leads according to your cadence settings.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkDialogOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkSend}
                  disabled={isSending || !bulkTemplateId}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSending ? "Processing..." : `Dispatch for ${selectedUsers.length} Leads`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
