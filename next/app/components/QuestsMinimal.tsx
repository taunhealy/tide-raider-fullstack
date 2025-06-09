"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/app/lib/utils";
import type { LogEntry } from "@/app/types/raidlogs";

export default function Quests() {
  const { data: logEntries, isLoading } = useQuery({
    queryKey: ["logEntries"],
    queryFn: async () => {
      const response = await fetch("/api/logbook");
      if (!response.ok) throw new Error("Failed to fetch log entries");
      return response.json();
    },
  });

  return (
    <div className="space-y-4">
      <h2 className={cn("text-xl font-semibold font-primary")}>Quests</h2>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {logEntries?.map((entry: LogEntry) => (
            <div key={entry.id} className="bg-white rounded-lg shadow-sm p-6">
              {/* Entry content remains the same */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
