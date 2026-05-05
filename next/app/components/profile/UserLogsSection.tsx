"use client";

import { useRaidLogs } from "@/app/hooks/useRaidLogs";
import RaidLogTable from "@/app/components/raid-logs/RaidLogTable";
import { RandomLoader } from "@/app/components/ui/random-loader";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { Sparkles, History } from "lucide-react";

interface UserLogsSectionProps {
  userId: string;
}

export default function UserLogsSection({ userId }: UserLogsSectionProps) {
  const { data: session } = useBackendAuth();
  const { data: logsData, isLoading } = useRaidLogs({}, false, userId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RandomLoader isLoading={true} />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mt-4">Retrieving Mission Logs...</p>
      </div>
    );
  }

  if (!logsData || logsData.entries.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-[40px] border border-slate-200 border-dashed">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
          <History className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No mission logs filed in this sector</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
            <History className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 leading-none mb-1">Mission Logs</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Operational History & Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full border border-slate-200 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-brand-3" />
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            {logsData.total} Recorded
          </span>
        </div>
      </div>
      
      <div className="bg-white rounded-[48px] border border-slate-200 p-2 shadow-xl shadow-slate-200/50 overflow-hidden">
        <RaidLogTable 
          entries={logsData.entries} 
          onBeachClick={() => {}} 
          session={session ? { user: session.user || null } : null}
        />
      </div>
    </div>
  );
}
