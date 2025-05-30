"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";

export default function NotificationBadge() {
  const { data: session } = useSession();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (session?.user) {
      fetchNotificationCount();
    }
  }, [session]);

  const fetchNotificationCount = async () => {
    try {
      const response = await fetch("/api/notifications/count");
      if (response.ok) {
        const data = await response.json();
        setCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
    }
  };

  if (count === 0) return null;

  return (
    <div className="relative">
      <Bell className="h-5 w-5" />
      <span className="absolute -top-4 -right-3 bg-cyan-300 text-white text-xs p-3 rounded-full h-4 w-4 flex items-center justify-center">
        {count > 99 ? "99+" : count}
      </span>
    </div>
  );
}
