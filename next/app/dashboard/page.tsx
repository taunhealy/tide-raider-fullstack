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
import { RoleManager } from "@/app/components/dashboard/RoleManager";
import { Bell } from "lucide-react";
import NotificationBadge from "@/app/components/notifications/NotificationBadge";
import NotificationsContainer from "@/app/components/notifications/NotificationsContainer";

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
    "account" | "billing" | "ads" | "alerts" | "notifications"
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
    <div className="min-h-screen bg-black text-gray-100 font-primary selection:bg-[var(--color-tertiary)]/30 overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-tertiary)]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">
        {/* Left Column: Operation Controls */}
        <div className="flex-1 p-4 sm:p-8 lg:p-12 space-y-10 max-w-5xl">
          <header>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-[var(--color-tertiary)] shadow-[0_0_8px_var(--color-tertiary)] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-tertiary)]">System Active</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter">
              Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">Center</span>
            </h1>
            <p className="text-gray-400 mt-2 max-w-md font-medium">Manage your global surf intelligence, billing sequences, and localized alerts.</p>
          </header>

          {/* Navigation Matrix */}
          <nav className="flex items-center gap-1 p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl w-fit">
            {[
              { id: "account", label: "Identity" },
              { id: "billing", label: "Registry" },
              { id: "ads", label: "Broadcasts" },
              { id: "alerts", label: "Sensors" },
              { id: "notifications", label: "Signals" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 relative
                  ${activeTab === tab.id 
                    ? "text-white bg-white/10 shadow-[inset_0_0_12px_rgba(255,255,255,0.05)]" 
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
              >
                {tab.label}
                {tab.id === "notifications" && (
                  <span className="ml-2 inline-flex items-center scale-90 translate-y-[-1px]">
                    <NotificationBadge />
                  </span>
                )}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-[var(--color-tertiary)] shadow-[0_0_10px_var(--color-tertiary)]" />
                )}
              </button>
            ))}
          </nav>

          <main className="min-h-[500px]">
            {activeTab === "account" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 sm:p-10 space-y-8">
                  <div className="grid gap-8">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-tertiary)] mb-4">Operator Handle</label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-[var(--color-tertiary)] focus:ring-1 focus:ring-[var(--color-tertiary)]/30 transition-all text-white font-bold"
                          placeholder="Assign handle..."
                        />
                        <button
                          onClick={handleUsernameUpdate}
                          className="px-10 bg-white text-black font-black uppercase tracking-tighter rounded-2xl hover:bg-gray-200 transition-all active:scale-95 py-4"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4">Secure UID</label>
                      <div className="bg-black/20 border border-white/5 rounded-2xl px-6 py-4 text-gray-500 font-mono text-xs flex items-center justify-between">
                        {session?.user?.id || "UNASSIGNED"}
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 sm:p-10">
                  <RoleManager
                    userId={session?.user?.id}
                    initialRoles={userData?.roles || []}
                    onUpdate={async () => {
                      queryClient.invalidateQueries({ queryKey: ["user", session?.user?.id] });
                      router.refresh();
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-2">
                  <div className="bg-black/40 rounded-[26px] p-6 sm:p-10 border border-white/5">
                    <div className="flex flex-col sm:flex-row justify-between gap-8 mb-10">
                      <div className="space-y-2">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border
                          ${subscriptionData?.status === SubscriptionStatus.ACTIVE 
                            ? "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]" 
                            : "bg-gray-500/10 text-gray-400 border-white/10"}`}>
                          ● {subscriptionData?.status || "INACTIVE"}
                        </span>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter">
                          {subscriptionData?.status === SubscriptionStatus.ACTIVE ? "Elite Raider" : "Standard Ops"}
                        </h3>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Sequence Renewal</p>
                        <p className="text-2xl font-black text-white tabular-nums">
                          {subscriptionData?.next_billing_time ? formatDate(subscriptionData.next_billing_time) : "-- -- --"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-1.5 bg-black/40 rounded-2xl border border-white/5 mb-8">
                      <button onClick={handleSyncSubscription} className="flex items-center justify-center gap-2 py-4 rounded-xl hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest">
                        <Bell className="w-3 h-3" /> Sync
                      </button>
                      <button onClick={() => handleSubscriptionAction("suspend")} className="flex items-center justify-center gap-2 py-4 rounded-xl hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest">
                        Suspend
                      </button>
                      <button onClick={() => handleSubscriptionAction("cancel")} className="flex items-center justify-center gap-2 py-4 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all text-[10px] font-black uppercase tracking-widest">
                        Offline
                      </button>
                    </div>

                    {subscriptionData?.status !== SubscriptionStatus.ACTIVE && (
                      <div className="p-8 bg-gradient-to-br from-[var(--color-tertiary)]/20 to-blue-600/20 border border-[var(--color-tertiary)]/30 rounded-[26px] group relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                          <div className="text-center md:text-left">
                            <h4 className="text-xl font-black text-white uppercase tracking-widest mb-1 italic">Go Further</h4>
                            <p className="text-sm text-gray-400">Unlock global satellite telemetry and deep forecast metadata.</p>
                          </div>
                          <button onClick={handleSubscribeWithLoading} className="w-full md:w-auto px-10 py-4 bg-white text-black font-black uppercase tracking-tighter hover:scale-105 transition-all rounded-xl">
                            Upgrade
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "ads" && (
              <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Link href="/dashboard/ads" className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-[26px] p-8 hover:bg-white/10 transition-all flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1">Broadcast Manager</h3>
                    <p className="text-sm text-gray-500">View and refine your global visibility campaigns.</p>
                  </div>
                  <ChevronRightIcon className="w-6 h-6 text-gray-600 group-hover:text-[var(--color-tertiary)] transition-colors" />
                </Link>
                <Link href="/advertising" className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-[26px] p-8 hover:bg-white/10 transition-all flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1">New Deployment</h3>
                    <p className="text-sm text-gray-500">Initiate a new advertising raid for your brand.</p>
                  </div>
                  <ChevronRightIcon className="w-6 h-6 text-gray-600 group-hover:text-[var(--color-tertiary)] transition-colors" />
                </Link>
              </div>
            )}

            {activeTab === "alerts" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Link href="/dashboard/alerts" className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-[26px] p-8 hover:bg-white/10 transition-all flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1">Sensor Array</h3>
                    <p className="text-sm text-gray-500">Configure real-time automated condition triggers.</p>
                  </div>
                  <ChevronRightIcon className="w-6 h-6 text-gray-600 group-hover:text-[var(--color-tertiary)] transition-colors" />
                </Link>
                <div className="bg-[var(--color-tertiary)]/5 border border-[var(--color-tertiary)]/20 rounded-[26px] p-8">
                  <p className="text-sm text-[var(--color-tertiary)] font-medium leading-relaxed">
                    Sensors track wave height, period, and incident light to notify you the moment 
                    your preferred conditions are met across the global network.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden">
                <NotificationsContainer />
              </div>
            )}
          </main>
        </div>

        {/* Right Column: Satellite Feed Preview */}
        <div className="hidden lg:block w-[450px] sticky top-0 h-screen border-l border-white/10 overflow-hidden group">
          <div className="absolute inset-0 z-10 bg-gradient-to-l from-transparent via-black/20 to-black pointer-events-none" />
          <div className="absolute bottom-12 left-12 z-20 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">Live Satellite Uplink</span>
            </div>
            <div className="p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Location Lock</p>
              <p className="text-sm font-bold text-white uppercase tracking-tighter">Pacific Sector 7-G</p>
            </div>
          </div>
          
          {data?.heroImage?.image ? (
            <Image
              src={urlForImage(data.heroImage.image).url()}
              alt={data.heroImage.alt || "Command Background"}
              fill
              className="object-cover transition-transform duration-[10s] group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black" />
          )}
        </div>
      </div>
    </div>
  );
}
