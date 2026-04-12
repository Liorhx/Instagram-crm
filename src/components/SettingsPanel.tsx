import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { Save, Clock, Loader2, RefreshCw } from "lucide-react";
import { settingsService } from '../services/api';

export default function SettingsPanel() {
  const [settings, setSettings] = useState({
    followUpInterval: 2,
    maxFollowUps: 4
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await settingsService.get();
      if (res.data) {
        setSettings({
          followUpInterval: res.data.followUpInterval || 2,
          maxFollowUps: res.data.maxFollowUps || 4
        });
      }
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsService.update(settings);
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      <Card className="border-none shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock size={20} className="text-indigo-600" />
            Follow-up Configuration
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Manage your follow-up intervals and limits.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-4 sm:p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label className="text-sm sm:text-base">Follow-up interval (days)</Label>
                <p className="text-[10px] sm:text-xs text-zinc-500">When to mark a user as "Follow-up Due".</p>
              </div>
              <span className="font-mono font-bold text-indigo-600 shrink-0">{settings.followUpInterval}d</span>
            </div>
            <input 
              type="range"
              value={settings.followUpInterval} 
              min={1} 
              max={14} 
              step={1} 
              onChange={(e) => setSettings({...settings, followUpInterval: parseInt(e.target.value)})}
              className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label className="text-sm sm:text-base">Max follow-ups per lead</Label>
                <p className="text-[10px] sm:text-xs text-zinc-500">Maximum number of follow-ups before stopping.</p>
              </div>
              <span className="font-mono font-bold text-indigo-600 shrink-0">{settings.maxFollowUps}</span>
            </div>
            <input 
              type="range"
              value={settings.maxFollowUps} 
              min={1} 
              max={10} 
              step={1} 
              onChange={(e) => setSettings({...settings, maxFollowUps: parseInt(e.target.value)})}
              className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </CardContent>
      </Card>

      <Button 
        className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-indigo-100 h-12" 
        size="lg" 
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
        Save Settings
      </Button>
    </div>
  );
}
