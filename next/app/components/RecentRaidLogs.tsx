"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { MapPin, Play, Lock as LockIcon } from "lucide-react";
import { BlueStarRating } from "@/app/lib/scoreDisplayBlueStars";
import type { LogEntry } from "@/app/types/raidlogs";
import { Skeleton } from "@/app/components/ui/skeleton";
import api from "@/app/lib/api-client";
import { VideoThumbnail } from "@/app/components/raid-logs/VideoThumbnail";
import { getVideoThumbnail } from "@/app/lib/videoUtils";
import { useSubscriptionDetails } from "@/app/hooks/useSubscriptionDetails";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { SubscriptionStatus } from "@/app/types/subscription";
import { cn } from "@/app/lib/utils";

export default function RecentRaidLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ["recentRaidLogs"],
    queryFn: async () => {
      return api.getRaidLogs({ limit: 4, page: 1 }); // Fetch one more for the list
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const { data: session } = useBackendAuth();
  const { data: subscriptionDetails } = useSubscriptionDetails();
  
  const isSubscribed = subscriptionDetails?.status === SubscriptionStatus.ACTIVE;
  const hasAccess = isSubscribed || subscriptionDetails?.hasActiveTrial;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="space-y-4 px-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const entries: LogEntry[] = data?.entries || [];
  const recentEntries = entries
    .filter((e) => e && e.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (recentEntries.length === 0) {
    return null;
  }

  const [latestEntry, ...otherEntries] = recentEntries;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-primary">LATEST LOGS</h3>
        <Link
          href="/raidlogs"
          className="text-[12px] text-brand-3 hover:underline transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="space-y-4 px-1">
        <div className="space-y-5">
          {recentEntries.slice(0, 3).map((entry) => {
            const isOwner = session?.user?.id === entry.userId;
            const isHiddenGemEntry = !!(entry as any).beach?.isHiddenGem;
            const isGatedGem = isHiddenGemEntry && !hasAccess && !isOwner;

            return (
              <Link
                key={entry.id}
                href={isGatedGem ? "/pricing" : `/raidlogs/${entry.id}`}
                className="group flex items-center gap-4 transition-all hover:translate-x-1"
              >
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                  {entry.imageUrl ? (
                    <Image src={entry.imageUrl} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                      <MapPin className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-black text-slate-900 uppercase truncate">
                    {isGatedGem ? "Secret Break" : (entry.beach?.name || entry.beachName)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">
                    {format(new Date(entry.date), "MMM d")} • {entry.surferRating}/5.0
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
