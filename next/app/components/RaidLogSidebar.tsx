"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Star } from "lucide-react";
import { cn } from "@/app/lib/utils";
import type { LogEntry } from "@/app/types/questlogs";
import Image from "next/image";

export default function RaidLogSidebar() {
  const { data: recentLogs, isLoading } = useQuery({
    queryKey: ["recentLogs"],
    queryFn: async () => {
      const res = await fetch(`/api/raid-logs`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
  });

  if (isLoading) return <div>Loading...</div>;

  // Ensure we have an array to work with and get most recent entry
  const entries = Array.isArray(recentLogs?.entries)
    ? recentLogs.entries
    : Array.isArray(recentLogs)
      ? recentLogs
      : [];

  const mostRecentEntry = entries.sort(
    (a: LogEntry, b: LogEntry) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  if (!mostRecentEntry) {
    return null;
  }

  return (
    <div className="bg-[var(--color-bg-primary)] p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold text-gray-800 font-primary`}>
          Latest Log Entry
        </h3>
        <Link
          href="/raidlogs"
          className="text-sm text-[var(--color-text-secondary)] hover:underline font-primary"
        >
          View All
        </Link>
      </div>

      <article className="space-y-3">
        {mostRecentEntry.imageUrl && (
          <Link href={`/raidlogs/${mostRecentEntry.id}`}>
            <div className="relative aspect-video rounded-lg overflow-hidden cursor-pointer">
              <Image
                src={mostRecentEntry.imageUrl}
                alt={`Session at ${mostRecentEntry.beachName}`}
                fill
                className="object-cover hover:opacity-90 transition-opacity"
              />
            </div>
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <Link href={`/raidlogs/${mostRecentEntry.id}`}>
            <h4 className="text-sm font-medium text-gray-900 mb-1 truncate group-hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer font-primary">
              {mostRecentEntry.beachName}
            </h4>
          </Link>
          <div className="flex gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Star
                key={rating}
                className={cn(
                  "w-4 h-4",
                  rating <= (mostRecentEntry.surferRating || 0)
                    ? "fill-yellow-400"
                    : "fill-gray-200"
                )}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 line-clamp-2 font-primary">
            {mostRecentEntry.comments}
          </p>
          <div className="mt-1 text-xs text-gray-400 font-primary">
            {new Date(mostRecentEntry.date).toLocaleDateString()}
          </div>
        </div>
      </article>
    </div>
  );
}
