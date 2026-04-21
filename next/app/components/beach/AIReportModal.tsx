"use client";

import { useState, useEffect } from "react";
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
import { Sparkles, Zap, ShieldAlert, CreditCard, Loader2, Bookmark, Share2, Mail, MessageSquare, Send, Users, ArrowRight, Waves } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";

interface AIReportModalProps {
  beach: any;
  isOpen: boolean;
  onClose: () => void;
  date: string;
}

export default function AIReportModal({ beach, isOpen, onClose, date }: AIReportModalProps) {
  const { credits, isLoading: isCreditsLoading, isSubscribed } = useSubscriptionStatus();
  const { data: session, status: authStatus } = useBackendAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [isToppingUp, setIsToppingUp] = useState(false);
  
  // Sharing State
  const [targetEmail, setTargetEmail] = useState("");
  const [isSharingEmail, setIsSharingEmail] = useState(false);

  // Initialize email from session
  useEffect(() => {
    if (session?.user?.email) {
      setTargetEmail(session.user.email);
    }
  }, [session?.user?.email]);

  const handleGenerate = async () => {
    if (credits < 1) {
      toast.error("Insufficient Credits", {
        description: "You need at least 1 credit to generate a Weekly Strategic Report."
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/intelligence/weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beachId: beach.id,
          date,
          persona: "ADVANCED"
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate report");
      }

      const data = await response.json();
      setReport(data.report);
      window.dispatchEvent(new CustomEvent("credits-updated"));
      
      toast.success("Analysis Ready", {
        description: "Your Weekly Strategic Report has been compiled."
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
      const response = await fetch("/api/intelligence/share-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          beachName: beach.name,
          reportText: report
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

  const shareViaWhatsApp = () => {
    if (!report) return;
    const text = `🌊 *Surf Report: ${beach.name}* \n\n${report}\n\nJoin Tide Raider: ${window.location.origin}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
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
                <p className="text-[10px] leading-[15px] font-normal text-black opacity-40 uppercase tracking-widest">Weekly Strategic Analysis</p>
             </div>
          </div>
          <div className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
             <Zap className="w-3.5 h-3.5 text-blue-500 fill-current" />
             <span className="text-[12px] font-bold text-black">{credits} <span className="opacity-40 font-normal">Credits</span></span>
          </div>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto">
          {!report ? (
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[16px] leading-[22px] font-bold text-black mb-1">Expert AI Guidance</h3>
                  <p className="text-[14px] leading-[20px] font-normal text-black opacity-60">
                    Get a complete 7-day outlook synthesized from raw forecast data. We'll identify the best windows for your specific break and give you gear advice for the week ahead.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/30">
                  <p className="text-[10px] leading-[15px] font-normal text-black opacity-20 uppercase tracking-widest mb-1">Forecast Period</p>
                  <p className="text-[16px] font-bold text-black">7 Days Ahead</p>
                </div>
                <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/30">
                  <p className="text-[10px] leading-[15px] font-normal text-black opacity-20 uppercase tracking-widest mb-1">Intelligence Cost</p>
                  <p className="text-[16px] font-bold text-black">2 Credits (R2)</p>
                </div>
              </div>

              {credits < 2 && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4">
                  <div className="flex items-center gap-3">
                     <ShieldAlert className="w-4 h-4 text-amber-600" />
                     <h4 className="text-[12px] font-black text-black uppercase tracking-widest">Balance Required</h4>
                  </div>
                  <p className="text-[14px] leading-[20px] font-normal text-black opacity-60">
                    Your account balance is currently zero. Top up your credits or invite friends to generate this report.
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
              <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100/50 text-[16px] leading-[26px] font-normal text-black opacity-80 whitespace-pre-wrap shadow-inner">
                {report}
              </div>
              
              {/* Simple Sharing Section */}
              <div className="mt-10 space-y-6">
                <div className="flex items-center gap-3">
                  <Share2 className="w-4 h-4 text-black opacity-40" />
                  <h4 className="text-[12px] font-black uppercase tracking-widest text-black">Share with your crew</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-3">
                    <p className="text-[10px] font-bold text-black opacity-20 uppercase tracking-widest">Email Report</p>
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
                        className="h-10 w-10 shrink-0 bg-black hover:bg-gray-800 rounded-lg"
                      >
                        {isSharingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col justify-between">
                    <p className="text-[10px] font-bold text-black opacity-20 uppercase tracking-widest">WhatsApp Direct</p>
                    <Button 
                      onClick={shareViaWhatsApp}
                      variant="outline"
                      className="h-10 w-full rounded-lg border-gray-100 bg-gray-50 text-[10px] font-bold tracking-widest uppercase gap-2 hover:bg-gray-100"
                    >
                      <MessageSquare className="w-4 h-4" />
                      SUBMIT TO CHAT
                    </Button>
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
                  disabled={isGenerating || credits < 1}
                  className="flex-1 sm:flex-none h-12 px-8 bg-black hover:bg-gray-800 text-white rounded-xl font-bold uppercase tracking-widest text-[12px] shadow-lg shadow-gray-200 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
                  GENERATE REPORT
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
