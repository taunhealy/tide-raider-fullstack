"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/Button";
import { useSubscriptionStatus } from "@/app/hooks/useSubscriptionStatus";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { Input } from "@/app/components/ui/input";
import Link from "next/link";
import { Sparkles, Zap, ShieldAlert, CreditCard, Loader2, Bookmark, Share2, Mail, MessageSquare, Send, Users, ArrowRight, Waves, Copy, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";

interface AIReportModalProps {
  beach: any;
  isOpen: boolean;
  onClose: () => void;
  date: string;
  reportId?: string;
}

export default function AIReportModal({ beach, isOpen, onClose, date, reportId }: AIReportModalProps) {
  if (!beach && isOpen) return null;

  const { credits, isLoading: isCreditsLoading, isSubscribed } = useSubscriptionStatus();
  const { data: session, status: authStatus } = useBackendAuth();
  const router = useRouter();
  const [activeReportId, setActiveReportId] = useState<string | undefined>(reportId);
  const [reportSequence, setReportSequence] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [existingReportDate, setExistingReportDate] = useState<Date | null>(null);
  
  // Sharing State
  const [targetEmail, setTargetEmail] = useState("");
  const [targetWhatsApp, setTargetWhatsApp] = useState("");
  const [isSharingEmail, setIsSharingEmail] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const [selectedDays, setSelectedDays] = useState(7);
  const [selectedSport, setSelectedSport] = useState("SURFING");
  const creditCost = selectedDays <= 1 ? 1 : 4;

  // Sync prop changes and user profile data to internal state
  useEffect(() => {
    setActiveReportId(reportId);
  }, [reportId]);

  // Auto-populate contact fields from session when modal opens
  useEffect(() => {
    if (isOpen && session?.user) {
      if (session.user.email) setTargetEmail(session.user.email);
      if (session.user.whatsappNumber) setTargetWhatsApp(session.user.whatsappNumber);
    }
  }, [isOpen, session?.user?.email, session?.user?.whatsappNumber]);

  // Fetch chronological sequence for this beach
  useEffect(() => {
    if (isOpen && beach?.id) {
      const fetchSequence = async () => {
        try {
          const res = await fetch(`/api/backend/intelligence/beach/${beach.id}/history`);
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
  }, [isOpen, beach?.id]);

  const handleCopyReport = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setIsCopied(true);
    toast.success("Intelligence Copied", { description: "Signal secured to clipboard." });
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Load report if activeReportId is provided OR check for latest for this beach
  useEffect(() => {
    // Only proceed if modal is open and we have a valid beach object with an ID
    if (isOpen && (activeReportId || beach?.id)) {
      const fetchReport = async () => {
        setIsLoadingArchive(true);
        try {
          let url = "";
          if (activeReportId && activeReportId !== 'latest' && activeReportId !== 'true') {
            url = `/api/backend/intelligence/report/${activeReportId}`;
          } else {
            url = `/api/backend/intelligence/latest?beachId=${beach.id}`;
          }

          const response = await fetch(url);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            // Only throw error for real failures, 404 for a report-not-found is okay for "latest"
            if (response.status === 404 && (!activeReportId || activeReportId === 'latest' || activeReportId === 'true')) {
              setReport(null);
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
            if (data.createdAt || data.date) {
              setExistingReportDate(new Date(data.createdAt || data.date));
            }
          } else {
            // No report found for the latest check - this is a valid empty state
            setReport(null);
            setExistingReportDate(null);
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
  }, [activeReportId, isOpen, beach?.id]);

  const handleNavigate = (direction: 'next' | 'prev') => {
    if (reportSequence.length === 0) return;
    
    // Find current index
    // If we're looking at "latest" but it's in the sequence, find it.
    // latest is index 0 (desc)
    const currentIdx = activeReportId 
      ? reportSequence.indexOf(activeReportId) 
      : 0;

    if (direction === 'prev' && currentIdx < reportSequence.length - 1) {
      setActiveReportId(reportSequence[currentIdx + 1]);
    } else if (direction === 'next' && currentIdx > 0) {
      setActiveReportId(reportSequence[currentIdx - 1]);
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
      setActiveReportId(reportId);
      setReportSequence([]);
      setSelectedDays(7);
    }
  }, [isOpen, reportId]);

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
          beachId: beach.id,
          date,
          persona: "BRO",
          days: selectedDays,
          category: selectedSport
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Failed to generate report");
      }

      const data = await response.json();
      setReport(data.report);
      window.dispatchEvent(new CustomEvent("credits-updated"));
      
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
          beachName: beach.name,
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
          beachName: beach.name,
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border-none shadow-2xl p-0 gap-0 overflow-hidden font-['Inter',_sans-serif]">
        <DialogTitle className="sr-only">AI Intelligence Report for {beach.name}</DialogTitle>
        {/* Simple Clean Header */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-white shadow-lg shadow-gray-200">
                <Waves className="w-6 h-6" />
             </div>
              <div>
                <h2 className="text-[20px] leading-[24px] font-bold text-black tracking-tight">{beach.name}</h2>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] leading-[15px] font-normal text-black opacity-40 uppercase tracking-widest">
                    {selectedDays === 7 ? 'Weekly' : selectedDays + '-Day'} Strategic Analysis
                  </p>
                  {reportSequence.length > 1 && (
                    <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-gray-200">
                      <button 
                        onClick={() => handleNavigate('prev')}
                        disabled={reportSequence.indexOf(activeReportId || reportSequence[0]) >= reportSequence.length - 1}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-20 transition-colors"
                        title="Older Report"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 text-black" />
                      </button>
                      <span className="text-[9px] font-black tabular-nums tracking-widest opacity-60">
                        {reportSequence.indexOf(activeReportId || reportSequence[0]) + 1} / {reportSequence.length}
                      </span>
                      <button 
                        onClick={() => handleNavigate('next')}
                        disabled={reportSequence.indexOf(activeReportId || reportSequence[0]) <= 0}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-20 transition-colors"
                        title="Newer Report"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-black" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
          </div>
          <div className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
             <Zap className="w-3.5 h-3.5 text-blue-400 fill-current" />
             {isCreditsLoading ? (
               <div className="w-8 h-4 bg-gray-200 animate-pulse rounded" />
             ) : (
                <span className="text-[12px] font-bold text-black">{credits ?? 0} <span className="opacity-40 font-normal">Credits</span></span>
             )}
          </div>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto">
          {isLoadingArchive ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-brand-3/20 border-t-brand-3 rounded-full animate-spin" />
                <Sparkles className="w-4 h-4 text-brand-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Syncing Intelligence Archives...</p>
            </div>
          ) : !report ? (
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[16px] leading-[22px] font-bold text-black mb-1">Expert AI Guidance</h3>
                  <p className="text-[14px] leading-[20px] font-normal text-black opacity-60">
                    Get a complete outlook synthesized from raw forecast data. We'll identify the best windows for your specific break and give you gear advice for the time ahead.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Specialization</label>
                  <div className="flex gap-2">
                    {[
                      { label: "Surfing", value: "SURFING", icon: Waves },
                      { label: "Foiling", value: "FOILING", icon: Sparkles },
                      { label: "Kiting", value: "KITESURFING", icon: Zap }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedSport(opt.value)}
                        className={cn(
                          "flex-1 py-3 px-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all flex flex-col items-center gap-1.5",
                          selectedSport === opt.value
                            ? "bg-black border-black text-white shadow-lg scale-[1.02]"
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
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Select Duration</label>
                  <div className="flex gap-2">
                    {[
                      { label: "1 Day", value: 1, credits: 1 },
                      { label: "3 Days", value: 3, credits: 4 },
                      { label: "1 Week", value: 7, credits: 4 }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSelectedDays(opt.value)}
                        className={cn(
                          "flex-1 py-3 px-4 rounded-full border text-[11px] font-bold uppercase tracking-widest transition-all relative overflow-visible",
                          selectedDays === opt.value
                            ? "bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-100 scale-[1.05]"
                            : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                        )}
                      >
                        {opt.label}
                        <span className={cn(
                          "absolute -top-2 -right-1 px-1.5 py-0.5 rounded-md text-[7px] font-medium tracking-tight border shadow-sm transition-all bg-white border-gray-100 text-black"
                        )}>
                          {opt.credits} credit{opt.credits > 1 ? 's' : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/30">
                    <p className="text-[10px] leading-[15px] font-normal text-black opacity-20 uppercase tracking-widest mb-1">Forecast Period</p>
                    <p className="text-[16px] font-bold text-black">{selectedDays} Day{selectedDays > 1 ? 's' : ''} Ahead</p>
                  </div>
                  <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/30">
                    <p className="text-[10px] leading-[15px] font-normal text-black opacity-20 uppercase tracking-widest mb-1">Intelligence Cost</p>
                    <p className="text-[16px] font-bold text-black">{creditCost} Credit{creditCost > 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>

              {credits < creditCost && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
                  <div className="flex items-center gap-3">
                     <ShieldAlert className="w-4 h-4 text-amber-600" />
                     <h4 className="text-[12px] font-black text-black uppercase tracking-widest">Balance Required</h4>
                  </div>
                  <p className="text-[14px] leading-[20px] font-normal text-black opacity-60">
                    Your account balance is currently {isCreditsLoading ? "..." : credits}. Credits never expire and roll over month to month. Top up your balance or invite friends to generate this report.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      asChild
                      variant="outline"
                      className="flex-1 rounded-xl h-10 text-[10px] font-bold uppercase tracking-widest border-gray-200"
                    >
                      <Link href="/pricing">Top Up Balance</Link>
                    </Button>
                    <Button 
                      asChild
                      variant="outline"
                      className="flex-1 rounded-xl h-10 text-[10px] font-bold uppercase tracking-widest border-gray-200 gap-2"
                    >
                      <Link href="/pricing#affiliate">
                        <Users className="w-3.5 h-3.5" /> Invite Friends
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {!isReportCurrent && (
                <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[12px] font-black text-amber-900 uppercase tracking-widest leading-none mb-1">Stale Intelligence</h4>
                      <p className="text-[11px] font-medium text-amber-700">
                        This signal was logged on {(() => {
                          try {
                            if (!existingReportDate || isNaN(new Date(existingReportDate).getTime())) return "Unknown Date";
                            return format(new Date(existingReportDate), "MMM d, HH:mm");
                          } catch (e) {
                            return "Unknown Date";
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                      onClose();
                      router.push(`/aireport?beachId=${beach.id}`);
                    }}
                    className="h-10 px-6 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest gap-2 shadow-sm min-w-[160px]"
                  >
                    <Sparkles className="w-3 h-3" />
                    Generate Fresh Intel
                  </Button>
                </div>
              )}
              <div className="relative group/report">
                <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100/50 text-[16px] leading-[26px] font-normal text-black opacity-80 whitespace-pre-wrap shadow-inner">
                  {report}
                </div>
                <Button
                  onClick={handleCopyReport}
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 h-10 w-10 bg-white border border-gray-100 shadow-sm rounded-lg opacity-0 group-hover/report:opacity-100 transition-all hover:bg-gray-50"
                  title="Copy Report"
                >
                  {isCopied ? <Check className="w-4 h-4 text-brand-3" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </Button>
              </div>
              
              {/* Simple Sharing Section */}
              <div className="mt-10 space-y-6">
                <div className="flex items-center gap-3">
                  <Share2 className="w-4 h-4 text-black opacity-40" />
                  <h4 className="text-[12px] font-black uppercase tracking-widest text-black">Share with your crew</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col justify-between gap-3">
                    <p className="text-[10px] font-bold text-black opacity-20 uppercase tracking-widest">Email Intelligence Report</p>
                    <div className="flex gap-2">
                      <Input 
                        value={targetEmail}
                        onChange={(e) => setTargetEmail(e.target.value)}
                        placeholder="recipient@email.com"
                        className="h-10 text-[14px] rounded-lg border-gray-100 bg-gray-50"
                      />
                      <Button 
                        onClick={shareViaEmail}
                        disabled={isSharingEmail}
                        size="icon"
                        className="h-10 w-10 shrink-0 bg-black hover:bg-gray-800 rounded-lg shadow-sm transition-all text-white"
                      >
                        {isSharingEmail ? <Loader2 className="w-4 h-4 animate-spin font-bold text-white" /> : <Send className="w-4 h-4 text-white" />}
                      </Button>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col justify-between gap-3">
                    <p className="text-[10px] font-bold text-black opacity-20 uppercase tracking-widest">WhatsApp Direct Share</p>
                    <div className="flex gap-2">
                       <Input 
                        value={targetWhatsApp}
                        onChange={(e) => setTargetWhatsApp(e.target.value)}
                        placeholder="+27..."
                        className="h-10 text-[14px] rounded-lg border-gray-100 bg-gray-50"
                      />
                      <Button 
                        onClick={shareViaWhatsApp}
                        disabled={isSharingWhatsApp}
                        size="icon"
                        className="h-10 w-10 shrink-0 bg-black hover:bg-gray-800 rounded-lg shadow-sm transition-all text-white"
                      >
                        {isSharingWhatsApp ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <MessageSquare className="w-4 h-4 text-white" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-8 border-t border-gray-100 bg-gray-50/30 flex-col sm:flex-row sm:justify-between items-center gap-6">
          <p className="text-[10px] leading-[15px] font-normal text-black opacity-20 uppercase tracking-widest">
            AI System v2.1 • Generated Locally
          </p>
          <div className="flex gap-3 w-full sm:w-auto">
            {!report ? (
              <>
                <Button 
                  onClick={onClose}
                  variant="ghost"
                  className="hidden sm:inline-flex text-[10px] font-bold tracking-widest uppercase text-black opacity-40 hover:opacity-100"
                >
                  DISMISS
                </Button>
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || isCreditsLoading || credits < creditCost}
                  className="flex-1 sm:flex-none h-12 px-8 bg-black hover:bg-gray-800 text-white rounded-xl font-bold uppercase tracking-widest text-[12px] shadow-lg shadow-gray-200 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3 min-w-[200px]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      GENERATING...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      GENERATE REPORT
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button 
                onClick={onClose}
                className="w-full sm:w-auto h-12 px-12 bg-black hover:bg-gray-800 text-white rounded-xl font-bold uppercase tracking-widest text-[12px] shadow-lg shadow-gray-200 transition-all active:scale-95"
              >
                DONE
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
