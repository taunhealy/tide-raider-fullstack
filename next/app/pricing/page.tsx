"use client";

import { Button } from "../components/ui/Button";
import { useHandleSubscribe } from "../hooks/useHandleSubscribe";
import { Check, Sparkles, Zap, Loader2, CreditCard, Star, ArrowRight, ShieldCheck, Waves, Users, Plus, Mail, Send, MessageSquare, Bell } from "lucide-react";
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
import { MEMBERSHIP_PERKS, FREE_PERKS } from "../constants/perks";
import PageHeader from "../components/ui/PageHeader";
import PageContainer from "../components/ui/PageContainer";
import BrandSectionBadge from "../components/ui/BrandSectionBadge";

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

  // No longer redirecting to login on page load so unauthenticated users can view plans

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
    if (!session) {
      const callbackUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/auth/signin?callbackUrl=${callbackUrl}`;
      return;
    }
    if (loadingStates.subscribe) return;

    setLoadingStates((prev) => ({ ...prev, subscribe: true }));
    try {
      // If user is eligible for trial
      if (!subscriptionDetails?.hasTrialEnded && !subscriptionDetails?.hasActiveTrial && subscriptionDetails?.status !== SubscriptionStatus.ACTIVE) {
        console.log("[Pricing] Starting free trial...");

        const response = await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "start-trial", promoCode }),
        });

        if (response.status === 401) {
          const errorData = await response.json().catch(() => ({}));
          const redirectTo = errorData.redirectTo || "/auth/signin?callbackUrl=/pricing";
          window.location.href = redirectTo;
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || "Failed to start trial");
        }

        const data = await response.json();
        console.log("[Pricing] Trial started successfully:", data);

        toast.success("Welcome to Premium!", {
          description: "Your 20-day free trial has been activated."
        });

        // Trigger global refreshes
        window.dispatchEvent(new Event("auth-refresh"));
        window.dispatchEvent(new Event("subscription-refresh"));

        // Short delay to let state propagate before reload/redirect
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
        return;
      }

      // If not eligible for trial, proceed to PayPal/Checkout
      console.log("[Pricing] Trial not available, proceeding to checkout...");
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
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error("Subscription conversion failed:", error);
      toast.error("Process Error", {
        description: error.message || "Failed to initialize secure checkout."
      });
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
    if (!session) {
      const callbackUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/auth/signin?callbackUrl=${callbackUrl}`;
      return;
    }
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
    <div className="min-h-screen bg-gray-50/50 pb-32">
      <PageContainer>
        <PageHeader
          title="Membership Plans"
          description="Unlock automated notifications and premium surf intelligence. Start with a 20-day free trial."
          badge="Condition Monitor"
          icon={<Bell className="w-4 h-4 text-white" />}
        />

        <div className="bg-white/40 backdrop-blur-sm rounded-[2.5rem] p-4 md:p-10 border border-white/60 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Free Plan Card */}
            <div className="group relative bg-white/60 backdrop-blur-md rounded-3xl border border-white/80 p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 shadow-sm">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/50 flex items-center justify-center text-slate-500 shadow-sm">
                    <Star className="w-6 h-6" />
                  </div>
                  <div className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-md text-[10px] leading-[15px] font-black uppercase tracking-widest text-slate-600">
                    Standard Access
                  </div>
                </div>
                <h2 className="text-[24px] leading-[32px] font-black text-slate-600 mb-2">Free Plan</h2>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-[40px] leading-[48px] font-black text-slate-600">R0</span>
                  <span className="text-[10px] leading-[15px] font-bold text-gray-400 uppercase tracking-widest">/ Always</span>
                </div>

                <ul className="space-y-5 mb-10">
                  {FREE_PERKS.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-4">
                      <div className="p-1.5 rounded-lg bg-gray-50 border border-gray-100 text-slate-400">
                        <feature.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[15px] leading-[22px] font-semibold text-gray-600">
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={() => {
                  if (!session) {
                    const callbackUrl = encodeURIComponent(window.location.pathname);
                    window.location.href = `/auth/signin?callbackUrl=${callbackUrl}`;
                  }
                }}
                disabled={session ? true : false}
                variant={session ? "outline" : "action"}
                size="xl"
                className={cn(
                  "w-full uppercase tracking-widest",
                  session 
                    ? "text-slate-400 border-slate-200 hover:bg-white" 
                    : "shadow-sm"
                )}
              >
                {!session ? "JOIN FOR FREE" : isSubscribed ? "FREE PLAN" : "CURRENT PLAN"}
              </Button>
            </div>

            {/* Membership Card */}
            <div className="group relative bg-gradient-to-b from-blue-50/50 to-white/70 backdrop-blur-md rounded-3xl border-2 border-brand-blue-primary/30 p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 shadow-md scale-100 lg:scale-[1.02] z-10">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl brand-icon-wrapper">
                    <Waves className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="bg-brand-blue-light/10 border border-brand-blue-light/30 px-3 py-1 rounded-md text-[10px] leading-[15px] font-black uppercase tracking-widest text-slate-600">
                      Unlimited Alerts
                    </div>
                    <div className="bg-amber-100 border border-amber-200 px-3 py-1 rounded-md text-[10px] leading-[15px] font-black tracking-widest text-amber-700 uppercase">
                      20-DAY FREE TRIAL
                    </div>
                  </div>
                </div>
                <h2 className="text-[24px] leading-[32px] font-black text-gray-900 mb-2">Full Membership</h2>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-[40px] leading-[48px] font-black text-gray-900">R45</span>
                  <span className="text-[10px] leading-[15px] font-bold text-gray-400 uppercase tracking-widest">/ Month</span>
                </div>

                <ul className="space-y-5 mb-10">
                  {MEMBERSHIP_PERKS.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-4">
                      <div className="p-1.5 rounded-lg bg-brand-blue-light/10 border border-brand-blue-light/20 text-brand-blue-primary">
                        <feature.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[15px] leading-[22px] font-semibold text-gray-700">
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                {!isSubscribed && (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ENTER PROMO CODE"
                      className="w-full h-12 bg-white border border-slate-900/30 focus:border-slate-900 rounded-xl px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest focus:outline-none transition-all placeholder:text-gray-400"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                  </div>
                )}
                <Button
                  onClick={isSubscribed ? handleUnsubscribe : handleSubscribeWithLoading}
                  disabled={loadingStates.subscribe || loadingStates.unsubscribe}
                  variant="action"
                  size="xl"
                  className="w-full shadow-sm"
                >
                  {getButtonText()}
                </Button>
              </div>
            </div>

            {/* AI Top-Up Card */}
            <div className="group relative bg-white/60 backdrop-blur-md rounded-3xl border border-white/80 p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 shadow-sm">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl brand-icon-wrapper">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="bg-gray-100/50 bord er border-gray-200 px-3 py-1 rounded-md text-[10px] leading-[15px] font-black uppercase tracking-widest text-slate-600">
                    Intelligence Top-Up
                  </div>
                </div>
                <h2 className="text-[24px] leading-[32px] font-black text-gray-900 mb-2">Credits Booster Pack</h2>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-[40px] leading-[48px] font-black text-gray-900">R100</span>
                  <span className="text-[10px] leading-[15px] font-bold text-gray-400 uppercase tracking-widest">/ One-Time</span>
                </div>

                <ul className="space-y-5 mb-10">
                  {[
                    { text: "100 Credits", icon: Zap, color: "text-brand-blue-primary" },
                    { text: "Generate Daily, 3-days or Weekly AI reports", icon: ArrowRight, color: "text-brand-blue-primary" },
                    { text: "Share reports with your crew via WhatsApp", icon: Check, color: "text-brand-blue-primary" },
                    { text: "30 points bank balance grants access to view Raid Logs & AI reports", icon: Check, color: "text-brand-blue-primary" },
                    { text: "Credits never expire", icon: ShieldCheck, color: "text-brand-blue-primary" },
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-4">
                      <div className="p-1.5 rounded-lg bg-brand-blue-light/10 border border-brand-blue-light/20 text-brand-blue-primary">
                        <feature.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[15px] leading-[22px] font-semibold text-gray-600">
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <p className="text-center text-[10px] leading-[15px] font-normal text-gray-400 uppercase tracking-widest">
                  No Subscription Required
                </p>
                <Button
                  onClick={handleTopUp}
                  disabled={isToppingUp}
                  variant="action"
                  size="xl"
                  className="w-full flex items-center justify-center gap-2 shadow-sm"
                >
                  {isToppingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  BUY 100 CREDITS
                </Button>
              </div>
            </div>
          </div>

          {/* Points & Credits Economy Info */}
          <div className="mt-16 bg-gradient-to-br from-blue-50/40 to-brand-blue-light/10 rounded-[2.5rem] p-8 md:p-12 border border-brand-blue-muted/30 shadow-sm">
            <div className="flex flex-col gap-10">
              <div className="space-y-4 max-w-3xl">
                <BrandSectionBadge icon={<Sparkles className="w-3.5 h-3.5 animate-pulse" />}>
                  Points Economy
                </BrandSectionBadge>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                  Dual-Path Points System
                </h2>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  Accessing deep surf logs history, requesting timed AI forecasts, and setting custom alerts are powered by Tide Raider points. Build your balance entirely for free or buy instant packages.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4 transition-all hover:shadow-md">
                  <div className="w-8 h-8 rounded-lg bg-brand-blue-light/10 flex items-center justify-center shrink-0 text-brand-blue-primary border border-brand-blue-light/20">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[12px] font-black uppercase tracking-widest text-gray-900 mb-1">1. Community (Free)</h4>
                    <p className="text-xs text-gray-500 font-medium leading-normal">
                      Earn <span className="font-bold text-brand-blue-primary">+30 Points</span> for every surf session you log or for each friend who joins using your squad recruitment link below.
                    </p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4 transition-all hover:shadow-md">
                  <div className="w-8 h-8 rounded-lg bg-brand-blue-medium/10 flex items-center justify-center shrink-0 text-brand-blue-dark border border-brand-blue-medium/20">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[12px] font-black uppercase tracking-widest text-gray-900 mb-1">2. Buy Credits (Paid)</h4>
                    <p className="text-xs text-gray-500 font-medium leading-normal">
                      Refill instantly with our <span className="font-bold text-brand-blue-dark">Credits Booster Pack</span> (100 credits for R100) or subscribe to get monthly credit bundles.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Affiliate Section */}
          <div className="mt-24" id="affiliate">
            <div className="relative rounded-3xl bg-gray-50 p-6 md:p-10 overflow-hidden border border-gray-100 shadow-sm">
              <div className="relative z-10 flex flex-col xl:flex-row items-center gap-16">
                <div className="flex-1 space-y-8">
                  <BrandSectionBadge icon={<Users className="w-3.5 h-3.5" />}>
                    Affiliate Program
                  </BrandSectionBadge>
                  <h2 className="text-[32px] md:text-[40px] leading-[40px] md:leading-[48px] font-bold text-black tracking-tight">
                    Invite Friends. <br />
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
                        variant="outline"
                        size="sm"
                        className="w-full md:w-auto px-5 font-black uppercase tracking-widest text-[9px] rounded-lg active:scale-95 border-slate-200 text-slate-600 hover:bg-slate-50"
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
                          className="text-[10px] font-bold text-slate-600 hover:text-black flex items-center gap-1 uppercase tracking-widest"
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
                          variant="action"
                          className="h-11 flex-1 text-[10px] gap-2"
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
      </PageContainer>
    </div>
  );
}
