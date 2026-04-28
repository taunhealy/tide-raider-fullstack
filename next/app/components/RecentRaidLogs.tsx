"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { MapPin, Play } from "lucide-react";
import { BlueStarRating } from "@/app/lib/scoreDisplayBlueStars";
import type { LogEntry } from "@/app/types/raidlogs";
import { Skeleton } from "@/app/components/ui/skeleton";
import api from "@/app/lib/api-client";
import { VideoThumbnail } from "@/app/components/raid-logs/VideoThumbnail";
import { getVideoThumbnail } from "@/app/lib/videoUtils";
import { useSubscriptionDetails } from "@/app/hooks/useSubscriptionDetails";
import { SubscriptionStatus } from "@/app/types/subscription";
import { Lock as LockIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";

export default function RecentRaidLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ["recentRaidLogs"],
    queryFn: async () => {
      return api.getRaidLogs({ limit: 3, page: 1 });
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const { data: subscriptionDetails } = useSubscriptionDetails();
  const isSubscribed = subscriptionDetails?.status === SubscriptionStatus.ACTIVE;
  const hasAccess = isSubscribed || subscriptionDetails?.hasActiveTrial;

  if (isLoading) {
    return (
      <div className="bg-[var(--color-bg-primary)] p-6 rounded-lg shadow-sm border border-gray-200">
        <Skeleton className="h-7 w-32 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <Skeleton key={j} className="h-4 w-4" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const entries: LogEntry[] = data?.entries || [];
  const recentEntries = entries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  if (recentEntries.length === 0) {
    return null;
  }

  return (
    <div className="bg-[var(--color-bg-primary)] p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-primary">RECENT SESSIONS</h3>
        <Link
          href="/raidlogs"
          className="text-[12px] hover:text-[var(--color-text-secondary)] hover:underline transition-colors font-primary whitespace-nowrap"
        >
          View All
        </Link>
      </div>

      <div className="space-y-6">
        {recentEntries.map((entry: LogEntry) => {
          const isHiddenGemEntry = !!(entry as any).beach?.isHiddenGem;
          const isGatedGem = isHiddenGemEntry && !hasAccess;

          return (
            <Link
              key={entry.id}
              href={isGatedGem ? "/pricing" : `/raidlogs/${entry.id}`}
              className="group block relative"
            >
              {isGatedGem && (
                <div className="absolute inset-0 z-10 rounded-lg bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1 pointer-events-none">
                  <div className="bg-amber-50 border border-amber-200 rounded-full p-2 shadow-md">
                    <LockIcon className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest text-center">
                    Unlock Spot
                  </p>
                </div>
              )}
            <article className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="heading-7 mb-1 truncate group-hover:text-[var(--color-text-secondary)] transition-colors font-primary">
                    {isGatedGem ? "Hidden Gem" : (entry.beach?.name || entry.beachName || "Unnamed Beach")}
                    {isHiddenGemEntry && (
                      <span className="ml-1.5 text-amber-500" title="Hidden Gem">💎</span>
                    )}
                  </h4>
                  {entry.region && (
                    <div className="flex items-center gap-1 text-[12px] text-[var(--color-text-tertiary)] font-primary">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">
                        {entry.region.name}
                        {entry.region.country?.name
                          ? `, ${entry.region.country.name}`
                          : ""}
                      </span>
                    </div>
                  )}
                  <p className="text-[12px] text-[var(--color-text-tertiary)] font-primary mt-1">
                    {format(new Date(entry.date), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <BlueStarRating
                    score={entry.surferRating ?? 0}
                    outOfFive={true}
                  />
                </div>
              </div>
              
              {/* Media Thumbnail Section */}
              {entry.videoUrl ? (
                <div 
                  className={cn(
                    "relative w-full aspect-video rounded-xl overflow-hidden bg-gray-900 group/thumb shadow-md cursor-pointer border border-white/5",
                    isGatedGem && "blur-md"
                  )}
                  onClick={(e) => {
                    if (isGatedGem) return; // Prevent interaction
                    if (entry.videoPlatform) {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(entry.videoUrl, '_blank');
                    }
                  }}
                >
                  {entry.videoPlatform ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={getVideoThumbnail(entry.videoUrl, entry.videoPlatform)}
                        alt="Video thumbnail"
                        fill
                        className="object-cover group-hover/thumb:scale-110 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 300px"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover/thumb:bg-black/20 transition-colors">
                        <div className="bg-white/90 rounded-full p-2.5 shadow-xl transform group-hover/thumb:scale-110 transition-transform">
                          <Play className="w-4 h-4 text-[var(--color-tertiary)] fill-[var(--color-tertiary)]" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/80 text-[8px] font-bold text-white px-2 py-0.5 rounded-full uppercase tracking-widest border border-white/10">
                        {entry.videoPlatform}
                      </div>
                    </div>
                  ) : (
                    <VideoThumbnail 
                      videoUrl={entry.videoUrl} 
                      className="w-full h-full"
                    />
                  )}
                </div>
              ) : entry.imageUrl ? (
                <div className={cn(
                  "relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100",
                  isGatedGem && "blur-md"
                )}>
                  <Image
                    src={entry.imageUrl}
                    alt={entry.beach?.name || entry.beachName || "Session photo"}
                    fill
                    className="object-cover transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              ) : null}
              
              {!isGatedGem && entry.comments && (
                <p className="text-[12px] text-[var(--color-text-primary)] line-clamp-2 font-primary">
                  {entry.comments}
                </p>
              )}
              </article>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
