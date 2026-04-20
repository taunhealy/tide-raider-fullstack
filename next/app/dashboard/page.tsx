"use client";

import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { useState, useEffect } from "react";
import { useSubscription } from "../context/SubscriptionContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { useHandleSubscribe } from "../hooks/useHandleSubscribe";
import { useHandleTrial } from "../hooks/useHandleTrial";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { urlForImage } from "@/app/lib/urlForImage";
import Image from "next/image";
import { client } from "@/app/lib/sanity";
import { groq } from "next-sanity";
import { useSubscriptionDetails } from "../hooks/useSubscriptionDetails";
import { formatDate } from "../lib/utils";
import { useSubscriptionManagement } from "../hooks/useSubscriptionManagement";
import { useRouter } from "next/navigation";
import { SubscriptionStatus } from "@/app/types/subscription";
import { ActiveSubscriptionView } from "@/app/components/subscription/ActiveSubscriptionView";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/app/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useBackendAuth();
  const { trialStatus, trialEndDate } = useSubscription();

  // Debug: Log session data to help troubleshoot user ID display
  useEffect(() => {
    if (session?.user) {
      console.log("[Dashboard] Session user data:", {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        fullSession: session,
      });
    }
  }, [session]);
  const [activeTab, setActiveTab] = useState<
    "account" | "billing" | "ads" | "alerts"
  >("account");
  const [username, setUsername] = useState<string>("");
  const queryClient = useQueryClient();
  const handleSubscribe = useHandleSubscribe();
  const { mutate: handleTrial, isPending: isTrialLoading } = useMutation({
    mutationFn: async () => {
      console.log("Starting trial...");
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start-trial" }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
          message: "Failed to start trial",
        }));
        console.error("[Dashboard] Start trial error:", error);
        throw new Error(
          error.message || error.error || "Failed to start trial"
        );
      }
      const data = await response.json();
      console.log("[Dashboard] Trial started successfully:", data);
      return data;
    },
    onSuccess: async () => {
      // Invalidate all relevant queries
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      await queryClient.invalidateQueries({
        queryKey: ["subscriptionDetails"],
      });

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      await queryClient.invalidateQueries({
        queryKey: ["subscriptionDetails"],
      });

      // Refresh the page to ensure all components update
      router.refresh();

      toast.success("Trial started successfully!");
    },
    onError: (error) => {
      console.error("Trial mutation error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to start trial"
      );
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: subscriptionDetails, isLoading: isLoadingDetails } =
    useSubscriptionDetails();
  const subscriptionData = subscriptionDetails;
  const { mutate } = useSubscriptionManagement();
  const { refetch: refetchAuth } = useBackendAuth();

  // Add loading states
  const [loadingStates, setLoadingStates] = useState({
    trial: false,
    subscribe: false,
    unsubscribe: false,
    pause: false,
  });

  // Add query to fetch user data from database
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ["user", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const response = await fetch(`/api/user/${session.user.id}`);
      if (!response.ok) throw new Error("Failed to fetch user data");
      return response.json();
    },
    enabled: !!session?.user?.id,
  });

  // Update useEffect to use database username
  useEffect(() => {
    if (userData?.name) {
      setUsername(userData.name);
    }
  }, [userData?.name]);

  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      return client.fetch(groq`*[_type == "dashboard"][0] {
        heroImage {
          image { ..., asset-> },
          alt
        }
      }`);
    },
  });

  // Add this useEffect to refresh data when subscription changes
  useEffect(() => {
    const refreshData = async () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["subscriptionDetails"] });
      queryClient.invalidateQueries({ queryKey: ["user", session?.user?.id] });
      router.refresh(); // Refresh the page
    };

    // Set up event listener for subscription changes
    const channel = new BroadcastChannel("subscription-update");
    channel.onmessage = refreshData;

    return () => channel.close();
  }, [queryClient, router, session?.user?.id]);

  const handleUsernameUpdate = async () => {
    if (!username.trim()) {
      setError("Username cannot be empty");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/update-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: username }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update username");
      }

      const data = await response.json();
      setUsername(data.name);
      toast.success("Username updated successfully!");

      // Invalidate user queries
      await queryClient.invalidateQueries({
        queryKey: ["user", session?.user?.id],
      });

      // Refresh auth state to update session with new name
      await refetchAuth();
      window.dispatchEvent(new Event("auth-refresh"));

      // Refresh the page data
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the handleSubscribe to use loading state
  const handleSubscribeWithLoading = async () => {
    setLoadingStates((prev) => ({ ...prev, subscribe: true }));
    try {
      // Dashboard is already a protected route, so user must be logged in
      // Go directly to checkout
      router.push("/checkout");
    } catch (error) {
      console.error("Subscribe error:", error);
      toast.error("Failed to start subscription. Please try again.");
    } finally {
      setLoadingStates((prev) => ({ ...prev, subscribe: false }));
    }
  };

  const handleSubscriptionAction = async (
    action: "cancel" | "suspend" | "activate"
  ) => {
    setLoadingStates((prev) => ({
      ...prev,
      [action === "cancel" ? "unsubscribe" : "pause"]: true,
    }));
    try {
      if (action === "cancel") {
        const response = await fetch("/api/paypal/cancel", {
          method: "POST",
          credentials: "include",
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            error.error || error.message || "Failed to cancel subscription"
          );
        }
        const data = await response.json();
        const message =
          data.message ||
          (subscriptionData?.status === SubscriptionStatus.TRIAL ||
          subscriptionData?.hasActiveTrial
            ? "Trial ended successfully"
            : "Subscription cancelled successfully");
        toast.success(message);
      } else if (action === "suspend") {
        const response = await fetch("/api/paypal/suspend", {
          method: "POST",
          credentials: "include",
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to suspend subscription");
        }
        toast.success("Subscription suspended successfully");
      }

      // Refresh subscription data
      await queryClient.invalidateQueries({
        queryKey: ["subscriptionDetails"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["user", session?.user?.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["subscriptionStatus", session?.user?.id],
      });

      // Trigger subscription refresh for all components
      window.dispatchEvent(new Event("auth-refresh"));
      window.dispatchEvent(new Event("subscription-refresh"));
      router.refresh();
    } catch (error) {
      console.error("Subscription action failed:", error);
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [action === "cancel" ? "unsubscribe" : "pause"]: false,
      }));
    }
  };

  const handleSyncSubscription = async () => {
    setLoadingStates((prev) => ({ ...prev, subscribe: true }));
    try {
      console.log("[Dashboard] Syncing subscription...");
      const response = await fetch("/api/paypal/sync", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      // Check if the response indicates a trial user or no PayPal subscription
      // These are successful responses, not errors
      if (
        data.message &&
        (data.message.includes("trial") ||
          data.message.includes("No PayPal subscription"))
      ) {
        console.log("[Dashboard] Sync response (trial/no subscription):", data);
        toast.info(data.message || "No active PayPal subscription to sync");

        // Refresh subscription data even if no sync was needed
        await queryClient.invalidateQueries({
          queryKey: ["subscriptionDetails"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["subscriptionStatus", session?.user?.id],
        });
        await queryClient.invalidateQueries({
          queryKey: ["user", session?.user?.id],
        });

        router.refresh();
        return;
      }

      // Handle "No PayPal subscription found" response - this is also NOT an error
      if (
        response.status === 400 &&
        data.error === "No PayPal subscription found"
      ) {
        console.log("[Dashboard] No PayPal subscription to sync");
        toast.info(data.message || "No PayPal subscription found to sync");
        return;
      }

      // Handle PayPal configuration errors gracefully
      if (
        response.status === 500 &&
        data.error?.includes("PayPal configuration missing")
      ) {
        console.log(
          "[Dashboard] PayPal not configured (expected for trial users)"
        );
        toast.info("You are on a free trial. No PayPal subscription to sync.");
        return;
      }

      // Handle cases where user has no active subscription
      if (
        response.status === 200 &&
        data.message &&
        (data.message.includes("free trial") ||
          data.message.includes("don't have an active subscription"))
      ) {
        console.log("[Dashboard] No subscription to sync:", data.message);
        toast.info(data.message || "No active subscription to sync.");
        return;
      }

      // NOW handle actual errors (network issues, API failures, etc.)
      if (!response.ok) {
        const error =
          data.error || data.details || "Failed to sync subscription";
        console.error("[Dashboard] Sync API error:", {
          status: response.status,
          error,
          data,
        });
        throw new Error(error);
      }

      console.log("[Dashboard] Sync response:", data);
      toast.success(data.message || "Subscription synced successfully");

      // Force refresh auth state by calling refetch directly
      await refetchAuth();

      // Also trigger auth refresh event for all components
      window.dispatchEvent(new Event("auth-refresh"));

      // Refresh subscription data
      await queryClient.invalidateQueries({
        queryKey: ["subscriptionDetails"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["subscriptionStatus", session?.user?.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["user", session?.user?.id],
      });

      // Small delay to ensure state updates
      await new Promise((resolve) => setTimeout(resolve, 500));

      router.refresh();
    } catch (error) {
      // Only log and show errors for ACTUAL failures
      console.error("[Dashboard] Sync failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to sync subscription"
      );
    } finally {
      setLoadingStates((prev) => ({ ...prev, subscribe: false }));
    }
  };

  // Create a conditional handler function
  const handleButtonClick = () => {
    if (!subscriptionData?.hasTrialEnded && !subscriptionData?.hasActiveTrial) {
      // Start free trial
      handleTrial();
    } else {
      // Subscribe via PayPal
      handleSubscribeWithLoading();
    }
  };

  const renderSubscriptionState = () => {
    if (subscriptionData?.status === SubscriptionStatus.ACTIVE) {
      return <ActiveSubscriptionView />;
    }

    // Check trial status - check both status and hasActiveTrial flag
    if (
      subscriptionData?.status === SubscriptionStatus.TRIAL ||
      subscriptionData?.hasActiveTrial
    ) {
      return (
        <div className="mb-4">
          <p className="font-primary">
            Your free trial is active 🐟🐟🐟
            <span className="block mt-2 text-sm text-gray-600">
              Trial ends on:{" "}
              {subscriptionData.trialEndDate
                ? formatDate(subscriptionData.trialEndDate.toString())
                : "N/A"}
            </span>
          </p>
        </div>
      );
    }

    // Trial available (not started and not ended)
    if (!subscriptionData?.hasTrialEnded && !subscriptionData?.hasActiveTrial) {
      return (
        <div className="mb-4">
          <p className="font-primary">Ready to unlock premium features?</p>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button
              variant="default"
              className="w-full sm:w-auto font-primary bg-[var(--color-tertiary)] text-white hover:bg-[var(--color-tertiary)]/90"
              onClick={handleSubscribeWithLoading}
              disabled={loadingStates.subscribe}
            >
              {loadingStates.subscribe ? "Processing..." : "Subscribe Now"}
            </Button>
          </div>
        </div>
      );
    }

    // Trial ended or subscription inactive
    return (
      <div className="mb-4">
        {subscriptionData?.hasTrialEnded ? (
          <div className="p-4 bg-amber-100 rounded-lg border border-amber-200 mb-4">
            <p className="text-amber-800 font-medium">
              ⚠️ Your free trial has expired. Upgrade to continue full access.
            </p>
          </div>
        ) : (
          <p className="font-primary text-black">No active subscription</p>
        )}
        <Button
          variant="outline"
          className="w-full sm:w-auto font-primary mt-4"
          onClick={handleSubscribeWithLoading}
          disabled={loadingStates.subscribe}
        >
          {loadingStates.subscribe ? "Processing..." : "Subscribe Now"}
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-primary selection:bg-[var(--color-tertiary)]/20 overflow-x-hidden">
      {/* Subtle Background Glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-tertiary)]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">
        {/* Left Column: Operation Controls */}
        <div className="flex-1 p-4 sm:p-8 lg:p-12 space-y-10 max-w-5xl">
          <header>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-[var(--color-tertiary)] shadow-[0_0_8px_var(--color-tertiary)] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-tertiary)]">System Live</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500">Center</span>
            </h1>
            <p className="text-slate-500 mt-3 max-w-md font-medium text-lg italic">Manage your surf intelligence, billing, and system settings.</p>
          </header>

          {/* Navigation Matrix */}
          <nav className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-2xl w-fit shadow-sm">
            {[
              { id: "account", label: "Identity" },
              { id: "billing", label: "Subscriptions" },
              { id: "alerts", label: "Alerts" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 relative
                  ${activeTab === tab.id 
                    ? "text-brand-3 bg-brand-3/5" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-3 shadow-[0_0_10px_rgba(59,130,246,0.2)]" />
                )}
              </button>
            ))}
          </nav>

          <main className="min-h-[500px]">
            {activeTab === "account" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-10 space-y-8 shadow-sm">
                  <div className="grid gap-8">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Operator Handle</label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-brand-3 focus:ring-1 focus:ring-brand-3/30 transition-all text-slate-900 font-bold"
                          placeholder="Assign handle..."
                        />
                        <button
                          onClick={handleUsernameUpdate}
                          className="px-10 bg-slate-900 text-white font-black uppercase tracking-tighter rounded-2xl hover:bg-slate-800 transition-all active:scale-95 py-4 shadow-lg shadow-slate-900/10"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Secure UID</label>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-400 font-mono text-xs flex items-center justify-between">
                        {session?.user?.id || "UNASSIGNED"}
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-900">
                <div className="bg-white border border-slate-200 rounded-[32px] p-2 shadow-sm">
                  <div className="bg-white rounded-[26px] p-6 sm:p-10 border border-slate-100">
                    <div className="flex flex-col sm:flex-row justify-between gap-8 mb-10">
                      <div className="space-y-2">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border
                          ${subscriptionData?.status === SubscriptionStatus.ACTIVE 
                            ? "bg-green-500/10 text-green-600 border-green-500/20" 
                            : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                          ● {subscriptionData?.status === SubscriptionStatus.ACTIVE ? "Active" : "Standard Plan"}
                        </span>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                          {subscriptionData?.status === SubscriptionStatus.ACTIVE ? "Premium Member" : "Free Member"}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium font-primary">
                          {subscriptionData?.status === SubscriptionStatus.ACTIVE 
                            ? "You've got full access to all our surf tools." 
                            : "You're on our basic free plan."}
                        </p>
                      </div>
                      
                      <div className="text-left sm:text-right font-primary">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Price</p>
                        <p className="text-2xl font-black text-slate-900 tabular-nums">
                          {subscriptionData?.status === SubscriptionStatus.ACTIVE ? "R45" : "R0"}
                          <span className="text-xs text-slate-500 ml-1">/ month</span>
                        </p>
                        {subscriptionData?.next_billing_time && (
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                            Next payment: {formatDate(subscriptionData.next_billing_time)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Features in Plain English */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 border-t border-slate-100 pt-8 font-primary">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-3">Membership Perks</h4>
                        <ul className="space-y-3">
                          {[
                            "Surf alerts via WhatsApp & Email",
                            "Access to local 'Hidden Gems'",
                            "Detailed weather & swell data",
                            "Custom alerts for your favorite spots"
                          ].map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                subscriptionData?.status === SubscriptionStatus.ACTIVE ? "bg-green-500" : "bg-slate-300"
                              )} />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-3">About your plan</h4>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <p className="text-xs text-slate-500 leading-relaxed font-primary">
                            {subscriptionData?.status === SubscriptionStatus.ACTIVE 
                              ? "Your Premium membership is active. You can use all our surf forecasting tools and set as many alerts as you like."
                              : "You're currently using our standard free plan. Upgrade to Premium if you want to get automated alerts and see our curated list of hidden surf spots."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-1.5 bg-slate-50 rounded-2xl border border-slate-100 mb-8 font-primary">
                      <button onClick={handleSyncSubscription} className="flex items-center justify-center gap-2 py-4 rounded-xl hover:bg-white hover:shadow-sm transition-all text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-900 border border-transparent">
                         Update My Info
                      </button>
                      <button onClick={() => handleSubscriptionAction("suspend")} className="flex items-center justify-center gap-2 py-4 rounded-xl hover:bg-white hover:shadow-sm transition-all text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-900 border border-transparent">
                        Pause Subscription
                      </button>
                      <button onClick={() => handleSubscriptionAction("cancel")} className="flex items-center justify-center gap-2 py-4 rounded-xl hover:bg-red-50 text-red-500 transition-all text-[10px] font-black uppercase tracking-widest border border-transparent">
                        Cancel Subscription
                      </button>
                    </div>

                    {subscriptionData?.status !== SubscriptionStatus.ACTIVE && (
                      <div className="p-8 bg-gradient-to-br from-brand-3/5 to-slate-50 border border-brand-3/20 rounded-[26px] group relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                          <div className="text-center md:text-left font-primary">
                            <h4 className="text-xl font-bold text-slate-900  mb-1 italic">Ready for more?</h4>
                            <p className="text-sm text-slate-500">R45 a month. No commitments, cancel whenever you want.</p>
                          </div>
                          <button onClick={handleSubscribeWithLoading} className="w-full md:w-auto px-10 py-4 bg-brand-3 text-white font-black uppercase tracking-tighter hover:scale-105 transition-all rounded-xl font-primary shadow-lg shadow-brand-3/20">
                            Go Premium
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "alerts" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Link href="/dashboard/alerts" className="group bg-white border border-slate-200 rounded-[26px] p-8 hover:bg-slate-50 transition-all flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">My Alerts</h3>
                    <p className="text-sm text-slate-500">Configure real-time automated condition triggers.</p>
                  </div>
                  <ChevronRightIcon className="w-6 h-6 text-slate-300 group-hover:text-brand-3 transition-colors" />
                </Link>
                <div className="bg-slate-50 border border-slate-100 rounded-[26px] p-8">
                  <p className="text-sm text-slate-500 font-medium leading-relaxed font-primary">
                    Alerts track wave height, period, and incident light to notify you the moment 
                    your preferred conditions are met across the global network.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Right Column: Feed Preview */}
        <div className="hidden lg:block w-[450px] sticky top-0 h-screen border-l border-slate-100 overflow-hidden group bg-slate-50">
          <div className="absolute inset-0 z-10 bg-gradient-to-l from-transparent via-white/10 to-white/80 pointer-events-none" />
          <div className="absolute bottom-12 left-12 z-20 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Live Satellite Uplink</span>
            </div>
            <div className="p-4 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Location Lock</p>
              <p className="text-sm font-bold text-slate-900 uppercase tracking-tighter">Pacific Sector 7-G</p>
            </div>
          </div>
          
          {data?.heroImage?.image ? (
            <Image
              src={urlForImage(data.heroImage.image).url()}
              alt={data.heroImage.alt || "Background"}
              fill
              className="object-cover transition-transform duration-[10s] group-hover:scale-110 opacity-80"
            />
          ) : (
            <div className="w-full h-full bg-slate-100" />
          )}
        </div>
      </div>
    </div>
  );
}
