"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { MapPin } from "lucide-react";
import { BlueStarRating } from "@/app/lib/scoreDisplayBlueStars";
import type { LogEntry } from "@/app/types/raidlogs";
import { Skeleton } from "@/app/components/ui/skeleton";

export default function RecentRaidLogs() {
  const { data, isLoading } = useQuery({
    queryKey: ["recentRaidLogs"],
    queryFn: async () => {
      const res = await fetch(`/api/raid-logs?limit=3&page=1`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

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
        <h3 className="heading-6 font-primary">Recent Sessions</h3>
        <Link
          href="/raidlogs"
          className="text-[12px] hover:text-[var(--color-text-secondary)] hover:underline transition-colors font-primary whitespace-nowrap"
        >
          View All
        </Link>
      </div>

      <div className="space-y-6">
        {recentEntries.map((entry: LogEntry) => (
          <Link
            key={entry.id}
            href={`/raidlogs/${entry.id}`}
            className="group block"
          >
            <article className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="heading-7 mb-1 truncate group-hover:text-[var(--color-text-secondary)] transition-colors font-primary">
                    {entry.beach?.name || entry.beachName || "Unnamed Beach"}
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
              {entry.comments && (
                <p className="text-[12px] text-[var(--color-text-primary)] line-clamp-2 font-primary">
                  {entry.comments}
                </p>
              )}
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
