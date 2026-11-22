import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { History, Search, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export default function ActivityLogs({ logs }: { logs: any[] }) {
  const [search, setSearch] = useState("");

  const filteredLogs = logs.filter((log) => {
    const text = `${log.action || ""} ${log.details || ""} ${log.userId?.username || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <Card className="border-zinc-200">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <History size={18} className="text-indigo-600" />
              Activity & Outreach Logs ({logs.length})
            </CardTitle>
            <CardDescription>
              Chronological audit log of all automated outreach, DM dispatches, and lead modifications.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <Clock size={36} className="mx-auto mb-2 text-zinc-300" />
            <p className="font-medium">No activity recorded yet</p>
            <p className="text-xs">Outreach actions and messaging events will appear here in real time.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredLogs.map((log) => (
              <div key={log._id} className="py-3 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {log.status === "success" ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : (
                      <XCircle size={16} className="text-red-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-zinc-900">{log.action || "Event"}</span>
                      {log.userId?.username && (
                        <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          @{log.userId.username}
                        </span>
                      )}
                      <Badge
                        variant={log.status === "success" ? "secondary" : "destructive"}
                        className="text-[10px] capitalize px-1.5 py-0"
                      >
                        {log.status}
                      </Badge>
                    </div>
                    {log.details && (
                      <p className="text-xs text-zinc-600 mt-1">{log.details}</p>
                    )}
                  </div>
                </div>
                <div className="text-[11px] text-zinc-400 whitespace-nowrap">
                  {log.timestamp ? format(new Date(log.timestamp), "MMM d, HH:mm") : "-"}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
