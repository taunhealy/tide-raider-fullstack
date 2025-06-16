"use client";

import { useSession } from "next-auth/react";
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
  const { data: session, update } = useSession();
  const { trialStatus, trialEndDate } = useSubscription();
  const [activeTab, setActiveTab] = useState<
    "account" | "billing" | "rentals" | "ads" | "alerts" | "notifications"
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
        const error = await response.json();
        throw new Error(error.message || "Failed to start trial");
      }
      return response.json();
    },
    onSuccess: async () => {
      // Invalidate all relevant queries
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      await queryClient.invalidateQueries({ queryKey: ["session"] });
      await queryClient.invalidateQueries({
        queryKey: ["subscriptionDetails"],
      });

      // Update the session
      await update();

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
      await update(); // Update the session
      queryClient.invalidateQueries({ queryKey: ["subscriptionDetails"] });
      queryClient.invalidateQueries({ queryKey: ["user", session?.user?.id] });
      router.refresh(); // Refresh the page
    };

    // Set up event listener for subscription changes
    const channel = new BroadcastChannel("subscription-update");
    channel.onmessage = refreshData;

    return () => channel.close();
  }, [update, queryClient, router, session?.user?.id]);

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
      await update();
      setUsername(data.name);
      toast.success("Username updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["session"] });
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
      await handleSubscribe();
      // After successful subscription
      await queryClient.invalidateQueries({
        queryKey: ["subscriptionDetails"],
      });
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      await update();
      router.refresh();
    } finally {
      setLoadingStates((prev) => ({ ...prev, subscribe: false }));
    }
  };

  const handleSubscriptionAction = async (
    action: "cancel" | "suspend" | "activate"
  ) => {
    if (!subscriptionData?.id) return;
    setLoadingStates((prev) => ({ ...prev, pause: true }));
    try {
      await mutate({ action, subscriptionId: subscriptionData.id });
    } catch (error) {
      console.error("Subscription action failed:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, pause: false }));
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

    // Check trial status
    if (subscriptionData?.hasActiveTrial) {
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
          <p className="font-primary">Ready to start your free trial?</p>
          <Button
            variant="outline"
            className="w-full sm:w-auto font-primary mt-4"
            onClick={() => handleTrial()}
            disabled={isTrialLoading}
          >
            {isTrialLoading ? (
              <div className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Starting Trial...
              </div>
            ) : (
              "Start 7-Day Free Trial"
            )}
          </Button>
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
    <div className="container mx-auto p-4 sm:p-6 font-primary">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">Dashboard</h1>

          <div className="flex flex-row sm:flex-row gap-2 sm:gap-4 mb-6 flex-wrap">
            <Button
              variant={activeTab === "account" ? "default" : "outline"}
              onClick={() => setActiveTab("account")}
              className="w-full sm:w-auto font-primary"
            >
              Account
            </Button>
            <Button
              variant={activeTab === "billing" ? "default" : "outline"}
              onClick={() => setActiveTab("billing")}
              className="w-full sm:w-auto font-primary"
            >
              Billing
            </Button>
            <Button
              variant={activeTab === "rentals" ? "default" : "outline"}
              onClick={() => setActiveTab("rentals")}
              className="w-full sm:w-auto font-primary"
            >
              Rentals
            </Button>
            <Button
              variant={activeTab === "ads" ? "default" : "outline"}
              onClick={() => setActiveTab("ads")}
              className="w-full sm:w-auto font-primary"
            >
              Ads
            </Button>
            <Button
              variant={activeTab === "alerts" ? "default" : "outline"}
              onClick={() => setActiveTab("alerts")}
              className="w-full sm:w-auto font-primary"
            >
              Alerts
            </Button>
            <Button
              variant={activeTab === "notifications" ? "default" : "outline"}
              onClick={() => setActiveTab("notifications")}
              className="w-full sm:w-auto font-primary relative"
            >
              Notifications
              <div className="absolute -top-2 -right-2">
                <NotificationBadge />
              </div>
            </Button>
          </div>

          <div className="min-h-[400px] w-full max-w-full sm:min-w-[500px] sm:max-w-[500px]">
            {activeTab === "account" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Username
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2 space-y-2 sm:space-y-0">
                    {isLoadingUser ? (
                      <div className="w-full h-[40px] bg-gray-200 animate-pulse rounded-md" />
                    ) : (
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          setError(null);
                        }}
                        className="w-full p-2 border rounded-md"
                      />
                    )}
                    <Button
                      onClick={handleUsernameUpdate}
                      disabled={isLoading || isLoadingUser}
                      variant="outline"
                      className="max-w-[320px] sm:max-w-[540px]"
                    >
                      {isLoading ? "Updating..." : "Update"}
                    </Button>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">
                      User ID
                    </label>
                    <input
                      type="text"
                      value={session?.user?.id || ""}
                      className="w-full p-2 border rounded-md bg-gray-100"
                      disabled
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                  )}
                </div>

                <div className="mt-8">
                  <RoleManager
                    userId={session?.user?.id}
                    initialRoles={userData?.roles || []}
                    onUpdate={async (roles) => {
                      try {
                        await update();
                        queryClient.invalidateQueries({
                          queryKey: ["user", session?.user?.id],
                        });
                      } catch (error) {
                        console.error("Failed to update roles:", error);
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold font-primary">
                  Subscription Status
                </h2>
                {isLoadingDetails ? (
                  <div className="p-4 text-center font-primary">
                    Loading subscription details...
                  </div>
                ) : subscriptionData ? (
                  <div className="p-6 border rounded-xl bg-white shadow-sm space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                          ${
                            subscriptionData.status ===
                            SubscriptionStatus.ACTIVE
                              ? "bg-green-50 text-green-700"
                              : subscriptionData.status === "suspended"
                                ? "bg-yellow-50 text-yellow-700"
                                : "bg-gray-50 text-gray-700"
                          }`}
                        >
                          {subscriptionData.status}
                        </span>
                      </div>

                      {(trialEndDate ||
                        subscriptionData?.next_billing_time) && (
                        <p className="text-sm text-gray-600 font-primary">
                          {trialStatus === "active" ? (
                            <>
                              Trial ends on:{" "}
                              {trialEndDate
                                ? formatDate(trialEndDate.toString())
                                : "N/A"}
                            </>
                          ) : subscriptionData?.status === "CANCELLED" ? (
                            <>Subscription ended</>
                          ) : (
                            <>
                              Next billing date:{" "}
                              {formatDate(subscriptionData?.next_billing_time)}
                            </>
                          )}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                      {subscriptionData.status === SubscriptionStatus.ACTIVE ? (
                        <>
                          <Button
                            variant="outline"
                            className="w-full sm:w-auto font-primary text-[12px]"
                            onClick={() => handleSubscriptionAction("suspend")}
                            disabled={loadingStates.pause}
                          >
                            <svg
                              className="w-4 h-4 mr-2"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {loadingStates.pause
                              ? "Processing..."
                              : "Suspend Subscription"}
                          </Button>

                          <Button
                            variant="destructive"
                            className="w-full sm:w-auto font-primary text-[12px]"
                            onClick={() =>
                              mutate({
                                action: "cancel",
                                subscriptionId: subscriptionData?.id || "",
                              })
                            }
                            disabled={loadingStates.unsubscribe}
                          >
                            <svg
                              className="w-4 h-4 mr-2"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            {loadingStates.unsubscribe
                              ? "Cancelling..."
                              : "Cancel Subscription"}
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="default"
                          className="w-full sm:w-auto font-primary"
                          onClick={handleButtonClick}
                          disabled={loadingStates.subscribe || isTrialLoading}
                        >
                          {!subscriptionData?.hasTrialEnded &&
                          !subscriptionData?.hasActiveTrial
                            ? isTrialLoading
                              ? "Starting Trial..."
                              : "Start Free Trial"
                            : loadingStates.subscribe
                              ? "Processing..."
                              : "Subscribe Now"}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  renderSubscriptionState()
                )}
              </div>
            )}

            {activeTab === "rentals" && (
              <div className="space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold font-primary">
                  My Rental Items
                </h2>

                <div className="flex flex-col gap-4">
                  <Link
                    href="/dashboard/rentals"
                    className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h3 className="font-medium">Manage Rental Items</h3>
                      <p className="text-sm text-gray-600">
                        View and edit your rental listings
                      </p>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  </Link>

                  <Link
                    href="/rentals/requests"
                    className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h3 className="font-medium">Rental Requests</h3>
                      <p className="text-sm text-gray-600">
                        Manage incoming and outgoing rental requests
                      </p>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  </Link>

                  <Link
                    href="/rentals/new"
                    className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <h3 className="font-medium">List New Item</h3>
                      <p className="text-sm text-gray-600">
                        Add a new surfboard, motorbike, or scooter for rent
                      </p>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  </Link>
                </div>

                {subscriptionData?.status !== SubscriptionStatus.ACTIVE && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-md">
                    <p className="text-sm text-yellow-800">
                      You need an active subscription to list rental items.
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
            <Image
              src={
                data?.heroImage?.image
                  ? urlForImage(data.heroImage.image).url()
                  : "/fallback-image.jpg"
              }
              alt={data?.heroImage?.alt || "Dashboard background"}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
