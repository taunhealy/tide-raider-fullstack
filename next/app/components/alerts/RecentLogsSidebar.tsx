"use client";

import { useRaidLogs } from "@/app/hooks/useRaidLogs";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { BlueStarRating } from "@/app/lib/scoreDisplayBlueStars";
import { Skeleton } from "@/app/components/ui/skeleton";
import { MapPin, Clock, Lock } from "lucide-react";
import { getVideoThumbnail } from "@/app/lib/videoUtils";
import { VideoThumbnail } from "@/app/components/raid-logs/VideoThumbnail";
import { useSession } from "next-auth/react";
import { api } from "@/app/lib/api";
import { useQuery } from "@tanstack/react-query";

export function RecentLogsSidebar() {
  const { data: session } = useSession();
  const { data, isLoading } = useRaidLogs({ limit: 5 }, false);
  const entries = data?.entries || [];

  // Get subscription details to handle gated content
  const { data: subscriptionDetails } = useQuery({
    queryKey: ["subscription", session?.user?.id],
    queryFn: () => api.getSubscriptionDetails(),
    enabled: !!session?.user?.id,
  });

  const isSubscribed = subscriptionDetails?.isSubscribed || subscriptionDetails?.hasActiveTrial;

  return (
    <aside className="hidden lg:block w-80 shrink-0 sticky top-24 self-start space-y-6">
      <div className="bg-slate-900 rounded-[32px] p-6 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
          <h3 className="font-black text-xs uppercase tracking-[0.2em] text-white">
            Recent Intelligence
          </h3>
          <Link href="/raidlogs" className="text-[10px] font-bold text-white uppercase hover:underline">
            View All
          </Link>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : entries.length === 0 ? (
            <p className="text-xs text-slate-500 font-medium italic">No recent logs found.</p>
          ) : (
            entries.map((entry) => (
              <Link 
                key={entry.id} 
                href={`/raidlogs/${entry.id}`}
                className="group flex gap-4 transition-all duration-300 hover:translate-x-1"
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700 shadow-sm">
                  {entry.isPrivate && entry.userId !== session?.user?.id && !isSubscribed && (
                    <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-white/70" />
                    </div>
                  )}
                  {entry.imageUrl ? (
                    <Image
                      src={entry.imageUrl}
                      alt={entry.beachName || "Surf session"}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : entry.videoUrl ? (
                    (() => {
                      const platform = entry.videoPlatform || "upload";
                      if (platform === "upload") {
                        return (
                          <VideoThumbnail 
                            videoUrl={entry.videoUrl} 
                            className="w-full h-full border-none" 
                            showOverlay={false} 
                            autoPlay={false} 
                          />
                        );
                      }
                      return (
                        <Image
                          src={getVideoThumbnail(entry.videoUrl, platform)}
                          alt={entry.beachName || "Surf session"}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      );
                    })()
                  ) : (entry as any).videoUrls?.[0] ? (
                    (() => {
                      const video = (entry as any).videoUrls[0];
                      if (video.type === "upload") {
                        return (
                          <VideoThumbnail 
                            videoUrl={video.url} 
                            className="w-full h-full border-none" 
                            showOverlay={false} 
                            autoPlay={false} 
                          />
                        );
                      }
                      return (
                        <Image
                          src={video.thumbnail || getVideoThumbnail(video.url, video.type)}
                          alt={entry.beachName || "Surf session"}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      );
                    })()
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <MapPin className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-between py-0.5 flex-1 min-w-0">
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-white truncate group-hover:text-brand-3 transition-colors">
                      {entry.beachName}
                    </h4>
                    <div className="flex items-center gap-2">
                       <BlueStarRating score={entry.surferRating || 0} size={12} outOfFive={true} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {format(new Date(entry.date), "MMM d")}
                    </span>
                    <span className="truncate">
                      by {entry.isAnonymous ? "Anonymous" : (entry.surferName || "Rider")}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-brand-3/10 to-transparent rounded-[32px] p-6 border border-brand-3/20 shadow-sm">
        <h4 className="font-black text-[10px] uppercase tracking-widest text-brand-3 mb-2">
          Tactical Edge
        </h4>
        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          Your alerts are monitored against incoming forecast cycles every 4 hours.
        </p>
      </div>
    </aside>
  );
}
