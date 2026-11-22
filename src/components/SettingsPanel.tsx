import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, Save, ShieldCheck, Mail, Instagram } from "lucide-react";
import { settingsService } from "../services/api";
import { toast } from "sonner";

export default function SettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    messageDelay: 30,
    followUpInterval: 2,
    maxFollowUps: 4,
    autoAnalyze: true,
    safeMode: true,
    instagramUsername: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await settingsService.get();
      if (res.data) {
        setSettings((prev) => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await settingsService.update(settings);
      toast.success("Settings updated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings size={18} className="text-indigo-600" />
            CRM Automation & Safety Settings
          </CardTitle>
          <CardDescription>
            Configure message throttling, follow-up cadences, and rate-limit guardrails.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Message Dispatch Delay (seconds)
                </label>
                <Input
                  type="number"
                  min={5}
                  max={300}
                  value={settings.messageDelay}
                  onChange={(e) =>
                    setSettings({ ...settings, messageDelay: parseInt(e.target.value) || 30 })
                  }
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Delay between consecutive messages to avoid account action blocks.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Follow-Up Interval (days)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={settings.followUpInterval}
                  onChange={(e) =>
                    setSettings({ ...settings, followUpInterval: parseInt(e.target.value) || 2 })
                  }
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Default schedule for next due follow-up date calculation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Max Follow-Ups Per Lead
                </label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.maxFollowUps}
                  onChange={(e) =>
                    setSettings({ ...settings, maxFollowUps: parseInt(e.target.value) || 4 })
                  }
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Ceiling limit before a lead is automatically marked complete or closed.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Connected Instagram Account
                </label>
                <div className="relative">
                  <Instagram size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input
                    placeholder="e.g. your_instagram_handle"
                    className="pl-8"
                    value={settings.instagramUsername || ""}
                    onChange={(e) =>
                      setSettings({ ...settings, instagramUsername: e.target.value })
                    }
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Username used for identification and outreach templates.
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.safeMode}
                  onChange={(e) => setSettings({ ...settings, safeMode: e.target.checked })}
                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <div>
                  <span className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    Enable Safe Mode Rate-Limiting
                  </span>
                  <p className="text-xs text-zinc-500">
                    Automatically enforces strict delays and pauses bulk campaigns if rate warnings trigger.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoAnalyze}
                  onChange={(e) => setSettings({ ...settings, autoAnalyze: e.target.checked })}
                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <div>
                  <span className="text-sm font-semibold text-zinc-900">
                    AI Automated Lead Categorization
                  </span>
                  <p className="text-xs text-zinc-500">
                    Uses Google Gemini AI to infer gender and profession from bios on import.
                  </p>
                </div>
              </label>
            </div>

            <Button
              type="submit"
              disabled={saving || loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {saving ? "Saving Settings..." : "Save Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
