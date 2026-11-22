import React, { useState } from "react";
import { Plus, MessageSquare, Trash2, Tag, Copy, Check, Instagram, Sparkles, Send } from "lucide-react";
import { templateService } from "../services/api";
import { toast } from "sonner";

export default function TemplateManager({
  templates,
  onRefresh,
}: {
  templates: any[];
  onRefresh: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"profession" | "gender" | "follow-up">("profession");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewLeadName, setPreviewLeadName] = useState("Alex");
  const [previewHandle, setPreviewHandle] = useState("alex_design");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      toast.error("Template name and message body are required");
      return;
    }
    try {
      setSaving(true);
      await templateService.create({
        name: name.trim(),
        type,
        category: category.trim() || "general",
        content: content.trim(),
      });
      toast.success("Outreach template saved");
      setName("");
      setCategory("");
      setContent("");
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create template");
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 1800);
  };

  const insertPlaceholder = (tag: string) => {
    setContent((prev) => `${prev}{${tag}} `);
  };

  // Live preview string
  const previewText = content
    ? content
        .replace(/{name}/g, previewLeadName)
        .replace(/{username}/g, previewHandle)
        .replace(/{profession}/g, category || "designer")
    : "Your formatted message will render here in real time as an Instagram DM bubble...";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Template Creator & Preview Studio */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Plus size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">New Outreach Template</h3>
              <p className="text-[11px] text-slate-400">Save templates for quick 1-click DM outreach</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Template Name
              </label>
              <input
                type="text"
                placeholder="e.g. Initial Dentist Intro"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50/50"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e: any) => setType(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-200 text-xs px-2.5 bg-slate-50/50 text-slate-700"
                >
                  <option value="profession">Profession</option>
                  <option value="follow-up">Follow-Up</option>
                  <option value="gender">Gender</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Category / Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. dentist, 1st-followup"
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50/50"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Message Body
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400 mr-1">Insert:</span>
                  <button
                    type="button"
                    onClick={() => insertPlaceholder("name")}
                    className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    +name
                  </button>
                  <button
                    type="button"
                    onClick={() => insertPlaceholder("username")}
                    className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    +username
                  </button>
                  <button
                    type="button"
                    onClick={() => insertPlaceholder("profession")}
                    className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    +profession
                  </button>
                </div>
              </div>
              <textarea
                rows={5}
                placeholder="Hi {name}! Loved your recent posts on Instagram. Reaching out because..."
                className="w-full p-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50/50 leading-relaxed font-sans"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Template"}
            </button>
          </form>
        </div>

        {/* Live Instagram DM Simulator */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Instagram size={16} className="text-pink-600" />
              <span className="text-xs font-bold text-slate-900">Instagram DM Simulator</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Live Preview</span>
          </div>

          <div className="bg-slate-900 rounded-2xl p-4 text-white space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-[11px] text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>To: @{previewHandle} ({previewLeadName})</span>
            </div>

            <div className="py-2 flex justify-end">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs p-3.5 rounded-2xl rounded-br-xs max-w-xs shadow-md whitespace-pre-wrap leading-relaxed">
                {previewText}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Existing Templates List */}
      <div className="lg:col-span-7">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Saved Templates ({templates.length})</h3>
              <p className="text-[11px] text-slate-400">Library of approved outreach and follow-up messages</p>
            </div>
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <MessageSquare size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700 text-sm">No templates saved</p>
              <p className="text-xs mt-0.5">Create your first outreach template using the form on the left.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((tpl) => (
                <div
                  key={tpl._id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all shadow-2xs group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{tpl.name}</span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {tpl.type}
                      </span>
                      {tpl.category && (
                        <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 font-mono">
                          #{tpl.category}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => copyToClipboard(tpl.content, tpl._id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      title="Copy template"
                    >
                      {copiedId === tpl._id ? (
                        <>
                          <Check size={12} className="text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono whitespace-pre-wrap leading-relaxed">
                    {tpl.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
