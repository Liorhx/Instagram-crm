import React, { useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Sparkles, UserPlus } from "lucide-react";
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
          username: (usernameIdx >= 0 ? parts[usernameIdx] : parts[0]).replace(/^@/, ""),
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
      toast.error("No valid leads detected to import");
      return;
    }
    try {
      setUploading(true);
      await userService.upload(previewUsers);
      toast.success(`Successfully imported ${previewUsers.length} leads to pipeline!`);
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
    const sample = `username,name,bio,profession\ndr_sarah_dental,Dr. Sarah Jenkins,Cosmetic dentist in Austin,dentist\nmarcus_fitpro,Marcus Vance,Strength & fitness coach,coach\naustin_realty_group,Elena Rostova,Luxury real estate specialist,real-estate\ncreative_studio_ny,Julian Reed,Brand designer & art director,agency`;
    handleParseCsv(sample);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Upload & CSV Input */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Upload size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Import Leads via CSV</h3>
              <p className="text-[11px] text-slate-400">Bulk upload Instagram leads into your CRM pipeline</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* File Dropzone */}
            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-6 text-center bg-slate-50/50 transition-colors">
              <FileSpreadsheet size={28} className="mx-auto text-slate-400 mb-2" />
              <label className="cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-700">
                Choose CSV File
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">or paste text below</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  CSV Data Rows
                </label>
                <button
                  type="button"
                  onClick={loadSampleData}
                  className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles size={11} />
                  Load Sample Leads
                </button>
              </div>
              <textarea
                rows={7}
                placeholder="username,name,bio,profession&#10;dr_smith,Dr. Smith,Dentist NYC,dentist"
                className="w-full font-mono text-[11px] p-3 rounded-lg border border-slate-200 text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-600 leading-relaxed"
                value={csvText}
                onChange={(e) => handleParseCsv(e.target.value)}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={uploading || previewUsers.length === 0}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <UserPlus size={14} />
              <span>{uploading ? "Importing..." : `Import ${previewUsers.length} Leads`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Leads Preview Table */}
      <div className="lg:col-span-7">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Parsed Preview ({previewUsers.length})</h3>
              <p className="text-[11px] text-slate-400">Review lead columns before committing to database</p>
            </div>
            {previewUsers.length > 0 && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 size={12} />
                Ready to Import
              </span>
            )}
          </div>

          {previewUsers.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <AlertCircle size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700 text-sm">No preview data</p>
              <p className="text-xs mt-0.5">Select a file or click "Load Sample Leads" to see the preview.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {previewUsers.map((u, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">@{u.username}</span>
                      {u.name && <span className="text-slate-500 font-medium">({u.name})</span>}
                    </div>
                    {u.bio && (
                      <p className="text-[11px] text-slate-600 truncate mt-0.5 max-w-md">
                        {u.bio}
                      </p>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 capitalize shrink-0">
                    {u.profession || "General"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
