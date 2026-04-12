import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Info, User } from "lucide-react";

export default function ActivityLogs({ logs }: { logs: any[] }) {
  return (
    <Card className="border-none shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-lg">Activity Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {!Array.isArray(logs) || logs.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">No activity logs yet.</div>
            ) : (
              logs.map((log) => (
                <div key={log._id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border bg-zinc-50/30 hover:bg-white hover:shadow-md hover:border-indigo-100 transition-all duration-300 group">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                    log.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {log.status === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <p className="text-sm font-semibold text-zinc-900 capitalize">
                        {log.action.replace('_', ' ')}
                      </p>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {format(new Date(log.timestamp), "MMM d, HH:mm:ss")}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 leading-relaxed">{log.details}</p>
                    {log.userId && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <User size={12} className="text-zinc-400" />
                        <span className="text-xs font-medium text-indigo-600">@{log.userId.username}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
