"use client";

import { useQuery } from "@tanstack/react-query";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { format } from "date-fns";
import { safeFormat } from "@/app/lib/dateUtils";
import { 
  FileText, 
  ChevronRight, 
  Calendar, 
  MapPin, 
  User as UserIcon,
  Search,
  Sparkles,
  Loader2,
  ExternalLink
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";

interface IntelligenceReport {
  id: string;
  beachId: string;
  date: string;
  duration: number;
  endDate?: string;
  persona: string;
  content: string;
  createdAt: string;
  beach: {
    name: string;
    id: string;
  };
}

export default function AIReportsPage() {
  const { data: session, status } = useBackendAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: reports, isLoading } = useQuery<IntelligenceReport[]>({
    queryKey: ["intelligence-history", session?.user?.id],
    queryFn: async () => {
      const response = await fetch("/api/backend/intelligence/history");
      if (!response.ok) throw new Error("Failed to fetch reports");
      return response.json();
    },
    enabled: !!session?.user?.id,
  });

  const filteredReports = reports?.filter(report => 
    report.beach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.persona.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === "loading" || (isLoading && !reports)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-black opacity-20" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black opacity-40">Syncing Intelligence History...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-20 text-center">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Tactical Lockout</h1>
        <p className="text-gray-500 mb-8">You must be authenticated to view strategic intelligence history.</p>
        <Button asChild className="bg-black text-white hover:bg-gray-800 rounded-full px-8 h-12 font-bold uppercase tracking-widest text-[10px]">
          <Link href="/">Return to Map</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-500">Signal History • Verified</p>
          </div>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-tight">
            Strategic <br/> Intelligence
          </h1>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black opacity-20" />
          <input 
            type="text"
            placeholder="FILTER BY BEACH OR PERSONA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-6 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden mb-20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-black opacity-30">Intelligence Asset</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-black opacity-30">Forecast Cycle</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-black opacity-30">Generation Date</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-black opacity-30">Analyst Persona</th>
                <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-black opacity-30">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredReports && filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <tr key={report.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-black opacity-40 group-hover:bg-black group-hover:text-white transition-all shadow-sm">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-[14px] text-black group-hover:text-black transition-colors">{report.beach.name}</p>
                          <p className="text-[10px] font-medium text-black opacity-40 uppercase tracking-widest">
                            Tactical Intel [{safeFormat(report.date, "MMM d")}{report.duration > 1 && report.endDate ? ` - ${safeFormat(report.endDate, "MMM d")}` : ""}]
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-black opacity-20" />
                        <p className="text-[12px] font-semibold text-black/70">
                          {safeFormat(report.date, "MMM d")}
                          {report.duration > 1 && report.endDate && ` — ${safeFormat(report.endDate, "MMM d, yyyy")}`}
                          {report.duration <= 1 && `, ${safeFormat(report.date, "yyyy")}`}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[12px] font-medium text-black opacity-40">
                        {safeFormat(report.createdAt, "dd/MM/yyyy HH:mm")}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="px-2.5 py-1 rounded-md bg-gray-100 text-[10px] font-black uppercase tracking-widest text-black/60">
                          {report.persona}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Button asChild variant="ghost" className="h-10 px-4 rounded-xl border border-transparent hover:border-gray-200 hover:bg-white text-[10px] font-bold uppercase tracking-widest gap-2">
                        <Link href={`/raid?beachId=${report.beachId}&report=${report.id}`}>
                          VIEW INTEL <ExternalLink className="w-3 h-3" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-black opacity-10">
                        <FileText className="w-8 h-8" />
                      </div>
                      <h3 className="font-bold text-[14px] uppercase tracking-widest text-black/40">No Signal History Found</h3>
                      <p className="text-[12px] leading-relaxed text-black/30">Strategic intelligence reports you generate will appear here for historical reference.</p>
                      <Button asChild variant="outline" className="mt-4 h-10 px-6 rounded-full border-gray-200 text-[10px] font-bold uppercase tracking-widest">
                        <Link href="/raid">Go to Raid Hub</Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info */}
        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Total Reports: {reports?.length || 0}</p>
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-300" />
            <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Encrypted Storage • RAID-V2</p>
          </div>
          <p className="text-[9px] font-medium text-black/20 uppercase tracking-[0.2em]">All intelligence reports are stored securely in the Tide Raider cloud.</p>
        </div>
      </div>
    </div>
  );
}
