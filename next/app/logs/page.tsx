"use client";

import { useQuery } from "@tanstack/react-query";
import RaidLogTable from "@/app/components/raid-logs/RaidLogTable";
import { useBeach } from "@/app/context/BeachContext";
import LoadingIndicator from "@/app/components/LoadingIndicator";
import EmptyState from "@/app/components/EmptyState";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";

export default function LogsPage() {
  const { data: session } = useBackendAuth();
  const { beaches } = useBeach();

  const { data: entries, isLoading, error } = useQuery({
    queryKey: ["raidLogs"],
    queryFn: async () => {
      const res = await fetch("/api/raid-logs");
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const handleBeachClick = (beachName: string) => {
    // Handle beach click if needed, maybe redirect to map or raid page with filters
    console.log("Beach clicked:", beachName);
  };

  return (
    <div className="bg-[var(--color-bg-secondary)] min-h-[calc(100vh-72px)] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black font-primary text-[var(--color-text-primary)] uppercase tracking-tighter">
            Surf Logs
          </h1>
          <p className="text-gray-600 font-primary">
            Recent surf sessions logged by the community
          </p>
        </div>

        <div id="raid-logs-container" className="bg-white rounded-[2rem] border border-[var(--color-border-tan)] shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <LoadingIndicator />
              <p className="text-gray-600 font-primary mt-4">Loading surf logs...</p>
            </div>
          ) : error ? (
            <div className="p-8">
              <EmptyState message="Failed to load surf logs. Please try again later." />
            </div>
          ) : entries && entries.length > 0 ? (
            <RaidLogTable
              entries={entries}
              onBeachClick={handleBeachClick}
              isSubscribed={!!session?.user?.isSubscribed}
              session={session}
            />
          ) : (
            <div className="p-8">
              <EmptyState message="No surf logs found." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
