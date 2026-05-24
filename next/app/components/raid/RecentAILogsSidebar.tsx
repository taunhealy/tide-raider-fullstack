"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Sparkles, MapPin, Calendar, ArrowRight, Loader2, Instagram, Link2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/app/lib/utils";
import AIReportModal from "@/app/components/beach/AIReportModal";
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

const categoryColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
  FOILING:    { bg: "bg-amber-50",   text: "text-amber-600",  border: "border-amber-100",  label: "Foiling" },
  KITESURFING:{ bg: "bg-blue-50",    text: "text-blue-600",   border: "border-blue-100",   label: "Kitesurfing" },
  SURFING:    { bg: "bg-teal-50",    text: "text-teal-600",   border: "border-teal-100",   label: "Surfing" },
};

const sourceColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
  WINDY:             { bg: "bg-indigo-50",    text: "text-indigo-600",   border: "border-indigo-100",   label: "Windy" },
  WINDGURU:          { bg: "bg-cyan-50",      text: "text-cyan-600",     border: "border-cyan-100",     label: "Guru" },
  WINDFINDER_SUPER:  { bg: "bg-fuchsia-50",   text: "text-fuchsia-600",  border: "border-fuchsia-100",  label: "Super" },
  WINDFINDER:        { bg: "bg-sky-50",       text: "text-sky-600",      border: "border-sky-100",      label: "Finder" },
  TIDE_RAIDER:       { bg: "bg-zinc-950",     text: "text-zinc-100",     border: "border-zinc-800",     label: "Raider" }
};

function formatDateRange(date: string, duration: number, endDate?: string): string {
  try {
    const start = new Date(date);
    if (isNaN(start.getTime())) return "—";
    if (duration > 1 && endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        return `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
      }
    }
    return format(start, "MMM d, yyyy");
  } catch {
    return "—";
  }
}

export default function RecentAILogsSidebar() {
  const [selectedReport, setSelectedReport] = useState<{ id: string; beach: any } | null>(null);
  const { filters } = useBeachFilters();

  const { data: reports, isLoading } = useQuery<IntelligenceReport[]>({
    queryKey: ["intelligenceHistorySidebar"],
    queryFn: async () => {
      const res = await fetch("/api/backend/intelligence/history");
      if (!res.ok) throw new Error("Failed to fetch AI logs");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const filteredReports = reports?.filter(report => {
    if (filters.regionId) {
      return report.beach?.regionId === filters.regionId;
    }
    return true;
  }) ?? [];

  const recentReports = filteredReports.slice(0, 5);

  return (
    <>
      <div className="bg-[var(--color-bg-primary)] rounded-2xl border border-[var(--color-border-tan)] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.18em] font-primary">
              AI Logs
            </h3>
          </div>
          <a
            href="/ai-reports"
            className="text-[10px] font-bold text-brand-3 hover:underline transition-colors"
          >
            View All
          </a>
        </div>

        {/* Divider */}
        <div className="h-px bg-black/5 mx-5" />

        {/* Content */}
        <div className="px-3 py-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Loading Intel…
              </span>
            </div>
          ) : recentReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-2">
              <Sparkles className="w-6 h-6 text-slate-200 mb-2" />
              <p className="text-[11px] text-slate-400 font-medium">
                No AI reports yet.
              </p>
              <p className="text-[10px] text-slate-300 mt-0.5">
                Generate a report from any beach.
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {recentReports.map((report, idx) => {
                const cat = categoryColors[report.category] ?? categoryColors.SURFING;
                const dateStr = formatDateRange(report.date, report.duration, report.endDate);

                return (
                  <li key={report.id}>
                    <button
                      onClick={() =>
                        setSelectedReport({ id: report.id, beach: report.beach })
                      }
                      className={cn(
                        "group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                        "hover:bg-gradient-to-r hover:from-violet-50 hover:to-indigo-50/60",
                        "hover:shadow-sm",
                      )}
                    >
                      {/* Index / glow dot */}
                      <div className="shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center">
                        <span className="text-[9px] font-black text-violet-500 leading-none">
                          {idx + 1}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[11px] font-black text-slate-800 truncate">
                            {report.beach?.name ?? "Unknown Break"}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border",
                              cat.bg,
                              cat.text,
                              cat.border,
                            )}
                          >
                            {cat.label}
                          </span>
                          {report.source && (
                            <span
                              className={cn(
                                "shrink-0 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border",
                                (sourceColors[report.source.toUpperCase()] || sourceColors.WINDY).bg,
                                (sourceColors[report.source.toUpperCase()] || sourceColors.WINDY).text,
                                (sourceColors[report.source.toUpperCase()] || sourceColors.WINDY).border,
                              )}
                            >
                              {(sourceColors[report.source.toUpperCase()] || sourceColors.WINDY).label}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5 text-[10px] text-slate-400 font-medium">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5 shrink-0" />
                            <span>{dateStr}</span>
                          </div>
                          {(() => {
                            const user = report.user || {
                              name: "gh0st",
                              instagram: undefined,
                              link: undefined
                            };
                            return (
                              <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500/80 mt-0.5" onClick={(e) => e.stopPropagation()}>
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
                                      <Instagram className="w-2.5 h-2.5" />
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
                                      <Link2 className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Arrow */}
                      <ArrowRight
                        className={cn(
                          "shrink-0 w-3.5 h-3.5 text-slate-300 transition-all",
                          "group-hover:text-violet-400 group-hover:translate-x-0.5",
                        )}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedReport && (
        <AIReportModal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          beach={selectedReport.beach}
          reportId={selectedReport.id}
          date={new Date().toISOString()}
        />
      )}
    </>
  );
}
