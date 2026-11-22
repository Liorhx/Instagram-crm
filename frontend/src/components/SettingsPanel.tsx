import React, { useState, useEffect } from "react";
import { Settings, Save, ShieldCheck, Instagram, Clock, Sliders, Check } from "lucide-react";
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
      toast.success("Settings saved successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sliders size={18} strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Pipeline Cadence & Rate Limits</h3>
            <p className="text-[11px] text-slate-400">Configure automated follow-up scheduling and Instagram safety throttling</p>
          </div>
        </div>

        {/* Section 1: Connected Account */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Instagram Profile
          </h4>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Your Instagram Handle
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">@</span>
              <input
                type="text"
                placeholder="your_handle"
                className="w-full h-9 pl-7 pr-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50/50"
                value={settings.instagramUsername || ""}
                onChange={(e) =>
                  setSettings({ ...settings, instagramUsername: e.target.value.replace(/^@/, "") })
                }
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Used to identify the sender when creating outreach messages.
            </p>
          </div>
        </div>

        {/* Section 2: Outreach Cadence */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Follow-Up Rules
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Follow-up Interval (Days)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50/50"
                value={settings.followUpInterval}
                onChange={(e) =>
                  setSettings({ ...settings, followUpInterval: parseInt(e.target.value) || 2 })
                }
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Days to wait before scheduling the next follow-up.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Max Follow-ups per Lead
              </label>
              <input
                type="number"
                min={1}
                max={10}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50/50"
                value={settings.maxFollowUps}
                onChange={(e) =>
                  setSettings({ ...settings, maxFollowUps: parseInt(e.target.value) || 4 })
                }
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Outreach halts after reaching this limit.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Safety Throttling */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Safety & Guardrails
          </h4>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Dispatch Delay (Seconds)
            </label>
            <input
              type="number"
              min={10}
              max={300}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50/50"
              value={settings.messageDelay}
              onChange={(e) =>
                setSettings({ ...settings, messageDelay: parseInt(e.target.value) || 30 })
              }
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Minimum buffer between consecutive actions to prevent Instagram rate-limits.
            </p>
          </div>

          <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
            <input
              type="checkbox"
              checked={settings.safeMode}
              onChange={(e) => setSettings({ ...settings, safeMode: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 h-4 w-4 mt-0.5 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600" />
                Anti-Spam Safe Mode
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Automatically throttles bulk actions and warns when outreach velocity exceeds safe limits.
              </p>
            </div>
          </label>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving || loading}
            className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Save size={14} />
            <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
