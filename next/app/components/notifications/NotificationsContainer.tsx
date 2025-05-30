"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, ShoppingBag, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { SpiralAnimation } from "@/app/components/alerts/SpiralAnimation";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  alertNotification?: {
    alertId: string;
    alertName: string;
    region: string;
    beachId: string;
    beachName: string;
    details: string;
    success: boolean;
  };
  ad?: {
    id: string;
    title: string;
    companyName: string;
  };
  adRequest?: {
    id: string;
    title: string;
    companyName: string;
  };
}

export default function NotificationsContainer() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "alerts" | "ads">("all");

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
    }
  }, [session]);

  const handleTabChange = (tab: "all" | "alerts" | "ads") => {
    setActiveTab(tab);
    fetchNotifications(); // Refetch notifications when tab changes
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotifications(notifications.filter((notif) => notif.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationIds: [id] }),
      });

      if (response.ok) {
        setNotifications(
          notifications.map((notif) =>
            notif.id === id ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ALERT":
        return <AlertTriangle className="h-5 w-5" />;
      case "AD":
        return <ShoppingBag className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.type === "ALERT" && notification.alertNotification) {
      return `/dashboard/alerts/${notification.alertNotification.alertId}`;
    } else if (notification.type === "AD" && notification.ad) {
      return `/dashboard/advertising/${notification.ad.id}`;
    } else if (notification.type === "AD" && notification.adRequest) {
      return `/dashboard/advertising/requests/${notification.adRequest.id}`;
    }
    return "#";
  };

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    if (activeTab === "alerts") return notification.type === "ALERT";
    if (activeTab === "ads") return notification.type === "AD";
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-gray-100 animate-pulse rounded-lg" />
        <div className="h-24 bg-gray-100 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
        <div className="mb-3">
          <SpiralAnimation size={80} />
        </div>
        <h3 className="font-primary text-lg font-medium text-gray-800">
          No notifications
        </h3>
        <p className="font-primary text-sm text-gray-500 mt-1">
          You don't have any notifications yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Tabs for filtering notifications */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => handleTabChange("all")}
          className={`py-2 px-4 font-primary ${
            activeTab === "all"
              ? "border-b-2 border-cyan-500 text-cyan-600 font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All
          <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
            {notifications.length}
          </span>
        </button>
        <button
          onClick={() => handleTabChange("alerts")}
          className={`py-2 px-4 font-primary ${
            activeTab === "alerts"
              ? "border-b-2 border-cyan-500 text-cyan-600 font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Alerts
          <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
            {notifications.filter((n) => n.type === "ALERT").length}
          </span>
        </button>
        <button
          onClick={() => handleTabChange("ads")}
          className={`py-2 px-4 font-primary ${
            activeTab === "ads"
              ? "border-b-2 border-cyan-500 text-cyan-600 font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Ads
          <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
            {notifications.filter((n) => n.type === "AD").length}
          </span>
        </button>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <div className="mb-3">
            <SpiralAnimation size={80} />
          </div>
          <h3 className="font-primary text-lg font-medium text-gray-800">
            No {activeTab !== "all" ? activeTab : ""} notifications
          </h3>
          <p className="font-primary text-sm text-gray-500 mt-1">
            You don't have any {activeTab !== "all" ? activeTab : ""}{" "}
            notifications yet
          </p>
        </div>
      ) : (
        filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-white p-4 rounded-lg shadow-md border-l-4 ${
              notification.read ? "border-gray-300" : "border-cyan-500"
            } ${!notification.read ? "bg-blue-50" : ""}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-full shrink-0 ${
                  notification.type === "ALERT"
                    ? notification.alertNotification?.success
                      ? "bg-cyan-100 text-cyan-600"
                      : "bg-amber-100 text-amber-600"
                    : notification.type === "AD"
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-primary font-semibold text-gray-900 truncate">
                    <Link
                      href={getNotificationLink(notification)}
                      className="hover:text-cyan-600 transition-colors"
                      onClick={() =>
                        !notification.read && handleMarkAsRead(notification.id)
                      }
                    >
                      {notification.title}
                    </Link>
                  </h3>
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 p-1 rounded-full hover:bg-gray-100"
                    aria-label="Delete notification"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="font-primary text-sm text-gray-500 font-medium">
                  {notification.alertNotification && (
                    <>
                      {notification.alertNotification.region} •{" "}
                      {notification.alertNotification.beachName ||
                        notification.alertNotification.details ||
                        "Unknown location"}{" "}
                      •{" "}
                    </>
                  )}
                  <span className="text-gray-400">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {!notification.read && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-100 text-cyan-800">
                      New
                    </span>
                  )}
                </p>
                <div className="font-primary text-sm mt-2 text-gray-700 whitespace-pre-line leading-relaxed">
                  {notification.message}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
