"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, ShoppingBag, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import RippleLoader from "@/app/components/ui/RippleLoader";

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
      <div className="flex justify-center items-center py-20">
        <RippleLoader isLoading={true} />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16 bg-white/5 backdrop-blur-xl rounded-[32px] border border-white/10 mx-auto max-w-lg">
        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
          <Bell className="w-5 h-5 text-gray-600" />
        </div>
        <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">
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
      <div className="flex items-center gap-1 p-1 bg-black/40 border border-white/5 rounded-2xl w-fit">
        {[
          { id: "all", label: "All Signals", count: notifications.length },
          { id: "alerts", label: "Sensors", count: notifications.filter(n => n.type === "ALERT").length },
          { id: "ads", label: "Broadcasts", count: notifications.filter(n => n.type === "AD").length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
              ${activeTab === tab.id 
                ? "bg-white/10 text-white shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] border border-white/10" 
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[9px] border
                ${activeTab === tab.id ? "bg-white/10 border-white/10 text-white" : "bg-black/40 border-white/5 text-gray-600"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center bg-white/5 border border-white/10 rounded-[32px]">
            <p className="text-xs font-black text-gray-600 uppercase tracking-[0.2em]">Zero {activeTab} Intelligence</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-[28px] p-6 transition-all duration-300 hover:bg-white/10 hover:border-white/20
                ${!notification.read ? "border-l-[4px] border-l-[var(--color-tertiary)] shadow-[0_0_30px_rgba(96,165,250,0.05)]" : "border-l border-white/10"}`}
            >
              {/* Pulse for unread */}
              {!notification.read && (
                <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-[var(--color-tertiary)] shadow-[0_0_8px_var(--color-tertiary)] animate-pulse" />
              )}

              <div className="flex items-start gap-5">
                <div className={`p-3.5 rounded-2xl shrink-0 transition-transform group-hover:scale-110
                  ${notification.type === "ALERT"
                    ? notification.alertNotification?.success
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-white/5 text-[var(--color-tertiary)] border border-white/10"
                  }`}>
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h3 className="text-base font-black text-white uppercase tracking-tighter">
                      <Link
                        href={getNotificationLink(notification)}
                        className="hover:text-[var(--color-tertiary)] transition-colors inline-block"
                        onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                      >
                        {notification.title}
                      </Link>
                    </h3>
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-all p-1.5 bg-black/40 rounded-lg hover:bg-red-500/20"
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
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  <div className="text-sm text-gray-300 leading-relaxed font-medium">
                    {notification.message}
                  </div>

                  {notification.alertNotification && (
                    <div className="mt-4 flex flex-wrap gap-2">
                       <span className="px-2.5 py-1 bg-black/40 border border-white/5 rounded-lg text-[10px] font-bold text-gray-400">
                         {notification.alertNotification.region}
                       </span>
                       <span className="px-2.5 py-1 bg-black/40 border border-white/5 rounded-lg text-[10px] font-bold text-gray-400">
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
