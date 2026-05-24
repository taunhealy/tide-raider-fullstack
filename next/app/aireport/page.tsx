"use client";

import { useState, useEffect, Suspense } from "react";
import { 
  Waves, 
  Sparkles, 
  Zap, 
  ShieldAlert, 
  Loader2, 
  Share2, 
  Mail, 
  MessageSquare, 
  Send, 
  Copy, 
  Check, 
  Info, 
  Users, 
  ArrowUpRight, 
  Instagram, 
  Link2, 
  History, 
  ChevronRight,
  TrendingUp,
  Clock,
  Lock
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { BeachSearchInput } from "@/app/components/ui/BeachSearchInput";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/input";
import { useSubscriptionStatus } from "@/app/hooks/useSubscriptionStatus";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { handleSignIn } from "@/app/lib/auth-utils";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/app/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import Link from "next/link";
import type { Beach } from "@/app/types/beaches";
import { useSearchTracking } from "@/app/hooks/useSearchTracking";
import RecentBeachSearch from "@/app/components/RecentBeachSearch";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { format } from "date-fns";
import { safeFormat } from "@/app/lib/dateUtils";

function AIReportContent() {
  const { credits, isLoading: isCreditsLoading } = useSubscriptionStatus();
  const { data: session } = useBackendAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const beachIdParam = searchParams.get("beachId");
  const activeReportId = searchParams.get("report");
  
  const [generationBeach, setGenerationBeach] = useState<Beach | null>(null);
  const [archiveBeach, setArchiveBeach] = useState<Beach | null>(null);
  const [selectedDays, setSelectedDays] = useState(7);
  const [selectedSport, setSelectedSport] = useState("SURFING");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [archive, setArchive] = useState<any[]>([]);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);
  const { trackBeach } = useSearchTracking();
  
  // Date state to avoid hydration mismatches
  const [dateDisplay, setDateDisplay] = useState<{start: string, end: string} | null>(null);

  useEffect(() => {
    const start = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = new Date(Date.now() + (selectedDays - 1) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    setDateDisplay({ start, end });
  }, [selectedDays]);

  // Handle pre-selected beach from URL (maps to ARCHIVE)
  useEffect(() => {
    if (beachIdParam && (!archiveBeach || archiveBeach.id !== beachIdParam)) {
      const fetchBeach = async () => {
        try {
          const res = await fetch(`/api/backend/beaches/${beachIdParam}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.id) {
              setArchiveBeach(data);
              // Also set generation beach if none selected yet
              if (!generationBeach) setGenerationBeach(data);
            }
          }
        } catch (err) {
          console.error("Failed to fetch beach from URL", err);
        }
      };
      fetchBeach();
    }
  }, [beachIdParam]);

  // Fetch Archive when archiveBeach changes
  useEffect(() => {
    if (archiveBeach?.id) {
      setIsLoadingArchive(true);
      fetch(`/api/backend/intelligence/beach/${archiveBeach.id}/history`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setArchive(data);
            // If no specific report is in URL, load the latest one automatically
            if (!activeReportId && data.length > 0) {
               router.push(`/aireport?beachId=${archiveBeach.id}&report=${data[0].id}`, { scroll: false });
            }
          } else {
            setArchive([]);
          }
        })
        .catch(err => {
          console.error("Archive fetch failed", err);
          setArchive([]);
        })
        .finally(() => setIsLoadingArchive(false));
    } else {
      setArchive([]);
    }
  }, [archiveBeach, activeReportId]);

  // Load specific report if requested
  useEffect(() => {
    if (activeReportId) {
      const loadReport = async () => {
        try {
          const res = await fetch(`/api/backend/intelligence/report/${activeReportId}`);
          if (res.ok) {
            const data = await res.json();
            setReportData(data);
          }
        } catch (err) {
          console.error("Failed to load specific report", err);
        }
      };
      loadReport();
    } else {
      setReportData(null);
    }
  }, [activeReportId]);

  // Load most recent signal on initial page load if no parameters exist
  useEffect(() => {
    if (!beachIdParam && !activeReportId && !isGenerating) {
      const fetchInitialSignal = async () => {
        try {
          // Fetch the absolute latest report generated in the entire system
          const res = await fetch('/api/backend/intelligence/global-latest');
          if (res.ok) {
            const latest = await res.json();
            if (latest && latest.id) {
              // Automatically navigate to the absolute most recent report in the system
              router.replace(`/aireport?beachId=${latest.beachId}&report=${latest.id}`, { scroll: false });
              return;
            }
          }
          
          // Fallback to user history if global latest fetch failed or returned empty
          const historyRes = await fetch('/api/backend/intelligence/history');
          if (historyRes.ok) {
            const data = await historyRes.json();
            if (Array.isArray(data) && data.length > 0) {
              const latest = data[0];
              router.replace(`/aireport?beachId=${latest.beachId}&report=${latest.id}`, { scroll: false });
            }
          }
        } catch (err) {
          console.error("Failed to fetch initial signal history", err);
        }
      };
      fetchInitialSignal();
    }
  }, [beachIdParam, activeReportId, isGenerating]);

  const handleGenerationBeachSelect = (beach: Beach | null) => {
    setGenerationBeach(beach);
    if (beach?.id) {
      trackBeach(beach.id);
    }
  };

  const handleArchiveBeachSelect = (beach: Beach | null) => {
    setArchiveBeach(beach);
    if (beach?.id) {
      trackBeach(beach.id);
      router.push(`/aireport?beachId=${beach.id}${activeReportId ? `&report=${activeReportId}` : ''}`);
    } else {
      router.push(`/aireport`);
    }
  };

  const creditCost = selectedDays <= 1 ? 1 : 4;

  const handleGenerate = async () => {
    if (!generationBeach) {
      toast.error("Selection Required", { description: "Identify a break for tactical analysis." });
      return;
    }

    if (credits < creditCost) {
      toast.error("Signal Blocked", {
        description: `Insufficient credits for a ${selectedDays}-day window.`,
        action: {
          label: "Refill",
          onClick: () => window.location.href = "/pricing"
        }
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/backend/intelligence/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beachId: generationBeach.id,
          date: new Date().toISOString().split("T")[0],
          persona: "ADVANCED",
          days: selectedDays,
          category: selectedSport
        }),
      });

      if (!response.ok) throw new Error("Generation failed");

      const data = await response.json();
      const newReportId = data.id || data.reportId;
      if (data && newReportId) {
        setArchiveBeach(generationBeach);
        router.push(`/aireport?beachId=${generationBeach.id}&report=${newReportId}`);
        toast.success("Intelligence Compiling", { description: "Signal has been anchored to the archive." });
        
        // Refresh archive
        const arcRes = await fetch(`/api/backend/intelligence/beach/${generationBeach.id}/history`);
        if (arcRes.ok) {
          const arcData = await arcRes.json();
          if (Array.isArray(arcData)) setArchive(arcData);
        }
      }
    } catch (err: any) {
      toast.error("Comms Failure", { description: err.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyReport = () => {
    if (!reportData?.content) return;
    navigator.clipboard.writeText(reportData.content);
    setIsCopied(true);
    toast.success("Signal Secured");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isGated = (!session?.user) || ((credits ?? 0) < 30);

  if (!isCreditsLoading && isGated) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 font-primary selection:bg-indigo-500/30 selection:text-white">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 text-center shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
           <div className="w-16 h-16 bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Lock className="w-6 h-6" />
           </div>
           <h2 className="text-xl font-black uppercase tracking-wider mb-2">Tactical Lockout</h2>
           <p className="text-sm text-white/60 font-medium leading-relaxed mb-8">
             Accessing strategic AI briefings and timed forecasts requires a minimum of <span className="font-bold text-white">30 intelligence points</span>. You currently have <span className="font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{credits ?? 0} points</span>.
           </p>
           
           {!session?.user ? (
             <Button
               onClick={() => handleSignIn(window.location.pathname)}
               className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
             >
               Sign In to Unlock
             </Button>
           ) : (
             <Button
               onClick={() => router.push("/pricing")}
               className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
             >
               Upgrade or Buy Credits
             </Button>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 selection:text-white font-primary lg:overflow-hidden flex flex-col">
      {/* Top Navigation / Status */}
      <header className="min-h-16 py-3 sm:py-0 border-b border-white/5 bg-black/40 backdrop-blur-xl px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between shrink-0 z-20 gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-start">
          <Link href="/raid" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all group shrink-0">
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 rotate-180 group-hover:text-white" />
          </Link>
          <div className="h-4 w-px bg-white/10 shrink-0" />
          <h1 className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/40 truncate">AI Intelligence Terminal</h1>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
          <div className="bg-indigo-500/10 border border-indigo-500/20 px-3 sm:px-4 py-1.5 rounded-full flex items-center gap-2 sm:gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
             <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-indigo-400">
               {isCreditsLoading ? "Syncing..." : `${credits ?? 0} Credits Available`}
             </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-gray-500" />
          </div>
        </div>
      </header>

      {/* Dashboard Grid */}
      <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden">
        
        {/* Left Column: Command & Configuration */}
        <aside className="w-full lg:w-[400px] border-b lg:border-r border-white/5 bg-[#080808] flex flex-col shrink-0 lg:overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-8 lg:space-y-10">
          
          <div className="space-y-2">
            <h2 className="text-[14px] font-black uppercase tracking-[0.2em] text-white">Briefing Command</h2>
            <p className="text-[11px] font-medium text-white/30 italic">Initialize a new tactical intelligence signal.</p>
          </div>

          {/* Beach Selection */}
          <div className="space-y-6 pt-4 border-t border-white/5">
            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Target Break</label>
              <BeachSearchInput 
                selectedBeach={generationBeach}
                onBeachSelect={handleGenerationBeachSelect}
                placeholder="Select break for briefing..."
                inputClassName="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-14 rounded-2xl focus:ring-indigo-500/50"
                showSelectedBadge={true}
              />
            </div>
            
            <div className="space-y-4">
              <RecentBeachSearch 
                onBeachSelect={handleGenerationBeachSelect}
                selectedBeachId={generationBeach?.id}
                vertical={true}
              />
            </div>
          </div>

          {/* Specs */}
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Specialization</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Surf", value: "SURFING", icon: Waves },
                  { label: "Foil", value: "FOILING", icon: Sparkles },
                  { label: "Kite", value: "KITESURFING", icon: Zap }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedSport(opt.value)}
                    className={cn(
                      "py-4 px-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-2",
                      selectedSport === opt.value
                        ? "bg-white border-white text-black shadow-xl shadow-white/10 scale-[1.02]"
                        : "bg-white/5 border-white/5 text-white/20 hover:border-white/20 hover:bg-white/10"
                    )}
                  >
                    <opt.icon className="w-5 h-5" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Tactical Window</label>
              <TooltipProvider>
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                  {[
                    { label: "1D", value: 1, credits: 1, tooltip: "1 Credit for 24h Intelligence" },
                    { label: "3D", value: 3, credits: 4, tooltip: "4 Credits for 3-Day Tactical Window" },
                    { label: "1W", value: 7, credits: 4, tooltip: "4 Credits for Full Weekly Outlook" }
                  ].map((opt) => (
                    <Tooltip key={opt.value}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setSelectedDays(opt.value)}
                          className={cn(
                            "flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative",
                            selectedDays === opt.value
                              ? "bg-white text-black shadow-xl"
                              : "text-white/30 hover:text-white"
                          )}
                        >
                          {opt.label}
                          <div className={cn(
                            "text-[7px] font-bold opacity-60",
                            selectedDays === opt.value ? "text-black/40" : "text-white/20"
                          )}>
                            {opt.credits} CR
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-white text-black border-none text-[10px] font-bold p-2 px-3">
                        {opt.tooltip}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !generationBeach || (credits < creditCost)}
              className="w-full h-16 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[12px] shadow-2xl shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-20 flex items-center justify-center gap-3 group"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Sea State...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Compile Signal
                </>
              )}
            </Button>
            {credits < creditCost && generationBeach && (
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 text-center animate-pulse">
                Insufficient Credits for this window
              </p>
            )}
          </div>

          <div className="flex-1" />

          {/* System Info */}
          <div className="pt-8 border-t border-white/5 opacity-20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[9px] font-black uppercase tracking-widest">Ensemble Node Active</span>
            </div>
            <p className="text-[10px] leading-relaxed">
              Tactical reports are generated using multi-model synthesis from Windy, ECMWF, and localized bathymetry models.
            </p>
          </div>
        </aside>

        {/* Main Content: Intelligence Feed & Archive */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#050505] relative">
          
          {/* Background Watermark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.02] select-none text-center">
            <span className="text-[200px] font-black uppercase tracking-tighter block leading-none">TACTICAL</span>
            <span className="text-[200px] font-black uppercase tracking-tighter block leading-none">SIGNAL</span>
          </div>

          {/* Top Info Bar: Archive Controller */}
          <div className="min-h-20 lg:h-20 px-4 lg:px-8 py-4 lg:py-0 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-black/20 backdrop-blur-md z-10 shrink-0 gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-8 flex-1 w-full">
              <div className="flex items-center gap-3 shrink-0">
                <History className="w-4 h-4 text-white/30" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">Archive</h3>
              </div>
              
              <div className="w-full sm:w-[300px]">
                <BeachSearchInput 
                  selectedBeach={archiveBeach}
                  onBeachSelect={handleArchiveBeachSelect}
                  placeholder="Browse historical breaks..."
                  inputClassName="bg-white/5 border-white/5 text-white/60 placeholder:text-white/20 h-11 rounded-xl focus:ring-indigo-500/30 text-[11px]"
                  showSelectedBadge={false}
                />
              </div>
            </div>

            {archiveBeach && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-white/60">{archiveBeach.name}</span>
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest">{Array.isArray(archive) ? archive.length : 0} Signals</span>
              </div>
            )}
          </div>

          {/* Scrollable Feed */}
          <div className="flex-1 lg:overflow-y-auto custom-scrollbar-hidden p-4 lg:p-10 z-10">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-12">
              
              {/* Active Report Section */}
              <div className="space-y-12">
                {reportData ? (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                           <TrendingUp className="w-4 h-4 text-indigo-400" />
                           <h2 className="text-2xl lg:text-3xl font-black tracking-tighter text-white">Active Intelligence</h2>
                        </div>
                        <p className="text-[10px] lg:text-[12px] font-medium text-white/40 tracking-wide uppercase tracking-[0.1em]">
                          {reportData.category} Briefing • {safeFormat(reportData.date, "MMMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                        <Button 
                          onClick={handleCopyReport}
                          className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-black uppercase tracking-widest gap-3 transition-all"
                        >
                          {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                          {isCopied ? "Secured" : "Copy Signal"}
                        </Button>
                      </div>
                    </div>

                    <div className="bg-[#0c0c0c] border border-white/5 rounded-[2rem] lg:rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-500/5">
                      <div className="p-6 lg:p-12 space-y-8 lg:space-y-10">
                        {/* Report Header Metadata */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8 pb-8 lg:pb-10 border-b border-white/5">
                          <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Tactical Window</span>
                            <p className="text-[14px] lg:text-[15px] font-bold text-white">{reportData.duration} Day{reportData.duration > 1 ? 's' : ''}</p>
                          </div>
                          {reportData.source && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Forecast Source</span>
                              <p className="text-[14px] lg:text-[15px] font-bold text-white uppercase tracking-wider">
                                {reportData.source === 'WINDFINDER_SUPER' ? 'Windfinder Super' : reportData.source === 'TIDE_RAIDER' ? 'Tide Raider' : reportData.source.charAt(0) + reportData.source.slice(1).toLowerCase()}
                              </p>
                            </div>
                          )}
                          {reportData.category && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Discipline</span>
                              <p className="text-[14px] lg:text-[15px] font-bold text-white uppercase tracking-wider">
                                {reportData.category === 'SURFING' ? 'Surfing' : reportData.category === 'FOILING' ? 'Foiling' : 'Kitesurfing'}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="text-[16px] lg:text-[18px] leading-[1.8] font-medium text-white/80 whitespace-pre-wrap selection:bg-indigo-500/40">
                          {reportData.content}
                        </div>

                        {/* Contributor Section */}
                        {reportData.user && (
                          <div className="mt-8 lg:mt-12 pt-8 lg:pt-10 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-4 lg:gap-6">
                              <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                                {reportData.user.image ? (
                                  <img src={reportData.user.image} alt="" className="w-full h-full object-cover opacity-80" />
                                ) : (
                                  <Users className="w-6 h-6 lg:w-8 lg:h-8 text-white/20" />
                                )}
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">Intelligence Contributor</span>
                                <h4 className="text-[18px] lg:text-[20px] font-black text-white tracking-tight">{reportData.user.name}</h4>
                                <div className="flex flex-wrap items-center gap-3 lg:gap-4">
                                  {reportData.user.instagram && typeof reportData.user.instagram === 'string' && (
                                    <Link href={`https://instagram.com/${reportData.user.instagram.replace('@', '')}`} target="_blank" className="flex items-center gap-1.5 text-[10px] lg:text-[11px] font-bold text-white/30 hover:text-white transition-colors">
                                      <Instagram className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                                      {reportData.user.instagram}
                                    </Link>
                                  )}
                                  {reportData.user.link && typeof reportData.user.link === 'string' && (
                                    <Link href={reportData.user.link.startsWith('http') ? reportData.user.link : `https://${reportData.user.link}`} target="_blank" className="flex items-center gap-1.5 text-[10px] lg:text-[11px] font-bold text-white/30 hover:text-white transition-colors">
                                      <Link2 className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                                      {reportData.user.link.replace(/^https?:\/\//, '')}
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <Link href={`/profile/${reportData.user.id}`} className="w-full sm:w-auto h-11 lg:h-12 px-6 rounded-xl bg-white text-black text-[10px] lg:text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                              View Profile <ArrowUpRight className="w-4 h-4" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30 animate-in fade-in duration-1000">
                    <div className="w-24 h-24 rounded-[2rem] border-2 border-dashed border-white/20 flex items-center justify-center">
                      <Zap className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-black uppercase tracking-[0.3em]">Standby for Signal</h3>
                      <p className="text-[11px] font-medium mt-2">Select a break or historical report to initialize the interface.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Archive: History Feed */}
              <div className="space-y-8">
                <div className="flex flex-col gap-6 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">Tactical Logs</h3>
                  </div>
                  
                  <RecentBeachSearch 
                    onBeachSelect={handleArchiveBeachSelect}
                    selectedBeachId={archiveBeach?.id}
                    className="mt-0"
                    labelClassName="hidden"
                    vertical={true}
                  />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {isLoadingArchive ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-32 bg-white/5 rounded-3xl animate-pulse" />
                    ))
                  ) : archive.length > 0 ? (
                    archive.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => router.push(`/aireport?beachId=${archiveBeach?.id}&report=${item.id}`)}
                        className={cn(
                          "w-full text-left p-6 rounded-[2rem] border transition-all group relative overflow-hidden",
                          activeReportId === item.id
                            ? "bg-white border-white text-black shadow-2xl shadow-white/10"
                            : "bg-[#0c0c0c] border-white/5 text-white hover:border-white/20"
                        )}
                      >
                        <div className="space-y-4 relative z-10">
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                              activeReportId === item.id ? "bg-black/10 text-black/40" : "bg-white/5 text-white/30"
                            )}>
                              {item.category} • {item.duration}D
                            </span>
                            <Clock className={cn("w-3 h-3", activeReportId === item.id ? "text-black/20" : "text-white/10")} />
                          </div>
                          
                          <div>
                           <p className={cn("text-[14px] font-bold tracking-tight mb-1", activeReportId === item.id ? "text-black" : "text-white")}>
                             {safeFormat(item.date, "EEE, MMM d")}
                           </p>
                           <div className="flex items-center justify-between">
                             <p className={cn("text-[11px] font-medium", activeReportId === item.id ? "text-black/60" : "text-white/40")}>
                               Captured at {safeFormat(item.date, "HH:mm")}
                             </p>
                           </div>
                          </div>

                          <div className={cn(
                            "pt-4 border-t flex items-center justify-between",
                            activeReportId === item.id ? "border-black/5" : "border-white/5"
                          )}>
                             <div className="flex items-center gap-2">
                               <span className={cn("text-[10px] font-black uppercase tracking-widest", activeReportId === item.id ? "text-indigo-600" : "text-indigo-400")}>
                                 {item.user?.name || "Tide Raider"}
                               </span>
                             </div>
                             <ChevronRight className={cn("w-4 h-4 transition-transform group-hover:translate-x-1", activeReportId === item.id ? "text-black/20" : "text-white/20")} />
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="py-20 text-center opacity-20">
                      <History className="w-8 h-8 mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Archive Empty</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AIReportPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#050505]">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 relative">
               <div className="absolute inset-0 rounded-full border-2 border-white/5 animate-ping" />
               <div className="absolute inset-2 rounded-full border-2 border-indigo-500 animate-pulse" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Synchronizing Uplink...</p>
          </div>
        </div>
      }>
        <AIReportContent />
      </Suspense>
    </ErrorBoundary>
  );
}
