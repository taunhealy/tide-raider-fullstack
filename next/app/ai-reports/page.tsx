"use client";

import { useQuery } from "@tanstack/react-query";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { format } from "date-fns";
import { cn } from "@/app/lib/utils";
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
  ExternalLink,
  Instagram,
  Link2
} from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { BeachSearchInput } from "@/app/components/ui/BeachSearchInput";
import type { Beach } from "@/app/types/beaches";
import AIReportModal from "@/app/components/beach/AIReportModal";

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
  category?: string;
  source?: string;
  user?: {
    id: string;
    name: string;
    instagram?: string;
    link?: string;
  };
}

const sourceColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
  WINDY:             { bg: "bg-indigo-50",    text: "text-indigo-600",   border: "border-indigo-100",   label: "Windy" },
  WINDGURU:          { bg: "bg-cyan-50",      text: "text-cyan-600",     border: "border-cyan-100",     label: "Guru" },
  WINDFINDER_SUPER:  { bg: "bg-fuchsia-50",   text: "text-fuchsia-600",  border: "border-fuchsia-100",  label: "Super" },
  WINDFINDER:        { bg: "bg-sky-50",       text: "text-sky-600",      border: "border-sky-100",      label: "Finder" },
  TIDE_RAIDER:       { bg: "bg-zinc-950",     text: "text-zinc-100",     border: "border-zinc-800",     label: "Raider" }
};

function AIReportsContent() {
  const { data: session, status } = useBackendAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const reportParam = searchParams.get("report");
  const beachIdParam = searchParams.get("beachId");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBeach, setSelectedBeach] = useState<Beach | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | undefined>(undefined);

  const handleLoadReport = (beach: Beach, reportId: string) => {
    setSelectedBeach(beach);
    setSelectedReportId(reportId);
    setIsReportOpen(true);
  };

  // Deep-linking support on mount
  useEffect(() => {
    if (reportParam && beachIdParam && (!selectedBeach || selectedBeach.id !== beachIdParam)) {
      const fetchBeach = async () => {
        try {
          const res = await fetch(`/api/backend/beaches/${beachIdParam}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.id) {
              setSelectedBeach(data);
              setSelectedReportId(reportParam);
              setIsReportOpen(true);
            }
          }
        } catch (err) {
          console.error("Failed to load deep-linked beach", err);
        }
      };
      fetchBeach();
    }
  }, [reportParam, beachIdParam]);

  const { data: reports, isLoading } = useQuery<IntelligenceReport[]>({
    queryKey: ["intelligence-history"],
    queryFn: async () => {
      const response = await fetch("/api/backend/intelligence/history");
      if (!response.ok) throw new Error("Failed to fetch reports");
      return response.json();
    },
    enabled: true,
  });

  const filteredReports = reports?.filter(report => {
    const lowerSearch = searchTerm.toLowerCase();
    const beachName = (report.beach?.name ?? "").toLowerCase();
    const persona = (report.persona ?? "").toLowerCase();
    const category = (report.category ?? "").toLowerCase();
    return beachName.includes(lowerSearch) || persona.includes(lowerSearch) || category.includes(lowerSearch);
  });

  if (isLoading && !reports) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-black opacity-20" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black opacity-40">Syncing Intelligence History...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Signal History • Verified</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Strategic Intelligence
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Archived ocean intelligence and weekly strategic forecasts.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <Button 
            onClick={() => setIsReportOpen(true)}
            className="w-full sm:w-auto h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 px-6 shrink-0"
          >
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
            Generate Report
          </Button>

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
      </div>

      {/* Reports Table / Card Container */}
      <div className="bg-transparent md:bg-white rounded-[24px] md:rounded-[32px] border-none md:border md:border-gray-100 shadow-none md:shadow-sm overflow-hidden mb-20">
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
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
                    <td 
                      className="px-8 py-6 cursor-pointer select-none"
                      onClick={() => handleLoadReport(report.beach as any, report.id)}
                    >
                      <div className="flex items-center gap-4 group/asset">
                        {/* Premium AI Purple Hover Circle for Map Pin */}
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-black opacity-40 group-hover/asset:bg-gradient-to-br group-hover/asset:from-violet-500 group-hover/asset:to-indigo-600 group-hover/asset:text-white transition-all shadow-sm">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-[14px] text-black group-hover/asset:text-black transition-colors">{report.beach.name}</p>
                          {(() => {
                            const user = report.user || {
                              name: "Ryko",
                              instagram: undefined,
                              link: undefined
                            };
                            return (
                              <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500/80 mt-1" onClick={(e) => e.stopPropagation()}>
                                <span className="opacity-60">by {user.name}</span>
                                <div className="flex items-center gap-1 ml-0.5">
                                  {user.instagram && (
                                    <a 
                                      href={`https://instagram.com/${user.instagram.replace('@', '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:text-pink-500 transition-colors p-0.5"
                                      title={`Instagram: ${user.instagram}`}
                                    >
                                      <Instagram className="w-3 h-3 text-slate-400 hover:text-pink-500" />
                                    </a>
                                  )}
                                  {user.link && (
                                    <a 
                                      href={user.link.startsWith('http') ? user.link : `https://${user.link}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:text-indigo-500 transition-colors p-0.5"
                                      title="Website"
                                    >
                                      <Link2 className="w-3 h-3 text-slate-400 hover:text-indigo-500" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                          <p className="text-[10px] font-medium text-black/40 uppercase tracking-widest mt-1">
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
                        {report.source && (
                          <div className={cn(
                            "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border",
                            (sourceColors[report.source.toUpperCase()] || sourceColors.WINDY).bg,
                            (sourceColors[report.source.toUpperCase()] || sourceColors.WINDY).text,
                            (sourceColors[report.source.toUpperCase()] || sourceColors.WINDY).border
                          )}>
                            {(sourceColors[report.source.toUpperCase()] || sourceColors.WINDY).label}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {/* Clicking View Intel triggers modal right on this page */}
                      <Button 
                        onClick={() => handleLoadReport(report.beach as any, report.id)} 
                        variant="ghost" 
                        className="h-10 px-4 rounded-xl border border-transparent hover:border-gray-200 hover:bg-white text-[10px] font-bold uppercase tracking-widest gap-2"
                      >
                        VIEW INTEL <ExternalLink className="w-3 h-3" />
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

        {/* Mobile Card List View */}
        <div className="block md:hidden space-y-4">
          {filteredReports && filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <div 
                key={report.id} 
                onClick={() => handleLoadReport(report.beach as any, report.id)}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm active:scale-[0.98] transition-all flex flex-col gap-4 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-black opacity-60">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-black leading-tight">{report.beach.name}</h4>
                      <p className="text-[9px] font-medium text-black/40 uppercase tracking-widest mt-0.5">
                        {safeFormat(report.date, "MMM d")}{report.duration > 1 && report.endDate ? ` - ${safeFormat(report.endDate, "MMM d")}` : ""}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {report.source && (
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border leading-none",
                        (sourceColors[report.source.toUpperCase()] || sourceColors.WINDY).bg,
                        (sourceColors[report.source.toUpperCase()] || sourceColors.WINDY).text,
                        (sourceColors[report.source.toUpperCase()] || sourceColors.WINDY).border
                      )}>
                        {(sourceColors[report.source.toUpperCase()] || sourceColors.WINDY).label}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-[8px] font-black uppercase tracking-widest text-black/60 leading-none">
                      {report.persona}
                    </span>
                  </div>
                </div>

                <div className="h-px bg-gray-50" />

                <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-300" />
                    <span>{safeFormat(report.createdAt, "dd/MM/yyyy HH:mm")}</span>
                  </div>
                  
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoadReport(report.beach as any, report.id);
                    }} 
                    variant="ghost" 
                    className="h-8 px-3 rounded-lg border border-transparent hover:border-gray-200 hover:bg-white text-[9px] font-black uppercase tracking-widest gap-1 text-indigo-600"
                  >
                    View <ExternalLink className="w-2.5 h-2.5" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center bg-white rounded-2xl border border-gray-100 p-6">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-black opacity-10 mx-auto mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-xs uppercase tracking-widest text-black/40">No Signal History Found</h4>
              <p className="text-[11px] leading-relaxed text-black/30 mt-1">Strategic intelligence reports you generate will appear here.</p>
              <Button asChild variant="outline" className="mt-4 h-10 px-6 rounded-full border-gray-200 text-[10px] font-bold uppercase tracking-widest">
                <Link href="/raid">Go to Raid Hub</Link>
              </Button>
            </div>
          )}
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

      {/* AI Report Modal */}
      {(isReportOpen || selectedBeach) && (
        <AIReportModal
          isOpen={isReportOpen}
          onClose={() => {
            setIsReportOpen(false);
            setSelectedBeach(null);
            setSelectedReportId(undefined);
            
            // Gracefully clean up deep-linked query parameters when closing modal
            const params = new URLSearchParams(window.location.search);
            params.delete("report");
            params.delete("beachId");
            params.delete("beachName");
            const newQuery = params.toString();
            router.replace(`${pathname}${newQuery ? `?${newQuery}` : ""}`, { scroll: false });
          }}
          beach={selectedBeach}
          reportId={selectedReportId}
          date={new Date().toISOString()}
        />
      )}
    </div>
  );
}

export default function AIReportsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-black opacity-20" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black opacity-40">Initializing Intelligence Center...</p>
      </div>
    }>
      <AIReportsContent />
    </Suspense>
  );
}
