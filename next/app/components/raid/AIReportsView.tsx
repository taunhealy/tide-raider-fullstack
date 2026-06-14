"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Sparkles, ArrowRight, Calendar, MapPin, Loader2, Search, Instagram, Link2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/app/lib/utils";
import AIReportModal from "../beach/AIReportModal";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";

interface IntelligenceReport {
  id: string;
  beachId: string;
  date: string;
  duration: number;
  endDate?: string;
  createdAt: string;
  beach: {
    name: string;
    id: string;
    regionId: string;
    countryId?: string;
    continent?: string;
  };
  category: string;
  source?: string;
  user?: {
    id: string;
    name: string;
    instagram?: string;
    link?: string;
  };
}

import { SOURCE_COLORS as sourceColors } from "@/app/constants/colors";

export default function AIReportsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<{ id: string; beach: any } | null>(null);
  const { filters } = useBeachFilters();

  const { data: reports, isLoading } = useQuery<IntelligenceReport[]>({
    queryKey: ["intelligenceHistory"],
    queryFn: async () => {
      const res = await fetch("/api/backend/intelligence/history");
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    }
  });

  const filteredReports = reports?.filter(report => {
    // Filter by selected region / country / continent first if active
    if (filters.regionId && filters.regionId !== "all") {
      const cleanFilterId = filters.regionId.toLowerCase().replace(/[\s_-]+/g, "-");
      const matchRegion = report.beach?.regionId?.toLowerCase().replace(/[\s_-]+/g, "-") === cleanFilterId;
      const matchCountry = report.beach?.countryId?.toLowerCase().replace(/[\s_-]+/g, "-") === cleanFilterId;
      const matchContinent = report.beach?.continent?.toLowerCase().replace(/[\s_-]+/g, "-") === cleanFilterId;
      
      if (!matchRegion && !matchCountry && !matchContinent) {
        return false;
      }
    }
    // Filter by search query
    return report?.beach?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  const handleLoadSignal = (report: IntelligenceReport) => {
    if (!report?.beach) {
      console.warn("[AIReportsView] Report missing beach data:", report);
      return;
    }
    setSelectedReport({
      id: report.id,
      beach: report.beach
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-gray-500 font-black text-[10px] uppercase tracking-widest">Scanning Intelligence Archive...</p>
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <Sparkles className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-xl font-black text-black mb-2">No Intelligence Profiles Found</h3>
        <p className="text-gray-500 max-w-sm text-sm">
          Generate your first Weekly Strategic Outlook for any beach break to begin building your archive.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative group/search">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input 
          type="text" 
          placeholder="Filter by beach..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          suppressHydrationWarning
          className="w-full bg-white/80 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
        />
      </div>

      <div className="overflow-x-auto rounded-3xl border border-gray-100 shadow-sm bg-white">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-gray-50/50 border-bottom border-gray-100">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date Range</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Tactical Asset</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredReports?.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50/30 transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-black flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      {(() => {
                        try {
                          const start = new Date(report.date);
                          if (isNaN(start.getTime())) return "Unknown Date";
                          let range = format(start, "MMM dd");
                          if (report.duration > 1 && report.endDate) {
                            const end = new Date(report.endDate);
                            if (!isNaN(end.getTime())) {
                              range += ` - ${format(end, "MMM dd")}`;
                            }
                          }
                          return range;
                        } catch (e) {
                          return "Unknown Date";
                        }
                      })()}
                    </span>
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
                                className="hover:text-blue-500 transition-colors p-0.5"
                                title="Website"
                              >
                                <Link2 className="w-3 h-3 text-slate-400 hover:text-blue-500" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                    <span className="text-[10px] text-gray-400 font-medium mt-1">
                      Tactical Intel [{(() => {
                        try {
                          const start = new Date(report.date);
                          if (isNaN(start.getTime())) return "N/A";
                          let range = format(start, "MMM dd");
                          if (report.duration > 1 && report.endDate) {
                            const end = new Date(report.endDate);
                            if (!isNaN(end.getTime())) {
                              range += ` - ${format(end, "MMM dd")}`;
                            }
                          }
                          return range;
                        } catch (e) {
                          return "N/A";
                        }
                      })()}]
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 group-hover:bg-white group-hover:border-blue-300 transition-all">
                      <MapPin className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-sm font-black text-black tracking-tight">{report.beach?.name || "Unknown Asset"}</span>
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border",
                      report.category === "FOILING" ? "bg-brand-blue-medium/10 text-brand-blue-medium border-brand-blue-medium/20" :
                      report.category === "KITESURFING" ? "bg-brand-blue-primary/10 text-brand-blue-primary border-brand-blue-primary/20" :
                      "bg-brand-blue-dark/10 text-brand-blue-dark border-brand-blue-dark/20"
                    )}>
                      {report.category === "KITESURFING" ? "KITE" : 
                       report.category === "FOILING" ? "FOIL" : "SURF"}
                    </span>
                    {report.source && (
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ml-1",
                        (sourceColors[report.source.toUpperCase()] || sourceColors.WINDY).bg,
                        (sourceColors[report.source.toUpperCase()] || sourceColors.WINDY).text,
                        (sourceColors[report.source.toUpperCase()] || sourceColors.WINDY).border
                      )}>
                        {(sourceColors[report.source.toUpperCase()] || sourceColors.WINDY).label}
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-6 py-5 text-right">
                  <button 
                    onClick={() => handleLoadSignal(report)}
                    suppressHydrationWarning
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 focus:outline-none transition-all pr-2"
                  >
                    Load Signal
                    <ArrowRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedReport && (
        <AIReportModal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          beach={selectedReport.beach}
          reportId={selectedReport.id}
          date={new Date().toISOString()} // Date is fallback if reportId fails
        />
      )}
    </div>
  );
}
