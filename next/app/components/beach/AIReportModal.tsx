"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/app/components/ui/tooltip";
import { useSubscriptionStatus } from "@/app/hooks/useSubscriptionStatus";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { Input } from "@/app/components/ui/input";
import Link from "next/link";
import { Sparkles, Zap, ShieldAlert, CreditCard, Loader2, Bookmark, Share2, Mail, MessageSquare, Send, Users, ArrowRight, ArrowUpRight, Waves, Copy, Check, ChevronLeft, ChevronRight, Info, Instagram, Link2, X, Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import { handleSignIn } from "@/app/lib/auth-utils";
import { BeachSearchInput } from "@/app/components/ui/BeachSearchInput";

interface AIReportModalProps {
  beach?: any;
  isOpen: boolean;
  onClose: () => void;
  date: string;
  reportId?: string;
}

export default function AIReportModal({ beach, isOpen, onClose, date, reportId }: AIReportModalProps) {
  const [currentBeach, setCurrentBeach] = useState<any>(beach || null);

  useEffect(() => {
    setCurrentBeach(beach || null);
  }, [beach]);

  const {
    credits,
    isSubscribed,
    hasActiveTrial,
    isLoading: isCreditsLoading,
  } = useSubscriptionStatus();
  const { data: session, status: authStatus } = useBackendAuth();
  const isGated = (!session?.user || authStatus === "unauthenticated") || ((credits ?? 0) < 30);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [activeReportId, setActiveReportId] = useState<string | undefined>(reportId || searchParams.get("report") || undefined);
  const [reportSequence, setReportSequence] = useState<{ id: string, date: string, duration: number }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [pioneer, setPioneer] = useState<{ id?: string; name: string; instagram?: string; link?: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [existingReportDate, setExistingReportDate] = useState<Date | null>(null);
  const [displayedReportDuration, setDisplayedReportDuration] = useState<number>(7);
  const [reportCategory, setReportCategory] = useState<string>("GENERAL");
  const lastLoadedReportIdRef = useRef<string | null>(null);

  // Sharing State
  const [targetEmail, setTargetEmail] = useState("");
  const [targetWhatsApp, setTargetWhatsApp] = useState("");
  const [isSharingEmail, setIsSharingEmail] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [isToppingUp, setIsToppingUp] = useState(false);

  const [selectedDays, setSelectedDays] = useState(7);
  const [selectedSport, setSelectedSport] = useState("SURFING");
  const [selectedPersona, setSelectedPersona] = useState<string>("BRO");
  const [selectedSource, setSelectedSource] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("forecastSource");
      if (stored) return stored;
    }
    return "WINDFINDER";
  });
  const creditCost = selectedDays <= 1 ? 1 : 4;

  const handleSourceChange = (source: string) => {
    setSelectedSource(source);
    if (typeof window !== "undefined") {
      localStorage.setItem("forecastSource", source);
      window.dispatchEvent(new CustomEvent("forecastSourceChanged", { detail: source }));
    }
    setActiveReportId(undefined);
    setReport(null);
    setPioneer(null);
    setExistingReportDate(null);
  };

  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const stored = localStorage.getItem("forecastSource");
      if (stored && stored !== selectedSource) {
        setSelectedSource(stored);
      }
    }
  }, [isOpen, selectedSource]);

  // Sync prop changes and user profile data to internal state
  useEffect(() => {
    if (reportId) setActiveReportId(reportId);
  }, [reportId]);

  // Sync state to URL
  useEffect(() => {
    if (isOpen && activeReportId && activeReportId !== 'latest' && activeReportId !== 'true' && currentBeach) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("report", activeReportId);
      params.set("beachId", currentBeach.id);
      params.set("beachName", currentBeach.name);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [activeReportId, isOpen, currentBeach?.id, currentBeach?.name, pathname, router, searchParams]);

  // Auto-populate contact fields from session when modal opens
  useEffect(() => {
    if (isOpen && session?.user) {
      if (session.user.email) setTargetEmail(session.user.email);
      if (session.user.whatsappNumber) setTargetWhatsApp(session.user.whatsappNumber);
    }
  }, [isOpen, session?.user?.email, session?.user?.whatsappNumber]);

  // Fetch chronological sequence for this beach
  useEffect(() => {
    if (isOpen && currentBeach?.id) {
      const fetchSequence = async () => {
        try {
          const res = await fetch(`/api/backend/intelligence/beach/${currentBeach.id}/history?source=${selectedSource}`);
          if (res.ok) {
            const data = await res.json();
            setReportSequence(data);
          }
        } catch (err) {
          console.error("Failed to fetch report sequence", err);
        }
      };
      fetchSequence();
    }
  }, [isOpen, currentBeach?.id, selectedSource]);

  const handleCopyReport = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setIsCopied(true);
    toast.success("Intelligence Copied", { description: "Signal secured to clipboard." });
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Load report if activeReportId is provided OR check for latest for this beach
  useEffect(() => {
    if (activeReportId && activeReportId === lastLoadedReportIdRef.current) {
      return;
    }

    // Only proceed if modal is open and we have a valid beach object with an ID
    if (isOpen && (activeReportId || currentBeach?.id)) {
      const fetchReport = async () => {
        setIsLoadingArchive(true);
        try {
          let url = "";
          if (activeReportId && activeReportId !== 'latest' && activeReportId !== 'true') {
            url = `/api/backend/intelligence/report/${activeReportId}`;
          } else if (currentBeach?.id) {
            url = `/api/backend/intelligence/latest?beachId=${currentBeach.id}&source=${selectedSource}`;
          } else {
            return;
          }

          const response = await fetch(url);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            // Only throw error for real failures, 404 for a report-not-found is okay for "latest"
            if (response.status === 404 && (!activeReportId || activeReportId === 'latest' || activeReportId === 'true')) {
              setReport(null);
              setPioneer(null);
              lastLoadedReportIdRef.current = null;
              return;
            }

            const errorMessage = errorData.error || errorData.message || `Signal fetch failed (Status: ${response.status})`;
            console.error("[AIReportModal] Tactical fetch failed:", {
              status: response.status,
              url,
              error: errorData
            });
            throw new Error(errorMessage);
          }

          const data = await response.json();

          if (data && data.content) {
            setReport(data.content);
            setPioneer(data.user || data.pioneer || null);
            if (data.id) {
              lastLoadedReportIdRef.current = data.id;
              setActiveReportId(data.id);
            }
            if (data.source && data.source !== selectedSource) {
              setSelectedSource(data.source);
            }
            if (data.createdAt || data.date) {
              setExistingReportDate(new Date(data.createdAt || data.date));
            }
            if (data.duration) {
              setDisplayedReportDuration(data.duration);
            }
            if (data.category) {
              setReportCategory(data.category);
            }
          } else {
            // No report found for the latest check - this is a valid empty state
            setReport(null);
            setPioneer(null);
            setExistingReportDate(null);
            setDisplayedReportDuration(selectedDays);
            setReportCategory("GENERAL");
            lastLoadedReportIdRef.current = null;
          }
        } catch (error: any) {
          console.error("[AIReportModal] Detail load failed:", error);
          if (activeReportId && activeReportId !== 'latest') {
            toast.error(error.message || "Failed to load historical signal");
          } else if (activeReportId === 'latest') {
            // Silence error for 'latest' if it was just a 404
          }
        } finally {
          setIsLoadingArchive(false);
        }
      };
      fetchReport();
    }
  }, [activeReportId, isOpen, currentBeach?.id, selectedSource]);

  const handleNavigate = (direction: 'next' | 'prev') => {
    if (reportSequence.length === 0) return;

    const currentIdx = activeReportId
      ? reportSequence.findIndex(r => r.id === activeReportId)
      : 0;

    if (direction === 'prev' && currentIdx < reportSequence.length - 1) {
      setActiveReportId(reportSequence[currentIdx + 1].id);
    } else if (direction === 'next' && currentIdx > 0) {
      setActiveReportId(reportSequence[currentIdx - 1].id);
    }
  };

  // Is the report from today?
  const isReportCurrent = existingReportDate ?
    new Date(existingReportDate).toDateString() === new Date().toDateString() :
    true;



  // Reset report when modal closes
  useEffect(() => {
    if (!isOpen) {
      setReport(null);
      setExistingReportDate(null);
      setDisplayedReportDuration(7);
      setReportCategory("GENERAL");
      setActiveReportId(reportId);
      setReportSequence([]);
      setSelectedDays(7);
      lastLoadedReportIdRef.current = null;
    }
  }, [isOpen, reportId]);

  const handleClose = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
      params.delete("report");
      params.delete("beachId");
      params.delete("beachName");
      const newQuery = params.toString();
      router.replace(`${pathname}${newQuery ? `?${newQuery}` : ""}`, { scroll: false });
    }
    onClose();
  };

  const handleGenerate = async () => {
    if (credits < creditCost) {
      toast.error("Insufficient Credits", {
        description: `You need at least ${creditCost} credit${creditCost > 1 ? 's' : ''} to generate this report.`,
        action: {
          label: "Top Up",
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
          beachId: currentBeach.id,
          date,
          persona: selectedPersona,
          days: selectedDays,
          category: selectedSport,
          source: selectedSource
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Failed to generate report");
      }

      const data = await response.json();
      setReport(data.report);
      setPioneer(data.pioneer || null);
      if (data.category) setReportCategory(data.category);
      else setReportCategory(selectedSport);
      if (data.id) setActiveReportId(data.id);
      window.dispatchEvent(new CustomEvent("credits-updated"));
      window.dispatchEvent(new CustomEvent("intelligence-updated"));

      toast.success("Analysis Ready", {
        description: `Your ${selectedDays === 7 ? 'Weekly' : selectedDays + '-Day'} Strategic Report has been compiled.`
      });
    } catch (err: any) {
      toast.error("Process Failed", {
        description: err.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTopUp = async () => {
    setIsToppingUp(true);
    try {
      const response = await fetch("/api/paypal/create-credit-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) throw new Error("Connection failed");

      const data = await response.json();
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      }
    } catch (err: any) {
      toast.error("Checkout Error", {
        description: "Could not initialize secure payment."
      });
      setIsToppingUp(false);
    }
  };

  const shareViaEmail = async () => {
    if (!targetEmail) {
      toast.error("Email Required", { description: "Please enter a recipient address." });
      return;
    }

    setIsSharingEmail(true);
    try {
      // Calculate date range for the header
      const start = existingReportDate && !isNaN(new Date(existingReportDate).getTime())
        ? new Date(existingReportDate)
        : new Date();

      const end = new Date(start);
      end.setDate(end.getDate() + (selectedDays - 1));

      const formatDate = (d: Date) => {
        try {
          if (!d || isNaN(d.getTime())) return "Unknown";
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch (e) {
          return "Unknown";
        }
      };
      const dateRange = `${formatDate(start)} - ${formatDate(end)}`;

      const response = await fetch("/api/backend/intelligence/share-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          beachName: currentBeach ? currentBeach.name : "Unknown Break",
          reportText: report,
          dateRange: dateRange
        }),
      });

      if (!response.ok) throw new Error("Send failure");

      toast.success("Intelligence Shared", {
        description: `Strategic report sent to ${targetEmail}`
      });
    } catch (err) {
      toast.error("Comms Failure", {
        description: "Could not send report via email."
      });
    } finally {
      setIsSharingEmail(false);
    }
  };

  const shareViaWhatsApp = async () => {
    if (!report || !targetWhatsApp) {
      toast.error("Number Required", { description: "Please enter a valid WhatsApp number." });
      return;
    }

    setIsSharingWhatsApp(true);
    try {
      const response = await fetch("/api/backend/intelligence/share-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: targetWhatsApp,
          beachName: currentBeach ? currentBeach.name : "Unknown Break",
          reportText: report
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Broadcast failure");
      }

      toast.success("Intelligence Dispatched", {
        description: "Signal pushed through WhatsApp relay."
      });
    } catch (err: any) {
      toast.error("Transmission Error", {
        description: err.message || "Failed to dispatch WhatsApp signal."
      });
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] lg:max-w-7xl bg-white border-none shadow-2xl p-0 gap-0 overflow-hidden font-['Inter',_sans-serif] h-[95vh] md:h-auto md:max-h-[85vh] flex flex-col top-[52%] md:top-[50%] transition-all duration-500">
        <DialogTitle className="sr-only">AI Intelligence Dashboard: {currentBeach ? currentBeach.name : "Tactical Briefing"}</DialogTitle>
 
        {/* Unified Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-white shadow-xl shadow-gray-200">
              <Waves className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[22px] leading-tight font-black text-black tracking-tighter">
                  {currentBeach ? currentBeach.name : "Tactical Briefing"}
                </h2>
                {currentBeach && !beach && (
                  <button
                    onClick={() => {
                      setCurrentBeach(null);
                      setReport(null);
                      setActiveReportId(undefined);
                      setReportSequence([]);
                    }}
                    className="text-[9px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-[0.15em] px-2.5 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg ml-2 active:scale-95"
                  >
                    Change Break
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-black opacity-30 uppercase tracking-[0.2em]">
                  {currentBeach ? "Tactical Intelligence Command" : "Select a break asset to begin"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border border-gray-200 px-3 py-2 rounded-xl flex items-center gap-3 shadow-sm">
              <Zap className="w-4 h-4 text-blue-500 fill-current" />
              {isCreditsLoading ? (
                <div className="w-8 h-4 bg-gray-100 animate-pulse rounded" />
              ) : (
                <span className="text-[13px] font-black text-black tracking-tight">{credits ?? 0} <span className="opacity-30 font-bold uppercase text-[9px] tracking-widest ml-1">Credits</span></span>
              )}
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-colors" title="Close Intelligence Briefing">
                <X className="w-5 h-5" />
              </Button>
            </DialogClose>
          </div>
        </div>

        {!isCreditsLoading && isGated ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white min-h-[350px] overflow-y-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-dark-blue to-brand-3 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#60a5fa]/20 text-white animate-pulse">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-wider mb-2">Tactical Lockout</h2>
            <p className="text-sm text-slate-500 font-medium max-w-md leading-relaxed mb-8">
              Accessing strategic AI briefings and timed forecasts requires a minimum of <span className="font-bold text-slate-900">30 intelligence points</span>. You currently have <span className="font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">{credits ?? 0} points</span>.
            </p>
            {!session?.user ? (
              <div className="flex flex-col gap-3 w-full max-w-sm">
                <Button
                  onClick={() => handleSignIn(window.location.pathname)}
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-md transition-all active:scale-95"
                >
                  Sign In to Unlock
                </Button>
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 border-gray-200 hover:bg-gray-50 text-slate-700 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95"
                  >
                    Close
                  </Button>
                </DialogClose>
              </div>
            ) : (
              <div className="flex flex-col gap-3 w-full max-w-sm">
                <Button
                  onClick={() => router.push("/pricing")}
                  className="w-full h-12 bg-gradient-to-r from-brand-dark-blue to-brand-3 hover:opacity-90 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-md shadow-[#60a5fa]/20 transition-all active:scale-95 animate-pulse"
                >
                  Upgrade or Buy Credits
                </Button>
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 border-gray-200 hover:bg-gray-50 text-slate-700 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95"
                  >
                    Close
                  </Button>
                </DialogClose>
              </div>
            )}
          </div>
        ) : !currentBeach ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white min-h-[450px] overflow-y-auto">
            <div className="w-16 h-16 bg-gray-50 border border-gray-100 text-slate-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <Waves className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-wider mb-2">Tactical Asset Search</h2>
            <p className="text-sm text-slate-500 font-medium max-w-md leading-relaxed mb-8">
              Identify a beach break below to analyze sea conditions, compile multi-model ensembles, and generate tactical briefs.
            </p>
            <div className="w-full max-w-md">
              <BeachSearchInput
                selectedBeach={currentBeach}
                onBeachSelect={(selected) => {
                  if (selected) {
                    setCurrentBeach(selected);
                  }
                }}
                placeholder="Search beach breaks..."
                showSelectedBadge={false}
                inputClassName="h-14 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-slate-900/10 text-xs font-bold uppercase tracking-wider"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:grid md:grid-cols-[380px_1fr] flex-1 min-h-0 overflow-hidden">

            {/* Left Column: Configuration & Status */}
            <div className="bg-white border-r border-gray-100 p-8 space-y-10 overflow-y-auto custom-scrollbar">

              {/* Column Label */}
              <div className="pb-6 border-b border-gray-50">
                <h3 className="text-[14px] font-black uppercase tracking-[0.2em] text-black">Briefing Command</h3>
                <p className="text-[10px] font-medium text-gray-400 mt-1 italic leading-relaxed">
                  Synthesize new tactical data for this break.
                </p>
              </div>

              {/* Intel Specs */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-900/60">Generation Specs</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Specialization</label>
                    <div className="flex gap-2">
                      {[
                        { label: "Surf", value: "SURFING", icon: Waves },
                        { label: "Foil", value: "FOILING", icon: Sparkles },
                        { label: "Kite", value: "KITESURFING", icon: Zap }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setSelectedSport(opt.value)}
                          className={cn(
                            "flex-1 py-3 px-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all flex flex-col items-center gap-1.5",
                            selectedSport === opt.value
                              ? "bg-blue-600 border-blue-600 text-white shadow-lg scale-[1.02]"
                              : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                          )}
                        >
                          <opt.icon className={cn("w-4 h-4", selectedSport === opt.value ? "text-white" : "text-gray-300")} />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Forecast Source</label>
                    <div className="grid grid-cols-2 gap-2 bg-gray-50/50 p-2 rounded-2xl border border-gray-100/80">
                      {[
                        { label: "Windy", value: "WINDY" },
                        { label: "Windguru", value: "WINDGURU" },
                        { label: "Super", value: "WINDFINDER_SUPER" },
                        { label: "Finder", value: "WINDFINDER" },
                        { label: "Raider", value: "TIDE_RAIDER", fullWidth: true }
                      ].map((src) => (
                        <button
                          key={src.value}
                          onClick={() => handleSourceChange(src.value)}
                          className={cn(
                            "py-2 px-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all",
                            src.fullWidth ? "col-span-2 py-2.5" : "",
                            selectedSource === src.value
                              ? "bg-blue-600 border-blue-600 text-white shadow-md scale-[1.01]"
                              : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                          )}
                        >
                          {src.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Tone of Voice</label>
                    <div className="grid grid-cols-3 gap-2 bg-gray-50/50 p-2 rounded-2xl border border-gray-100/80">
                      {[
                        { label: "Bro", value: "BRO" },
                        { label: "Tactical", value: "ADVANCED" },
                        { label: "Pirate", value: "PIRATE" }
                      ].map((tone) => (
                        <button
                          key={tone.value}
                          onClick={() => setSelectedPersona(tone.value)}
                          className={cn(
                            "py-2 px-1 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all",
                            selectedPersona === tone.value
                              ? "bg-blue-600 border-blue-600 text-white shadow-md scale-[1.01]"
                              : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                          )}
                        >
                          {tone.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Tactical Window</label>
                    <TooltipProvider>
                      <div className="flex gap-2">
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
                                  "flex-1 py-3 px-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all relative",
                                  selectedDays === opt.value
                                    ? "bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-100 scale-[1.05] z-10"
                                    : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                                )}
                              >
                                {opt.label}
                                <div className={cn(
                                  "text-[7px] font-bold opacity-60",
                                  selectedDays === opt.value ? "text-white" : "text-gray-400"
                                )}>
                                  {opt.credits} CR
                                </div>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="bg-black text-white border-none text-[10px] font-bold p-2 px-3">
                              {opt.tooltip}
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TooltipProvider>
                  </div>
                </div>
              </div>

              {/* Action Area */}
              <div className="space-y-6 pt-4 border-t border-gray-50">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || isCreditsLoading || (credits < creditCost)}
                  className="w-full h-14 bg-gradient-to-r from-brand-dark-blue to-brand-3 hover:opacity-90 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[12px] shadow-xl shadow-[#60a5fa]/20 transition-all active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-3"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                      Analyzing Data...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-white animate-pulse" />
                      Generate Intel
                    </>
                  )}
                </Button>

                {credits < creditCost && (
                  <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100 space-y-4">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Credits Required</h4>
                    </div>
                    <p className="text-[11px] leading-relaxed font-medium text-amber-800 opacity-80">
                      You need {creditCost} credits to pioneer this briefing.
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full rounded-xl h-10 text-[10px] font-bold uppercase tracking-widest border-amber-200 bg-white text-amber-900 hover:bg-amber-50"
                    >
                      <Link href="/pricing">Top Up Now</Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* System Info */}
              <div className="pt-6">
                <div className="p-5 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm shrink-0">
                    <Info className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-black mb-1">AI Protocol v2.4</h4>
                    <p className="text-[10px] leading-relaxed text-gray-500 font-medium italic">
                      "Synthesizing ensemble forecasts with local historical patterns for tactical precision."
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Intelligence Briefing Display */}
            <div className="flex-1 flex flex-col bg-gray-50/30 min-h-0 overflow-hidden relative">

              {/* Column Label - Desktop Only Overlay */}
              <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] select-none">
                <span className="text-[120px] font-black uppercase tracking-tighter">INTELLIGENCE</span>
              </div>

              {/* Dynamic Source Tabs Menu (Always visible) */}
              <div className="px-8 py-3 bg-white border-b border-gray-100 flex items-center justify-between z-10 shadow-sm overflow-x-auto">
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Forecast Source:</span>
                  <div className="flex bg-gray-50 rounded-xl p-0.5 border border-gray-100/80">
                    {[
                      { id: "WINDY", label: "Windy" },
                      { id: "WINDGURU", label: "Windguru" },
                      { id: "WINDFINDER_SUPER", label: "Windfinder Super" },
                      { id: "WINDFINDER", label: "Windfinder" },
                      { id: "TIDE_RAIDER", label: "Tide Raider" }
                    ].map((src) => (
                      <button
                        key={src.id}
                        onClick={() => handleSourceChange(src.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shrink-0",
                          selectedSource === src.id
                            ? "bg-blue-600 text-white shadow-sm scale-[1.02]"
                            : "text-gray-400 hover:text-black"
                        )}
                      >
                        {src.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {isLoadingArchive ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-in fade-in duration-500">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                    <Sparkles className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-900/40">Accessing Signal Archives</p>
                    <p className="text-[13px] font-medium text-gray-400 mt-1 italic">Decrypted tactical data incoming...</p>
                  </div>
                </div>
              ) : !report ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in zoom-in-95 duration-500 overflow-y-auto">
                  <div className="w-24 h-24 rounded-3xl bg-white shadow-2xl shadow-gray-200 flex items-center justify-center mb-8 border border-gray-50">
                    <Zap className="w-10 h-10 text-gray-200" />
                  </div>
                  <h3 className="text-xl font-black text-black tracking-tight mb-3">No Active Signal</h3>
                  <p className="text-[14px] text-gray-400 max-w-sm font-medium leading-relaxed mb-6">
                    This break hasn't been pioneered yet for the <strong>{selectedSource === 'WINDFINDER_SUPER' ? 'Windfinder Super' : selectedSource === 'TIDE_RAIDER' ? 'Tide Raider' : selectedSource.charAt(0) + selectedSource.slice(1).toLowerCase()}</strong> forecast source. Be the first to generate a tactical brief and share intelligence with the crew.
                  </p>

                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || isCreditsLoading || (credits < creditCost)}
                    className="mb-8 px-6 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-black uppercase tracking-widest gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-30"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white animate-pulse" />
                        Pioneer {selectedSource === 'WINDFINDER_SUPER' ? 'Windfinder Super' : selectedSource === 'TIDE_RAIDER' ? 'Tide Raider' : selectedSource.charAt(0) + selectedSource.slice(1).toLowerCase()} Briefing
                      </>
                    )}
                  </Button>

                  <div className="flex items-center gap-3">
                    <div className="h-px w-8 bg-gray-200" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300">Tactical Readiness: 100%</span>
                    <div className="h-px w-8 bg-gray-200" />
                  </div>
                </div>
              ) : (
                <>
                  {/* Tactical Controls & Metadata Bar */}
                  <div className="px-8 py-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-blue-600 fill-current" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-blue-900">Briefing Active</span>
                      </div>
                      {existingReportDate && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Logged:</span>
                          <span className="text-[11px] font-black text-black">{format(new Date(existingReportDate), "MMM d, HH:mm")}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {reportSequence.length > 1 && (() => {
                        const currentIdx = activeReportId
                          ? reportSequence.findIndex(r => r.id === activeReportId)
                          : 0;
                        const prevReport = currentIdx < reportSequence.length - 1 ? reportSequence[currentIdx + 1] : null;
                        const nextReport = currentIdx > 0 ? reportSequence[currentIdx - 1] : null;

                        return (
                          <div className="flex items-center gap-1 bg-gray-50 rounded-2xl border border-gray-100 mr-2 p-1">
                            <button
                              onClick={() => handleNavigate('prev')}
                              disabled={!prevReport}
                              className="flex flex-col items-end px-3 py-1.5 hover:bg-white hover:shadow-sm rounded-xl transition-all group disabled:opacity-30"
                            >
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <ChevronLeft className="w-3.5 h-3.5 text-black group-hover:-translate-x-0.5 transition-transform" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-black/30">Older Intel</span>
                              </div>
                              {prevReport && (
                                <span className="text-[10px] font-bold text-black opacity-60">
                                  {format(new Date(prevReport.date), "MMM d")} ({prevReport.duration}D)
                                </span>
                              )}
                            </button>

                            <div className="h-8 w-px bg-gray-200 mx-1" />

                            <button
                              onClick={() => handleNavigate('next')}
                              disabled={!nextReport}
                              className="flex flex-col items-start px-3 py-1.5 hover:bg-white hover:shadow-sm rounded-xl transition-all group disabled:opacity-30"
                            >
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-black/30">Newer Intel</span>
                                <ChevronRight className="w-3.5 h-3.5 text-black group-hover:translate-x-0.5 transition-transform" />
                              </div>
                              {nextReport && (
                                <span className="text-[10px] font-bold text-black opacity-60">
                                  {format(new Date(nextReport.date), "MMM d")} ({nextReport.duration}D)
                                </span>
                              )}
                            </button>
                          </div>
                        );
                      })()}
                      <Button
                        onClick={handleCopyReport}
                        variant="outline"
                        className="h-10 px-4 rounded-xl border-gray-200 text-[10px] font-black uppercase tracking-widest gap-2 bg-white shadow-sm hover:border-black transition-colors"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-blue-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {isCopied ? "Secured" : "Copy Signal"}
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-10">

                      {!isReportCurrent && (
                        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-sm shadow-amber-200/50">
                              <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-widest mb-1">Stale Signal Warning</h4>
                              <p className="text-[12px] font-medium text-amber-800 opacity-80 leading-tight">
                                This intelligence was recorded earlier. Conditions may have evolved.
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="h-10 px-5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg shadow-amber-200/50 active:scale-[0.95] transition-all"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Refresh Intel
                          </Button>
                        </div>
                      )}

                      {/* The Report Content */}
                      <div className="relative group/report">
                        <div className="text-[16px] leading-[1.7] font-medium text-black/80 whitespace-pre-wrap bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 selection:bg-blue-100 selection:text-blue-900">
                          {/* Report Metadata Headings */}
                          <div className="mb-8 pb-8 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20">Surf Break</span>
                              <p className="text-[14px] font-bold text-black">{currentBeach?.name || beach?.name || "Unknown Break"}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20">Tactical window</span>
                              <p className="text-[14px] font-bold text-black">
                                {(() => {
                                  const start = existingReportDate || new Date();
                                  const end = new Date(start);
                                  end.setDate(end.getDate() + (displayedReportDuration - 1));
                                  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                  return `${fmt(start)} - ${fmt(end)}`;
                                })()}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20">Category</span>
                              <p className="text-[14px] font-bold text-black">{reportCategory}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-black/20">Intelligence Source</span>
                              <div className="text-[14px] font-bold text-black flex items-center gap-1">
                                {pioneer?.id ? (
                                  <Link
                                    href={`/profile/${pioneer.id}`}
                                    className="hover:text-blue-600 transition-colors flex items-center gap-1.5"
                                  >
                                    {pioneer.name}
                                    <ArrowUpRight className="w-3 h-3 opacity-30" />
                                  </Link>
                                ) : (
                                  <span>{pioneer?.name || 'Anonymous'}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {report}

                          {(() => {
                            const activePioneer = pioneer ? {
                              ...pioneer,
                              instagram: pioneer.instagram || undefined,
                              link: pioneer.link || undefined
                            } : {
                              name: "Ryko",
                              instagram: undefined,
                              link: undefined
                            };

                            return (
                              <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                                      <Users className="w-3 h-3 text-white" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-black/30 underline decoration-blue-500/30 underline-offset-4">AI Report provided by</span>
                                  </div>
                                  <div className="space-y-2">
                                    <h4 className="text-[20px] font-black text-black tracking-tighter">
                                      {activePioneer.id ? (
                                        <Link
                                          href={`/profile/${activePioneer.id}`}
                                          className="hover:text-blue-600 transition-colors"
                                        >
                                          {activePioneer.name}
                                        </Link>
                                      ) : activePioneer.name}
                                    </h4>
                                    <div className="flex flex-col gap-1.5">
                                      {activePioneer.instagram && (
                                        <Link
                                          href={`https://instagram.com/${activePioneer.instagram.replace('@', '')}`}
                                          target="_blank"
                                          className="text-[11px] font-bold text-black/60 hover:text-blue-600 flex items-center gap-2 transition-colors group"
                                        >
                                          <Instagram className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                                          {activePioneer.instagram.startsWith('@') ? activePioneer.instagram : `@${activePioneer.instagram}`}
                                        </Link>
                                      )}
                                      {activePioneer.link && (
                                        <Link
                                          href={activePioneer.link.startsWith('http') ? activePioneer.link : `https://${activePioneer.link}`}
                                          target="_blank"
                                          className="text-[11px] font-bold text-black/60 hover:text-blue-600 flex items-center gap-2 transition-colors group"
                                        >
                                          <Link2 className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                                          {activePioneer.link.replace(/^https?:\/\//, '')}
                                        </Link>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {activePioneer.instagram && (
                                    <Link
                                      href={`https://instagram.com/${activePioneer.instagram.replace('@', '')}`}
                                      target="_blank"
                                      className="h-10 px-5 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-200 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-black hover:text-white hover:border-black transition-all shadow-sm active:scale-95"
                                    >
                                      Instagram
                                    </Link>
                                  )}
                                  {activePioneer.link && (
                                    <Link
                                      href={activePioneer.link.startsWith('http') ? activePioneer.link : `https://${activePioneer.link}`}
                                      target="_blank"
                                      className="h-10 px-5 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-200 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-black hover:text-white hover:border-black transition-all shadow-sm active:scale-95"
                                    >
                                      Website
                                    </Link>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Professional Sharing Section */}
                      <div className="space-y-8 pt-10 border-t border-gray-100">
                        <div className="flex items-center gap-4">
                          <div className="h-px flex-1 bg-gray-100" />
                          <div className="flex items-center gap-3 px-4">
                            <Share2 className="w-4 h-4 text-black opacity-20" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-black/20">Distribute Intelligence</h4>
                          </div>
                          <div className="h-px flex-1 bg-gray-100" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                          <div className="p-6 rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-100/50 space-y-4 hover:border-blue-100 transition-colors group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                <Mail className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                              </div>
                              <span className="text-[10px] font-black text-black opacity-30 uppercase tracking-widest">Email Briefing</span>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={targetEmail}
                                onChange={(e) => setTargetEmail(e.target.value)}
                                placeholder="recipient@email.com"
                                className="h-12 text-[14px] rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-medium"
                              />
                              <Button
                                onClick={shareViaEmail}
                                disabled={isSharingEmail}
                                size="icon"
                                className="h-12 w-12 shrink-0 bg-black hover:bg-blue-600 rounded-xl shadow-xl shadow-black/10 transition-all text-white"
                              >
                                {isSharingEmail ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
                              </Button>
                            </div>
                          </div>

                          <div className="p-6 rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-100/50 space-y-4 hover:border-green-100 transition-colors group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-green-50 transition-colors">
                                <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-green-500" />
                              </div>
                              <span className="text-[10px] font-black text-black opacity-30 uppercase tracking-widest">WhatsApp Direct</span>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={targetWhatsApp}
                                onChange={(e) => setTargetWhatsApp(e.target.value)}
                                placeholder="+27..."
                                className="h-12 text-[14px] rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-medium"
                              />
                              <Button
                                onClick={shareViaWhatsApp}
                                disabled={isSharingWhatsApp}
                                size="icon"
                                className="h-12 w-12 shrink-0 bg-black hover:bg-green-600 rounded-xl shadow-xl shadow-black/10 transition-all text-white"
                              >
                                {isSharingWhatsApp ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <MessageSquare className="w-4 h-4 text-white" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Minimal Status Bar */}
              <div className="px-8 py-4 border-t border-gray-100 bg-white/80 backdrop-blur-md flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-black/20">
                <span>TR-SIGNAL SECURE</span>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span>Ensemble Live</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
