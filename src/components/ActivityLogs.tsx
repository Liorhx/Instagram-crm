import React, { useState } from "react";
import { History, Search, CheckCircle2, XCircle, Clock, Send, User, Filter } from "lucide-react";
import { format } from "date-fns";

export default function ActivityLogs({ logs }: { logs: any[] }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "success" | "failed">("all");

  const filteredLogs = (Array.isArray(logs) ? logs : []).filter((log) => {
    const term = search.toLowerCase();
    const matchesSearch =
      (log.action || "").toLowerCase().includes(term) ||
      (log.details || "").toLowerCase().includes(term) ||
      (log.userId?.username || "").toLowerCase().includes(term);

    const matchesStatus = filterStatus === "all" || log.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header & Filter Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Activity & Outreach History</h3>
          <p className="text-[11px] text-slate-400">Audit trail of messages sent, lead imports, and cadence updates</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative w-48 sm:w-60">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50/50"
            />
          </div>

          {/* Status Filter */}
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                filterStatus === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus("success")}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                filterStatus === "success" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Success
            </button>
            <button
              onClick={() => setFilterStatus("failed")}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                filterStatus === "failed" ? "bg-white text-rose-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Failed
            </button>
          </div>
        </div>
      </div>

      {/* Logs Feed */}
      <div className="divide-y divide-slate-100">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <History size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-700 text-sm">No activity recorded</p>
            <p className="text-xs mt-0.5">Outreach actions, DM logs, and lead modifications will display here.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isSuccess = log.status === "success";
            return (
              <div key={log._id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {isSuccess ? (
                      <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                        <CheckCircle2 size={13} />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                        <XCircle size={13} />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900">{log.action || "Outreach"}</span>
                      {log.userId?.username && (
                        <a
                          href={`https://instagram.com/${log.userId.username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-mono font-semibold text-indigo-600 hover:underline bg-indigo-50 px-2 py-0.5 rounded"
                        >
                          @{log.userId.username}
                        </a>
                      )}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          isSuccess
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>

                    {log.details && (
                      <p className="text-xs text-slate-600 mt-1 font-mono bg-slate-50 p-2 rounded border border-slate-100 max-w-2xl whitespace-pre-wrap">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-[11px] font-medium text-slate-400 whitespace-nowrap shrink-0">
                  {log.timestamp ? format(new Date(log.timestamp), "MMM d, HH:mm") : "—"}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
