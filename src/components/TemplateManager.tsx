import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MessageSquare, Trash2, Tag, Copy, Check } from "lucide-react";
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
  const [type, setType] = useState<"gender" | "profession" | "follow-up">("profession");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      toast.error("Please fill in template name and content");
      return;
    }
    try {
      setSaving(true);
      await templateService.create({
        name,
        type,
        category: category || "general",
        content,
      });
      toast.success("Template created successfully");
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
    setTimeout(() => setCopiedId(null), 2000);
  };

  const insertVariable = (variable: string) => {
    setContent((prev) => `${prev} {${variable}} `);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Create Template */}
      <Card className="lg:col-span-1 border-zinc-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus size={18} className="text-indigo-600" />
            Create Template
          </CardTitle>
          <CardDescription>
            Craft reusable Instagram outreach messages with dynamic variable placeholders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-600 block mb-1">
                Template Name
              </label>
              <Input
                placeholder="e.g. Initial Outreach - Dentists"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-600 block mb-1">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e: any) => setType(e.target.value)}
                  className="w-full h-9 rounded-md border border-zinc-200 bg-white px-2 text-sm text-zinc-800"
                >
                  <option value="profession">Profession</option>
                  <option value="gender">Gender</option>
                  <option value="follow-up">Follow-Up</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-600 block mb-1">
                  Category
                </label>
                <Input
                  placeholder="e.g. dentist, 1st follow-up"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-600">
                  Message Content
                </label>
                <div className="flex gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => insertVariable("name")}
                    className="px-1.5 py-0.5 bg-zinc-100 hover:bg-zinc-200 rounded text-zinc-700"
                  >
                    +name
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable("username")}
                    className="px-1.5 py-0.5 bg-zinc-100 hover:bg-zinc-200 rounded text-zinc-700"
                  >
                    +username
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable("profession")}
                    className="px-1.5 py-0.5 bg-zinc-100 hover:bg-zinc-200 rounded text-zinc-700"
                  >
                    +profession
                  </button>
                </div>
              </div>
              <textarea
                rows={5}
                className="w-full rounded-md border border-zinc-200 bg-white p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-600"
                placeholder="Hi {name}, I saw your profile @{username} and wanted to reach out regarding..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {saving ? "Creating..." : "Save Template"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Templates List */}
      <Card className="lg:col-span-2 border-zinc-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare size={18} className="text-indigo-600" />
                Saved Templates ({templates.length})
              </CardTitle>
              <CardDescription>
                Manage outreach and follow-up templates used for direct messaging.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <MessageSquare size={36} className="mx-auto mb-2 text-zinc-300" />
              <p className="font-medium">No templates created yet</p>
              <p className="text-xs">Create your first template using the form on the left.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((tpl) => (
                <div
                  key={tpl._id}
                  className="p-4 rounded-lg border border-zinc-100 hover:border-zinc-200 bg-white transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-zinc-900 text-sm">{tpl.name}</h4>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {tpl.type}
                      </Badge>
                      {tpl.category && (
                        <span className="text-[11px] text-zinc-500 bg-zinc-50 border px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Tag size={10} />
                          {tpl.category}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => copyToClipboard(tpl.content, tpl._id)}
                      className="p-1 hover:bg-zinc-100 rounded text-zinc-500 transition-colors"
                      title="Copy content"
                    >
                      {copiedId === tpl._id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-700 bg-zinc-50/70 p-2.5 rounded border border-zinc-100 font-mono whitespace-pre-wrap">
                    {tpl.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
