"use client";

import { Button } from "../components/ui/Button";
import { useHandleSubscribe } from "../hooks/useHandleSubscribe";
import { Check, Sparkles, Zap, Loader2, CreditCard, Star, ArrowRight, ShieldCheck, Waves, Users, Plus, Mail, Send, MessageSquare } from "lucide-react";
import { cn } from "@/app/lib/utils";
import Image from "next/image";
import { client } from "@/app/lib/sanity";
import { pricingQuery } from "@/app/lib/queries";
import { useEffect, useState } from "react";
import { useSubscription } from "../context/SubscriptionContext";
import { toast } from "sonner";
import { useSubscriptionDetails } from "../hooks/useSubscriptionDetails";
import { SubscriptionStatus } from "@/app/types/subscription";
import Link from "next/link";
import { Input } from "../components/ui/input";
import { MEMBERSHIP_PERKS } from "../constants/perks";

export default function PricingPage() {
  const handleSubscribe = useHandleSubscribe();
  const { isSubscribed, session, isLoading: isAuthLoading } = useSubscription();
  const [data, setData] = useState<any>(null);
  const [loadingStates, setLoadingStates] = useState({
    subscribe: false,
    unsubscribe: false,
    sendingInvites: false,
  });
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const { data: subscriptionDetails, isLoading: isDetailsLoading } = useSubscriptionDetails();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if user is not authenticated and not loading
  useEffect(() => {
    if (!isAuthLoading && !session) {
      // Redirect to signin if they're definitely not logged in
      // This ensures we always have a user context for the referral link and subscription hooks
      const callbackUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/auth/signin?callbackUrl=${callbackUrl}`;
    }
  }, [session, isAuthLoading]);

  // Invite State
  const [emails, setEmails] = useState<string[]>([""]);

  useEffect(() => {
    const fetchData = async () => {
      const pricingData = await client.fetch(pricingQuery);
      setData(pricingData);
    };
    fetchData();
  }, []);

  // Handle PayPal Credit Capture on Return
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get("token");
    const status = urlParams.get("status");

    if (status === "success" && orderId) {
      const captureOrder = async () => {
        toast.promise(
          fetch("/api/paypal/capture-credit-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId }),
          }).then(async (res) => {
            if (!res.ok) throw new Error("Capture failed");
            return res.json();
          }),
          {
            loading: "Finalizing your credits...",
            success: (data) => {
              window.history.replaceState({}, '', window.location.pathname);
              // Dispatch events to trigger targeted UI refreshes without full reload
              window.dispatchEvent(new CustomEvent("credits-updated"));
              window.dispatchEvent(new CustomEvent("auth-refresh"));
              return "Credits Added! Your balance has been updated.";
            },
            error: "Payment Capture Failed. Please contact support.",
          }
        );
      };
      captureOrder();
    } else if (status === "cancel") {
      toast.error("Payment Cancelled", { description: "Your credit top-up was not completed." });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleSubscribeWithLoading = async () => {
    setLoadingStates((prev) => ({ ...prev, subscribe: true }));
    try {
      if (!subscriptionDetails?.hasTrialEnded && !subscriptionDetails?.hasActiveTrial) {
        const response = await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start-trial", promoCode }),
        });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Failed to start trial");
      }
      window.location.reload();
      return;
    }

    const response = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", promoCode }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || "Failed to initialize checkout");
    }

    const data = await response.json();
    if (data.url) window.location.href = data.url;
  } catch (error: any) {
    console.error("Subscription conversion failed:", error);
    toast.error("Process Error", { description: error.message || "Failed to initialize secure checkout." });
    } finally {
      setLoadingStates((prev) => ({ ...prev, subscribe: false }));
    }
  };

  const handleUnsubscribe = async () => {
    setLoadingStates((prev) => ({ ...prev, unsubscribe: true }));
    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", subscriptionId: subscriptionDetails?.id }),
      });
      if (!response.ok) throw new Error("Failed to cancel subscription");
      window.location.reload();
    } catch (error) {
      toast.error("Cancellation Error", { description: "Failed to update subscription status." });
    } finally {
      setLoadingStates((prev) => ({ ...prev, unsubscribe: false }));
    }
  };

  const handleTopUp = async () => {
    setIsToppingUp(true);
    try {
      const response = await fetch("/api/paypal/create-credit-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Failed order creation");
      }
      const data = await response.json();
      if (data.approvalUrl) window.location.href = data.approvalUrl;
    } catch (err: any) {
      toast.error("Payment Error", { description: err.message || "Could not initialize PayPal top-up." });
      setIsToppingUp(false);
    }
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const addEmailField = () => {
    setEmails([...emails, ""]);
  };

  const sendInvites = async () => {
    const validEmails = emails.filter(email => email.trim() !== "" && email.includes("@"));
    if (validEmails.length === 0) {
      toast.error("Input Required", { description: "Please enter at least one valid email address." });
      return;
    }

    setLoadingStates(prev => ({ ...prev, sendingInvites: true }));
    try {
      const referralLink = `${window.location.origin}/raid?ref=${subscriptionDetails?.referralCode}`;
      const response = await fetch("/api/user/invite-squad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: validEmails, referralLink }),
      });

      if (!response.ok) throw new Error("Invite failed");

      toast.success("SQUAD RECRUITED", { 
        description: `Invitations sent successfully to ${validEmails.length === 1 ? '1 friend' : validEmails.length + ' friends'}!`,
        icon: "📨"
      });
      setEmails([""]);
    } catch (error) {
      toast.error("Comms Failure", { description: "Failed to send email invites." });
    } finally {
      setLoadingStates(prev => ({ ...prev, sendingInvites: false }));
    }
  };

  const shareViaWhatsApp = () => {
    const link = `${window.location.origin}/raid?ref=${subscriptionDetails?.referralCode}`;
    navigator.clipboard.writeText(link);
    const text = `🌊 Join the raid on Tide Raider! Get real-time surf alerts and deep intelligence for the Western Cape. Use my link to join the squad: ${link}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    toast.success("LINK SECURED", { description: "Invite link copied & WhatsApp opened." });
  };

  const getButtonText = () => {
    if (loadingStates.subscribe) return "PROCESSING...";
    if (loadingStates.unsubscribe) return "CANCELING...";
    if (subscriptionDetails?.status === SubscriptionStatus.ACTIVE) return "CANCEL MEMBERSHIP";
    if (subscriptionDetails?.hasTrialEnded) return "RE-ACTIVATE NOW";
    if (subscriptionDetails?.hasActiveTrial) return "UPGRADE NOW";
    return "START FREE TRIAL";
  };

  return (
    <div className="bg-white min-h-screen pb-32 text-black font-['Inter',_sans-serif]">
      <div className="container px-4 md:pl-[81px] py-16 md:py-24 max-w-7xl">
        <div className="md:pl-[54px]">
          {/* Header Section */}
          <div className="mb-16 md:mb-20 border-b border-gray-100 pb-10">
            <h1 className="text-[32px] leading-[40px] font-bold tracking-tight text-black mb-4">
              Simple Pricing
            </h1>
            <p className="text-[16px] leading-[24px] font-normal text-black opacity-60">
              Get notifications when your ideal surf conditions hit.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Membership Card */}
            <div className="group relative bg-[#F8F9FA] rounded-3xl border border-gray-100 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-gray-100">
              <div className="p-8 border-b border-gray-100">
                <div className="flex justify-between items-start mb-6">
                   <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-white">
                      <Waves className="w-6 h-6" />
                   </div>
                   <div className="bg-white border border-gray-200 px-3 py-1 rounded-md text-[10px] leading-[15px] font-normal tracking-normal text-black">
                      Unlimited Alerts
                   </div>
                </div>
                <h2 className="text-[24px] leading-[32px] font-bold text-black mb-2">Full Membership</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-[40px] leading-[48px] font-black text-black">R45</span>
                  <span className="text-[10px] leading-[15px] font-normal text-black opacity-40 uppercase tracking-widest">/ Month</span>
                </div>
              </div>

              <div className="p-8 flex-grow bg-white">
                <ul className="space-y-6 mb-10">
                  {MEMBERSHIP_PERKS.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-4">
                      <div className={cn("p-1.5 rounded-lg bg-gray-50 border border-gray-100", feature.color)}>
                        <feature.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[16px] leading-[24px] font-normal text-black">
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto space-y-4">
                   {!isSubscribed && (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="ENTER PROMO CODE"
                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-[10px] font-normal text-black uppercase tracking-widest focus:outline-none focus:border-black transition-all placeholder:text-gray-300"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                      />
                    </div>
                  )}
                  <Button
                    onClick={isSubscribed ? handleUnsubscribe : handleSubscribeWithLoading}
                    disabled={loadingStates.subscribe || loadingStates.unsubscribe}
                    className="w-full h-14 bg-black hover:bg-gray-800 text-white rounded-xl font-bold uppercase tracking-widest text-[12px] shadow-sm transition-all active:scale-[0.98]"
                  >
                    {getButtonText()}
                  </Button>
                </div>
              </div>
            </div>

            {/* AI Top-Up Card */}
            <div className="relative bg-[#F8F9FA] rounded-3xl border border-gray-100 overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-gray-100">
              <div className="p-8 border-b border-gray-100">
                 <div className="flex justify-between items-start mb-6">
                   <div className="w-12 h-12 rounded-xl bg-blue-400 flex items-center justify-center text-white shadow-lg shadow-blue-50">
                      <Sparkles className="w-6 h-6" />
                   </div>
                   <div className="bg-white border border-gray-200 px-3 py-1 rounded-md text-[10px] leading-[15px] font-normal tracking-normal text-black">
                      Intelligence Top-Up
                   </div>
                </div>
                <h2 className="text-[24px] leading-[32px] font-bold text-black mb-2">AI Report Bundle</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-[40px] leading-[48px] font-black text-black">R100</span>
                  <span className="text-[10px] leading-[15px] font-normal text-black opacity-40 uppercase tracking-widest">/ One-Time</span>
                </div>
              </div>

              <div className="p-8 flex-grow bg-white">
                 <ul className="space-y-6 mb-10">
                  {[
                    { text: "100 AI Intelligence Credits", icon: Zap, color: "text-blue-400" },
                    { text: "Daily, Tactical or Weekly outlooks", icon: ArrowRight, color: "text-blue-400" },
                    { text: "Share reports with your crew via WhatsApp", icon: Check, color: "text-blue-400" },
                    { text: "Credits never expire & roll over month to month", icon: ShieldCheck, color: "text-blue-400" },
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-4">
                      <div className={cn("p-1.5 rounded-lg bg-gray-50 border border-gray-100", feature.color)}>
                        <feature.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[16px] leading-[24px] font-normal text-black">
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={handleTopUp}
                  disabled={isToppingUp}
                  className="w-full h-14 bg-black hover:bg-gray-800 text-white rounded-xl font-bold uppercase tracking-widest text-[12px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                >
                  {isToppingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  BUY 100 CREDITS
                </Button>
                <p className="mt-4 text-center text-[10px] leading-[15px] font-normal text-gray-400 uppercase tracking-widest">
                   No Subscription Required
                </p>
              </div>
            </div>
          </div>

          {/* Affiliate Section */}
          <div className="mt-24" id="affiliate">
             <div className="relative rounded-3xl bg-gray-50 p-10 md:p-16 overflow-hidden border border-gray-100">
                <div className="relative z-10 flex flex-col xl:flex-row items-center gap-16">
                  <div className="flex-1 space-y-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-gray-200 text-black text-[10px] leading-[15px] font-normal tracking-normal uppercase">
                       <Users className="w-3.5 h-3.5" /> Affiliate Program
                    </div>
                    <h2 className="text-[32px] md:text-[40px] leading-[40px] md:leading-[48px] font-bold text-black tracking-tight">
                      Invite Friends. <br/>
                      <span className="text-gray-400">Receive 30 Credits.</span>
                    </h2>
                    <p className="text-[16px] leading-[24px] font-normal text-black opacity-60 max-w-lg">
                      Help grow the community. For every friend who signs up using your link, we'll credit your account with 30 AI credits instantly.
                    </p>
                    
                    <div className="space-y-6">
                      {/* Invite Link Block */}
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 flex flex-col md:flex-row items-center gap-6 shadow-sm">
                        <div className="flex-1 w-full min-w-0">
                          <p className="text-[10px] leading-[15px] font-black text-black opacity-20 uppercase tracking-[0.25em] mb-2">YOUR INVITE LINK</p>
                          <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 h-12 flex items-center">
                             <code className="text-black text-[14px] font-mono truncate w-full opacity-60">
                                {mounted ? `${window.location.origin}/raid?ref=${subscriptionDetails?.referralCode || '...'}` : 'INITIALIZING...'}
                             </code>
                          </div>
                        </div>
                        <Button 
                          onClick={() => {
                            const link = `${window.location.origin}/raid?ref=${subscriptionDetails?.referralCode}`;
                            navigator.clipboard.writeText(link);
                            toast.success("LINK COPIED", { description: "Your custom invite link is ready to share." });
                          }}
                          className="w-full md:w-auto h-12 px-8 bg-black text-white hover:bg-gray-800 font-bold uppercase tracking-widest text-[10px] rounded-lg shadow-sm transition-all active:scale-[0.98]"
                        >
                          Copy Link
                        </Button>
                      </div>

                      {/* Email Invites Block */}
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                           <p className="text-[10px] leading-[15px] font-black text-black opacity-20 uppercase tracking-[0.25em]">QUICK INVITE VIA EMAIL</p>
                           <button 
                             onClick={addEmailField}
                             className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-widest"
                           >
                             <Plus className="w-3 h-3" /> Add Another
                           </button>
                        </div>
                        
                        <div className="space-y-3">
                          {emails.map((email, idx) => (
                            <div key={idx} className="flex gap-2">
                               <div className="relative flex-1">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                  <Input 
                                    value={email}
                                    onChange={(e) => handleEmailChange(idx, e.target.value)}
                                    placeholder="friend@email.com"
                                    className="h-11 pl-10 rounded-xl border-gray-100 bg-gray-50 text-[14px]"
                                  />
                               </div>
                            </div>
                          ))}
                        </div>

                         <div className="flex flex-col sm:flex-row gap-3 pt-4">
                          <Button 
                            onClick={sendInvites}
                            disabled={loadingStates.sendingInvites}
                            className="h-11 flex-1 bg-black hover:bg-gray-800 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] gap-2 shadow-sm transition-all active:scale-95"
                          >
                            {loadingStates.sendingInvites ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            SEND MAIL INVITES
                          </Button>
                          
                          <Button 
                            onClick={shareViaWhatsApp}
                            className="h-11 flex-1 bg-white border border-gray-200 text-black hover:bg-gray-50 rounded-xl font-black uppercase tracking-widest text-[10px] gap-3 shadow-sm transition-all active:scale-95"
                          >
                            <MessageSquare className="w-4 h-4 fill-current" />
                            SHARE VIA WHATSAPP
                          </Button>
                        </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 w-full xl:w-[320px]">
                     {[
                        { title: "COPY", text: "Get your unique invite link from this block.", icon: ArrowRight },
                        { title: "SHARE", text: "Send it to your local surf squad on WhatsApp.", icon: Zap },
                        { title: "REWARD", text: "Receive 30 AI credits automatically when they join.", icon: Sparkles }
                     ].map((step, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:translate-x-1">
                           <div className="flex items-center gap-4 mb-2">
                              <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center text-white font-bold text-[10px]">{idx + 1}</div>
                              <p className="text-[12px] leading-[15px] font-black text-black uppercase tracking-widest">{step.title}</p>
                           </div>
                           <p className="text-[14px] leading-[20px] font-normal text-black opacity-40">{step.text}</p>
                        </div>
                     ))}
                  </div>
                </div>
             </div>
          </div>

          <div className="mt-20 py-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8 opacity-40">
             <div className="flex items-center gap-6">
                <span className="text-[10px] font-black uppercase tracking-widest">Secured by PayPal</span>
                <span className="text-[10px] font-black uppercase tracking-widest">PayFast Protection</span>
             </div>
             <div className="flex items-center gap-6">
                <Link href="/terms" className="text-[10px] font-black uppercase tracking-widest hover:text-black transition-colors">Terms</Link>
                <Link href="/privacy" className="text-[10px] font-black uppercase tracking-widest hover:text-black transition-colors">Privacy</Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
