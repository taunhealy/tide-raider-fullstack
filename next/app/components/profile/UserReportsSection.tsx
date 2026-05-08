"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { TrendingUp, Clock, MapPin, ChevronRight, Zap } from "lucide-react";
import Link from "next/link";
import LoadingIndicator from "../LoadingIndicator";
import { cn } from "@/app/lib/utils";

interface UserReportsSectionProps {
  userId: string;
}

export default function UserReportsSection({ userId }: UserReportsSectionProps) {
  const { data: reports, isLoading } = useQuery({
    queryKey: ["user-reports", userId],
    queryFn: async () => {
      const res = await fetch(`/api/backend/intelligence/user/${userId}/history`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    }
  });

  if (isLoading) return (
    <div className="py-20 flex flex-col items-center justify-center opacity-40">
       <LoadingIndicator />
       <p className="text-[10px] font-black uppercase tracking-widest mt-4">Retrieving Tactical Log...</p>
    </div>
  );

  if (!reports || reports.length === 0) return (
    <div className="py-32 text-center bg-white border border-slate-100 rounded-[40px] shadow-sm">
       <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <TrendingUp className="w-6 h-6 text-slate-300" />
       </div>
       <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Archive Offline</h3>
       <p className="text-[11px] text-slate-400 font-medium mt-2">This operator has not anchored any tactical signals yet.</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report: any) => (
          <Link 
            key={report.id}
            href={`/aireport?beachId=${report.beachId}&report=${report.id}`}
            className="group block bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-indigo-100 transition-all active:scale-[0.98]"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">
                    {report.category} • {report.duration}D
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                   <Clock className="w-3.5 h-3.5" />
                   <span className="text-[10px] font-bold">{format(new Date(report.createdAt), "MMM d")}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <h4 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                    {report.beach?.name || "Unknown Break"}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400 font-medium line-clamp-3 leading-relaxed">
                  {report.content.substring(0, 150)}...
                </p>
              </div>

              <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Signal Anchored</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="pt-8 border-t border-slate-100 flex items-center gap-3 opacity-30">
         <Zap className="w-4 h-4 text-slate-400" />
         <p className="text-[10px] font-black uppercase tracking-widest">End of Tactical Transmission</p>
      </div>
    </div>
  );
}
