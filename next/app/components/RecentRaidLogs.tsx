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
import { useBeaches } from "@/app/hooks/useBeaches";
import { SubscriptionStatus } from "@/app/types/subscription";
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

  const { data: session } = useBackendAuth();
  const { data: subscriptionDetails } = useSubscriptionDetails();
  const { data: beachesData } = useBeaches();
  const beaches = (beachesData as any)?.beaches || beachesData || [];
  
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
          const isOwner = session?.user?.id === entry.userId;
          // Harden check to look at beach name as well
          const isHiddenGemEntry = !!(entry as any).beach?.isHiddenGem || 
                                  beaches?.find((b: any) => b && (b.id === (entry as any).beachId || b.name === entry.beachName))?.isHiddenGem;
          const isGatedGem = isHiddenGemEntry && !hasAccess && !isOwner;

          return (
            <Link
              key={entry.id}
              href={isGatedGem ? "/pricing" : `/raidlogs/${entry.id}`}
              className="group block relative"
            >
              {/* Gated entry indicator - subtle lock in corner */}
              {isGatedGem && (
                <div className="absolute top-2 right-2 z-20 bg-amber-500 rounded-full p-2 shadow-lg border border-amber-400 flex items-center justify-center">
                  <LockIcon className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            <article className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="heading-7 mb-1 truncate group-hover:text-[var(--color-text-secondary)] transition-colors font-primary">
                    {isGatedGem ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 text-[11px] font-black uppercase tracking-widest border border-amber-500/20">
                        <LockIcon className="w-3.5 h-3.5 mr-1.5" />
                        Hidden Gem
                      </span>
                    ) : (
                      <span className="text-[11px] font-black uppercase tracking-widest text-gray-900">
                        {entry.beach?.name || entry.beachName || "Unnamed Beach"}
                      </span>
                    )}
                    {isHiddenGemEntry && !isGatedGem && (
                      <span className="text-amber-500 text-[11px]" title="Hidden Gem">💎</span>
                    )}
                  </h4>
                  {!isGatedGem && entry.region && (
                    <div className="flex items-center gap-1 text-[12px] text-[var(--color-text-tertiary)] font-primary">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">
                        {entry.region?.name}
                        {entry.region?.country?.name
                          ? `, ${entry.region.country.name}`
                          : ""}
                      </span>
                    </div>
                  )}
                  <p className="text-[12px] text-[var(--color-text-tertiary)] font-primary mt-1">
                    {entry.date ? format(new Date(entry.date), "MMM d, yyyy") : "Date unknown"}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <BlueStarRating
                    score={Number(entry.surferRating || 0)}
                    outOfFive={true}
                  />
                </div>
              </div>
              
              {/* Media Thumbnail Section */}
              {entry.videoUrl ? (
                <div 
                  className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-900 group/thumb shadow-md cursor-pointer border border-white/5"
                  onClick={(e) => {
                    // We allow viewing the video for Hidden Gems as a preview, but not the spot data
                    if (entry.videoPlatform && entry.videoUrl) {
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
                <div 
                  className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                  onClick={(e) => {
                    if (isGatedGem && entry.imageUrl) {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(entry.imageUrl, '_blank');
                    }
                  }}
                >
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
