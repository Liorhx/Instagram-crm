import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { userService } from "../services/api";
import { toast } from "sonner";

export default function UploadSection({ onRefresh }: { onRefresh: () => void }) {
  const [csvText, setCsvText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUsers, setPreviewUsers] = useState<any[]>([]);

  const handleParseCsv = (text: string) => {
    setCsvText(text);
    const lines = text.trim().split("\n");
    if (lines.length <= 1) {
      setPreviewUsers([]);
      return;
    }
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const usernameIdx = header.indexOf("username");
    const nameIdx = header.indexOf("name");
    const bioIdx = header.indexOf("bio");
    const profIdx = header.indexOf("profession");

    const users: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.trim());
      if (parts.length > 0 && parts[0]) {
        users.push({
          username: usernameIdx >= 0 ? parts[usernameIdx] : parts[0],
          name: nameIdx >= 0 ? parts[nameIdx] : parts[1] || "",
          bio: bioIdx >= 0 ? parts[bioIdx] : parts[2] || "",
          profession: profIdx >= 0 ? parts[profIdx] : parts[3] || "general",
        });
      }
    }
    setPreviewUsers(users);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      handleParseCsv(content);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (previewUsers.length === 0) {
      toast.error("No valid leads detected to import.");
      return;
    }
    try {
      setUploading(true);
      await userService.upload(previewUsers);
      toast.success(`Successfully imported ${previewUsers.length} leads!`);
      setCsvText("");
      setPreviewUsers([]);
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to import leads");
    } finally {
      setUploading(false);
    }
  };

  const loadSampleData = () => {
    const sample = `username,name,bio,profession\ndr_smith_dental,Dr. John Smith,Cosmetic & General Dentistry in NYC,dentist\ncoach_sarah,Sarah Jenkins,Transformational life & business coach,coach\nmiami_realty,Alex Rivera,Luxury Real Estate Miami,real-estate\nfitwith_leo,Leo Gomez,Online Fitness Coach & Nutrition Specialist,fitness`;
    handleParseCsv(sample);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload size={18} className="text-indigo-600" />
            Import Leads from CSV
          </CardTitle>
          <CardDescription>
            Upload a CSV file or paste lead records directly. Columns should include: <code>username, name, bio, profession</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-zinc-200 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors bg-zinc-50/50">
            <FileText size={32} className="mx-auto text-zinc-400 mb-2" />
            <label className="cursor-pointer text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              Choose CSV File
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
            <p className="text-xs text-zinc-500 mt-1">or paste CSV data below</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-600">CSV Data</label>
              <button
                type="button"
                onClick={loadSampleData}
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
              >
                <Sparkles size={12} />
                Load sample data
              </button>
            </div>
            <textarea
              rows={8}
              className="w-full font-mono text-xs rounded-md border border-zinc-200 bg-white p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              placeholder="username,name,bio,profession&#10;dental_clinic,Dr. Alex,Dental surgeon in SF,dentist"
              value={csvText}
              onChange={(e) => handleParseCsv(e.target.value)}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={uploading || previewUsers.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {uploading ? "Importing Leads..." : `Import ${previewUsers.length} Leads`}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-zinc-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            Preview Detected Leads ({previewUsers.length})
          </CardTitle>
          <CardDescription>
            Verify parsed lead data before saving into your database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {previewUsers.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <AlertCircle size={32} className="mx-auto mb-2 text-zinc-300" />
              <p className="font-medium text-sm">No leads in preview</p>
              <p className="text-xs">Paste or upload CSV rows on the left to see the live preview.</p>
            </div>
          ) : (
            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
              {previewUsers.map((u, i) => (
                <div key={i} className="p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900">@{u.username}</span>
                    <span className="bg-white border px-1.5 py-0.5 rounded text-[10px] text-zinc-600 font-medium capitalize">
                      {u.profession || "General"}
                    </span>
                  </div>
                  {u.name && <p className="text-zinc-700 font-medium">{u.name}</p>}
                  {u.bio && <p className="text-zinc-500 text-[11px] line-clamp-2">{u.bio}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
