"use client";

import { useRaidLogs } from "@/app/hooks/useRaidLogs";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { BlueStarRating } from "@/app/lib/scoreDisplayBlueStars";
import { Skeleton } from "@/app/components/ui/skeleton";
import { MapPin, Clock } from "lucide-react";

export function RecentLogsSidebar() {
  const { data, isLoading } = useRaidLogs({ limit: 5 }, false);
  const entries = data?.entries || [];

  return (
    <aside className="hidden lg:block w-80 shrink-0 sticky top-24 self-start space-y-6">
      <div className="bg-white/40 backdrop-blur-md rounded-[32px] p-6 border border-white/60 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-900">
            Recent Intelligence
          </h3>
          <Link href="/raidlogs" className="text-[10px] font-bold text-brand-3 uppercase hover:underline">
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
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-sm">
                  {entry.imageUrl ? (
                    <Image
                      src={entry.imageUrl}
                      alt={entry.beachName || "Surf session"}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <MapPin className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-between py-0.5 flex-1 min-w-0">
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-slate-900 truncate group-hover:text-brand-3 transition-colors">
                      {entry.beachName}
                    </h4>
                    <div className="flex items-center gap-2">
                       <BlueStarRating rating={entry.surferRating || 0} size="xs" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
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
