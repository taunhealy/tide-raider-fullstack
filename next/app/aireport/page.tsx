"use client";

import { useState, useEffect } from "react";
import { Waves, Sparkles, Zap, ShieldAlert, Loader2, Share2, Mail, MessageSquare, Send, Copy, Check, Info } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { BeachSearchInput } from "@/app/components/ui/BeachSearchInput";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/input";
import { useSubscriptionStatus } from "@/app/hooks/useSubscriptionStatus";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import Link from "next/link";
import type { Beach } from "@/app/types/beaches";
import { useSearchTracking } from "@/app/hooks/useSearchTracking";
import RecentBeachSearch from "@/app/components/RecentBeachSearch";


export default function AIReportPage() {
  const { credits, isLoading: isCreditsLoading } = useSubscriptionStatus();
  const { data: session } = useBackendAuth();
  const searchParams = useSearchParams();
  const beachIdParam = searchParams.get("beachId");
  
  const [selectedBeach, setSelectedBeach] = useState<Beach | null>(null);
  const [selectedDays, setSelectedDays] = useState(7);
  const [selectedSport, setSelectedSport] = useState("SURFING");
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const { trackBeach } = useSearchTracking();
  
  // Handle pre-selected beach from URL
  useEffect(() => {
    if (beachIdParam && !selectedBeach) {
      const fetchBeach = async () => {
        try {
          const res = await fetch(`/api/backend/beaches/${beachIdParam}`);
          if (res.ok) {
            const data = await res.json();
            setSelectedBeach(data);
          }
        } catch (err) {
          console.error("Failed to fetch beach from URL", err);
        }
      };
      fetchBeach();
    }
  }, [beachIdParam, selectedBeach]);

  const handleBeachSelect = (beach: Beach | null) => {
    setSelectedBeach(beach);
    if (beach) {
      trackBeach(beach.id);
    }
  };

  
  // Sharing State
  const [targetEmail, setTargetEmail] = useState("");
  const [targetWhatsApp, setTargetWhatsApp] = useState("");
  const [isSharingEmail, setIsSharingEmail] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);

  const creditCost = selectedDays <= 1 ? 1 : 4;

  useEffect(() => {
    if (session?.user?.email) setTargetEmail(session.user.email);
    if (session?.user?.whatsappNumber) setTargetWhatsApp(session.user.whatsappNumber);
  }, [session]);

  const handleGenerate = async () => {
    if (!selectedBeach) {
      toast.error("Beach Required", { description: "Please select a break first." });
      return;
    }

    if (credits < creditCost) {
      toast.error("Insufficient Credits", {
        description: `You need at least ${creditCost} credit${creditCost > 1 ? 's' : ''} to generate this report.`
      });
      return;
    }

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
    setReport(null);
    try {
      const response = await fetch("/api/backend/intelligence/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beachId: selectedBeach.id,
          date: new Date().toISOString().split("T")[0],
          persona: "ADVANCED",
          days: selectedDays,
          category: selectedSport
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 402 || errorData.message?.includes("INSUFFICIENT_CREDITS")) {
           toast.error("Insufficient Credits", {
             description: "Your balance is too low to compile this tactical signal.",
             action: {
               label: "Top Up",
               onClick: () => window.location.href = "/pricing"
             }
           });
           throw new Error("INSUFFICIENT_CREDITS");
        }
        throw new Error(errorData.message || errorData.error || "Failed to generate report");
      }

      const data = await response.json();
      setReport(data.report);
      window.dispatchEvent(new CustomEvent("credits-updated"));
      
      toast.success("Intelligence Ready", {
        description: `Your ${selectedDays === 7 ? 'Weekly' : selectedDays + '-Day'} Strategic Report is compiled.`
      });
    } catch (err: any) {
      toast.error("Process Failed", {
        description: err.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyReport = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setIsCopied(true);
    toast.success("Intelligence Copied", { description: "Signal secured to clipboard." });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const shareViaEmail = async () => {
    if (!targetEmail || !report || !selectedBeach) return;
    setIsSharingEmail(true);
    try {
      const response = await fetch("/api/backend/intelligence/share-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          beachName: selectedBeach.name,
          reportText: report,
          dateRange: `${selectedDays} Days`
        }),
      });
      if (!response.ok) throw new Error("Send failure");
      toast.success("Intelligence Shared", { description: `Sent to ${targetEmail}` });
    } catch (err) {
      toast.error("Comms Failure");
    } finally {
      setIsSharingEmail(false);
    }
  };

  const shareViaWhatsApp = async () => {
    if (!report || !targetWhatsApp || !selectedBeach) return;
    setIsSharingWhatsApp(true);
    try {
      const response = await fetch("/api/backend/intelligence/share-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: targetWhatsApp,
          beachName: selectedBeach.name,
          reportText: report
        }),
      });
      if (!response.ok) throw new Error("Broadcast failure");
      toast.success("Intelligence Dispatched");
    } catch (err: any) {
      toast.error("Transmission Error");
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 font-primary" suppressHydrationWarning>
      <div className="container mx-auto px-4 max-w-6xl py-10 md:py-16">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Strategic Monitor</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              AI Report
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Instant AI-powered surf intelligence for your target breaks.
            </p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-md border border-white px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm min-w-[120px] justify-center h-12">
            <Sparkles className="w-4 h-4 text-blue-500 fill-blue-500/10" />
            <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
              {isCreditsLoading ? (
                <div className="w-6 h-4 bg-gray-100 animate-pulse rounded" />
              ) : (
                <span>{credits}</span>
              )}
              <span className="text-gray-400 font-normal">Credits</span>
            </div>
          </div>
        </div>

        {/* Main Interface Window */}
        <div className="max-w-3xl mx-auto bg-white/40 backdrop-blur-sm rounded-[2.5rem] border border-white/60 shadow-sm overflow-hidden">
          <div className="p-6 md:p-10 space-y-10">
            {/* Input Section */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Select Your Break</label>
                <BeachSearchInput 
                  selectedBeach={selectedBeach}
                  onBeachSelect={handleBeachSelect}
                  placeholder="Target beach name..."
                  className="w-full"
                  showSelectedBadge={true}
                />
                <RecentBeachSearch 
                  onBeachSelect={setSelectedBeach}
                  selectedBeachId={selectedBeach?.id}
                />
              </div>

            {/* Specialization Options */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Specialization</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Surfing", value: "SURFING", icon: Waves },
                  { label: "Foiling", value: "FOILING", icon: Sparkles },
                  { label: "Kiting", value: "KITESURFING", icon: Zap }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedSport(opt.value)}
                    className={cn(
                      "py-4 px-2 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all flex flex-col items-center gap-2",
                      selectedSport === opt.value
                        ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.02]"
                        : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <opt.icon className={cn("w-5 h-5", selectedSport === opt.value ? "text-white" : "text-slate-300")} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Options */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Forecast Window</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "1 Day", value: 1, credits: 1 },
                  { label: "3 Days", value: 3, credits: 4 },
                  { label: "1 Week", value: 7, credits: 4 }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSelectedDays(opt.value);
                      if (report) setReport(null);
                    }}
                    className={cn(
                      "py-4 px-4 rounded-full border text-[11px] font-black uppercase tracking-widest transition-all relative overflow-visible",
                      selectedDays === opt.value
                        ? "bg-indigo-600 border-indigo-300 text-white shadow-xl shadow-indigo-100 scale-[1.05]"
                        : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {opt.label}
                    <span className={cn(
                      "absolute -top-2 -right-1 px-1.5 py-0.5 rounded-md text-[8px] font-medium tracking-tight border shadow-sm transition-all bg-white border-slate-100 text-black"
                    )}>
                      {opt.credits} credit{opt.credits > 1 ? 's' : ''}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button Area */}
            <div className="pt-4 flex flex-col items-center gap-4">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedBeach}
                className="min-w-[300px] px-12 h-16 bg-black hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[13px] shadow-xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-3"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    GENERATING SIGNAL...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    GENERATE {selectedDays === 7 ? 'WEEKLY' : `${selectedDays} DAY`} REPORT
                  </>
                )}
              </Button>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                Costs {creditCost} Credit{creditCost > 1 ? 's' : ''} • Powered by Gemini AI
              </p>
            </div>

            {/* Report Display Section */}
            {report && (
              <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="h-px bg-slate-100 w-full" />
                
                <div className="relative group/report">
                  <div className="p-8 md:p-10 rounded-[2rem] bg-slate-50 border border-slate-100 text-base leading-relaxed text-slate-700 whitespace-pre-wrap shadow-inner font-medium">
                    <div className="mb-6 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white">
                          <Waves className="w-4 h-4" />
                       </div>
                       <h3 className="font-black uppercase tracking-widest text-slate-900 text-sm">
                         Tactical Intel: {selectedBeach?.name} [{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(Date.now() + (selectedDays - 1) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}]
                       </h3>
                    </div>
                    {report}
                  </div>
                  <Button
                    onClick={handleCopyReport}
                    variant="ghost"
                    size="icon"
                    className="absolute top-6 right-6 h-10 w-10 bg-white border border-slate-200 shadow-sm rounded-xl hover:bg-slate-50 transition-all"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                  </Button>
                </div>

                {/* Sharing Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Share2 className="w-4 h-4 text-slate-400" />
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Dispatch Report</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm space-y-3">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Email Signal</p>
                      <div className="flex gap-2">
                        <Input 
                          value={targetEmail}
                          onChange={(e) => setTargetEmail(e.target.value)}
                          placeholder="Email address..."
                          className="h-11 bg-slate-50 border-slate-100 focus:border-slate-200"
                        />
                        <Button 
                          onClick={shareViaEmail}
                          disabled={isSharingEmail}
                          size="icon"
                          className="h-11 w-11 shrink-0 bg-black hover:bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-100"
                        >
                          {isSharingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm space-y-3">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">WhatsApp Relay</p>
                      <div className="flex gap-2">
                        <Input 
                          value={targetWhatsApp}
                          onChange={(e) => setTargetWhatsApp(e.target.value)}
                          placeholder="+27..."
                          className="h-11 bg-slate-50 border-slate-100 focus:border-slate-200"
                        />
                        <Button 
                          onClick={shareViaWhatsApp}
                          disabled={isSharingWhatsApp}
                          size="icon"
                          className="h-11 w-11 shrink-0 bg-black hover:bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-100"
                        >
                          {isSharingWhatsApp ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Footer */}
        <div className="flex items-center justify-center gap-8 py-4 opacity-40">
           <div className="flex items-center gap-2">
              <Info className="w-3 h-3" />
              <span className="text-[9px] font-black uppercase tracking-widest">v2.4 Core Intelligence</span>
           </div>
           <Link href="/raid" className="text-[9px] font-black uppercase tracking-widest hover:text-black transition-colors underline decoration-slate-300 underline-offset-4">
             Back to Command Center
           </Link>
        </div>
      </div>
    </div>
  );
}
