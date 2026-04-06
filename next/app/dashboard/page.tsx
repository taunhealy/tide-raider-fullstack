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
    <div className="min-h-screen bg-black text-gray-100 font-primary selection:bg-[var(--color-tertiary)]/30">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[var(--color-tertiary)]/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto p-4 sm:p-8 relative z-10">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter mb-2">
                Command Center
              </h1>
              <p className="text-gray-400 text-sm">Control your raids, alerts, and navigation data.</p>
            </div>
          </div>

          {/* Glass Tab Navigation */}
          <div className="flex items-center gap-1 p-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl w-fit overflow-x-auto max-w-full no-scrollbar">
            {[
              { id: "account", label: "Account" },
              { id: "billing", label: "Billing" },
              { id: "ads", label: "Ads" },
              { id: "alerts", label: "Alerts" },
              { id: "notifications", label: "Messages" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 relative group
                  ${activeTab === tab.id 
                    ? "text-white bg-white/10" 
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
              >
                {tab.label}
                {tab.id === "notifications" && (
                  <span className="ml-2 inline-flex items-center">
                    <NotificationBadge />
                  </span>
                )}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--color-tertiary)] shadow-[0_0_8px_var(--color-tertiary)]" />
                )}
              </button>
            ))}
          </div>

          <div className="w-full max-w-4xl">
            {activeTab === "account" && (
              <div className="space-y-6">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col gap-6">
                    <div>
                      <label htmlFor="username" className="block text-xs font-black uppercase tracking-widest text-[var(--color-tertiary)] mb-3">
                        Operator Handle
                      </label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          {isLoadingUser ? (
                            <div className="w-full h-[52px] bg-white/5 animate-pulse rounded-2xl border border-white/10" />
                          ) : (
                            <input
                              id="username"
                              type="text"
                              value={username}
                              onChange={(e) => {
                                setUsername(e.target.value);
                                setError(null);
                              }}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 outline-none transition-all focus:border-[var(--color-tertiary)] focus:ring-1 focus:ring-[var(--color-tertiary)]/50 placeholder:text-gray-600 font-bold"
                              placeholder="Enter handle..."
                            />
                          )}
                        </div>
                        <Button
                          onClick={handleUsernameUpdate}
                          disabled={isLoading || isLoadingUser}
                          className="px-8 bg-white text-black hover:bg-gray-200 font-black h-[52px] rounded-2xl transition-all"
                        >
                          {isLoading ? "SYNCING..." : "UPDATE"}
                        </Button>
                      </div>
                      {error && <p className="text-sm text-red-500 mt-3 font-bold">× {error}</p>}
                    </div>

                    <div>
                      <label htmlFor="userId" className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
                        Secure UID
                      </label>
                      <div className="relative">
                        <input
                          id="userId"
                          type="text"
                          value={session?.user?.id || userData?.id || ""}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 text-gray-500 font-mono text-sm"
                          disabled
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
                  <RoleManager
                    userId={session?.user?.id}
                    initialRoles={userData?.roles || []}
                    onUpdate={async (roles) => {
                      try {
                        queryClient.invalidateQueries({
                          queryKey: ["user", session?.user?.id],
                        });
                        router.refresh();
                      } catch (error) {
                        console.error("Failed to update roles:", error);
                      }
                    }}
                  />
                </div>
              </div>
            )}
              {activeTab === "billing" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">
                    Status Registry
                  </h2>
                  <button
                    onClick={handleSyncSubscription}
                    disabled={loadingStates.subscribe}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
                  >
                    {loadingStates.subscribe ? "SYNCING..." : "RESCAN STATUS"}
                  </button>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-2">
                  {isLoadingDetails ? (
                    <div className="p-12 text-center text-gray-500 font-bold animate-pulse uppercase tracking-widest text-sm">
                      Accessing encrypted billing data...
                    </div>
                  ) : subscriptionData ? (
                    <div className="space-y-1">
                      {/* Subscription Header Card */}
                      <div className="bg-white/5 rounded-[22px] p-6 sm:p-8 space-y-6 border border-white/5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex items-center px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                                ${subscriptionData.status === SubscriptionStatus.ACTIVE
                                  ? "bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                                  : subscriptionData.status === SubscriptionStatus.TRIAL
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                                  : "bg-gray-500/10 text-gray-400 border border-white/5"
                                }`}>
                                ● {subscriptionData.status || "INACTIVE"}
                              </span>
                              {(subscriptionData.status === SubscriptionStatus.TRIAL) && (
                                <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">
                                  TRIAL PERIOD
                                </span>
                              )}
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                              {subscriptionData.status === SubscriptionStatus.ACTIVE ? "Premium Raider" : "Standard Operator"}
                            </h3>
                          </div>
                          
                          <div className="text-left sm:text-right">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Billing Sequence</p>
                            <p className="text-xl font-black text-white tabular-nums">
                              {subscriptionData?.next_billing_time 
                                ? formatDate(subscriptionData.next_billing_time)
                                : "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 p-1 bg-black/40 rounded-2xl border border-white/5">
                          <button
                            onClick={handleSyncSubscription}
                            disabled={loadingStates.subscribe}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest group"
                          >
                            <Bell className="w-3 h-3 group-hover:animate-bounce" />
                            Force Sync
                          </button>
                          
                          <button
                            onClick={() => handleSubscriptionAction("suspend")}
                            disabled={loadingStates.pause}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest"
                          >
                            Suspend
                          </button>

                          <button
                            onClick={() => handleSubscriptionAction("cancel")}
                            disabled={loadingStates.unsubscribe}
                    </div>
                  </div>
                ) : (
                  renderSubscriptionState()
                )}
              </div>
            )}

            {activeTab === "ads" && (
              <div className="space-y-4">
                <div className="flex flex-col gap-4">
                  <Link
                    href="/dashboard/ads"
                    className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h3 className="font-medium">Manage Advertisements</h3>
                      <p className="text-sm text-gray-600">
                        View and edit your advertising campaigns
                      </p>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  </Link>

                  <Link
                    href="/advertising"
                    className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h3 className="font-medium">Create New Ad</h3>
                      <p className="text-sm text-gray-600">
                        Create a new advertising campaign for your business
                      </p>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  </Link>
                </div>
              </div>
            )}

            {activeTab === "alerts" && (
              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold font-primary">
                  Forecast Alerts
                </h2>

                <div className="flex flex-col gap-4">
                  <Link
                    href="/dashboard/alerts"
                    className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h3 className="font-medium font-primary">
                        Manage Alerts
                      </h3>
                      <p className="text-sm text-gray-600 font-primary">
                        Create and manage your surf forecast alerts
                      </p>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  </Link>

                  <div className="p-4 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800 font-primary">
                      Get notified when surf conditions match your preferences.
                      Set up alerts for specific locations, wave heights, and
                      more.
                    </p>
                  </div>
                </div>

                {subscriptionData?.status !== SubscriptionStatus.ACTIVE && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-md">
                    <p className="text-sm text-yellow-800 font-primary">
                      You need an active subscription to use advanced alert
                      features.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-2 w-full sm:w-auto font-primary"
                      onClick={handleSubscribeWithLoading}
                      disabled={loadingStates.subscribe}
                    >
                      {loadingStates.subscribe
                        ? "Processing..."
                        : "Subscribe Now"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-4">
                <NotificationsContainer />
              </div>
            )}
          </div>
        </div>

        <div className="flex-none w-full sm:w-[800px] relative h-[600px]">
          <div className="absolute inset-0">
            {data?.heroImage?.image ? (
              <Image
                src={urlForImage(data.heroImage.image).url()}
                alt={data.heroImage.alt || "Dashboard background"}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--color-tertiary)]/20 to-gray-100 flex items-center justify-center">
                <span className="text-gray-400 font-primary text-sm">
                  No image available
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
