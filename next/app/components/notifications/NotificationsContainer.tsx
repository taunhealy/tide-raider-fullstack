"use client";

import { useEffect, useState } from "react";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { Bell, ShoppingBag, AlertTriangle, Target, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import LoadingIndicator from "@/app/components/LoadingIndicator";

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
  const { data: session, status } = useBackendAuth();
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
    if (status === "loading") return;

    if (status === "authenticated" && session?.user) {
      fetchNotifications();
    } else {
      setIsLoading(false);
    }
  }, [session, status]);

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
      case "RECRUITMENT":
        return <Target className="h-5 w-5" />;
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
    if (activeTab === "ads") return notification.type === "AD" || notification.type === "RECRUITMENT";
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 gap-6">
        <LoadingIndicator />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 animate-pulse">Scanning Frequencies...</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50/50 rounded-[32px] border border-gray-100 mx-auto max-w-lg">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-200 shadow-sm">
          <Bell className="w-5 h-5 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-black tracking-tight mb-2">
          Silence in Sector
        </h3>
        <p className="text-sm text-gray-500 font-medium px-8">
          No signals detected on the frequency. All systems nominal.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Matrix Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100/80 border border-gray-200 rounded-2xl w-fit">
        {[
          { id: "all", label: "All Signals", count: notifications.length },
          { id: "alerts", label: "Sensors", count: notifications.filter(n => n.type === "ALERT").length },
          { id: "ads", label: "Broadcasts", count: notifications.filter(n => n.type === "AD" || n.type === "RECRUITMENT").length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
              ${activeTab === tab.id 
                ? "bg-white text-black shadow-sm border border-gray-200" 
                : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
              }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[9px] border
                ${activeTab === tab.id ? "bg-gray-100 border-gray-200 text-black" : "bg-gray-200/50 border-gray-200 text-gray-500"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center bg-gray-50 border border-gray-100 rounded-[32px]">
            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Zero {activeTab} Intelligence</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`group relative overflow-hidden bg-white border border-gray-100 rounded-[28px] p-6 transition-all duration-300 hover:shadow-md hover:border-gray-200
                ${!notification.read ? "border-l-[4px] border-l-brand-3 shadow-[0_10px_30px_rgba(0,0,0,0.02)]" : "border-l border-gray-100"}`}
            >
              {/* Pulse for unread */}
              {!notification.read && (
                <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-[var(--color-tertiary)] shadow-[0_0_8px_var(--color-tertiary)] animate-pulse" />
              )}

              <div className="flex items-start gap-5">
                <div className={`p-3.5 rounded-2xl shrink-0 transition-all
                  ${notification.type === "ALERT"
                    ? notification.alertNotification?.success
                      ? "bg-brand-3/10 text-brand-3 border border-brand-3/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : notification.type === "RECRUITMENT"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : "bg-gray-50 text-gray-600 border border-gray-100"
                  }`}>
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h3 className="text-base font-bold text-black tracking-tight">
                      <Link
                        href={getNotificationLink(notification)}
                        className="hover:text-brand-3 transition-colors inline-block"
                        onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                      >
                        {notification.title}
                      </Link>
                    </h3>
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1.5 bg-gray-50 rounded-lg hover:bg-red-50"
                      aria-label="Delete signal"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-tertiary)] bg-[var(--color-tertiary)]/10 px-2 py-0.5 rounded-md border border-[var(--color-tertiary)]/20">
                      {notification.type}
                    </span>
                    <span className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 leading-relaxed font-medium">
                    {notification.message}
                  </div>

                  {notification.alertNotification && (
                    <div className="mt-4 flex flex-wrap gap-2">
                       <span className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-500">
                         {notification.alertNotification.region}
                       </span>
                       <span className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-500">
                         {notification.alertNotification.beachName || "Sector Alpha"}
                       </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
