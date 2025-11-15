"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useBeaches } from "@/app/hooks/useBeaches";
import { FilterConfig, LogEntry } from "@/app/types/raidlogs";
import { Beach as BeachType } from "@/app/types/beaches";
import { RaidLogFilter } from "@/app/components/raid-logs/RaidLogFilter";
import { RaidLogForm } from "@/app/components/raid-logs/RaidLogForm";
import ActiveFilterBadges from "@/app/components/ActiveFiltersBadges";
import { toast } from "sonner";
import { handleSignIn } from "@/app/lib/auth-utils";
import BeachDetailsModal from "@/app/components/BeachDetailsModal";
import { useRouter } from "next/navigation";
import { useRaidLogFilters } from "@/app/hooks/useRaidLogsFilters";
import { Header } from "./RaidLogHeader";
import RaidLogTable from "./RaidLogTable";
import { useRaidLogs } from "@/app/hooks/useRaidLogs";
import { RandomLoader } from "../ui/random-loader";

// Define the RaidLogsResponse interface
interface RaidLogsResponse {
  entries: LogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface RaidLogsComponentProps {
  userId?: string;
  initialFilters?: Partial<FilterConfig>;
}

export function RaidLogsComponent({
  userId,
  initialFilters,
}: RaidLogsComponentProps) {
  const { filters, updateFilters, resetFilters } = useRaidLogFilters({
    initialFilters,
  });

  // State hooks
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBeach, setSelectedBeach] = useState<BeachType | null>(null);

  // Data fetching hooks
  const { data: session } = useSession();
  const { data: beaches, isLoading: isBeachesLoading } = useBeaches();

  // Replace the direct useQuery with useRaidLogs
  const {
    data: raidLogsData,
    isLoading: isLogsLoading,
    error,
  } = useRaidLogs(filters, filters.isPrivate, userId) as {
    data: RaidLogsResponse | undefined;
    isLoading: boolean;
    error: Error | null;
  };

  const router = useRouter();

  // Callbacks
  const handleFilterChange = useCallback(
    (newFilters: Partial<FilterConfig>) => {
      const updatedFilters = { ...newFilters };
      if (updatedFilters.beaches) {
        updatedFilters.beaches = updatedFilters.beaches.map((beach) =>
          typeof beach === "string" ? beach : beach.id
        );
      }
      updateFilters(updatedFilters);
    },
    [updateFilters]
  );

  const handlePrivateToggle = useCallback(() => {
    if (!session?.user) {
      toast.error("Please sign in to view private logs", {
        action: {
          label: "Sign In",
          onClick: () => handleSignIn(window.location.pathname),
        },
      });
      return;
    }
    updateFilters({ isPrivate: !filters.isPrivate });
  }, [session, filters.isPrivate, updateFilters]);

  const handleBeachClick = useCallback(
    (beachId: string) => {
      const beach = beaches?.find((b: BeachType) => b.id === beachId);
      if (beach) setSelectedBeach(beach);
    },
    [beaches]
  );

  return (
    <div className="bg-[var(--color-bg-secondary)] p-3 sm:p-4 md:p-6 lg:p-9 font-primary relative">
      <div className="max-w-[1800px] mx-auto px-0 md:px-4">
        {(isBeachesLoading || isLogsLoading) && (
          <RandomLoader isLoading={isBeachesLoading || isLogsLoading} />
        )}

        {error && !isLogsLoading && (
          <div className="text-red-500">
            Error loading data: {(error as Error).message}
          </div>
        )}

        {!isBeachesLoading && !isLogsLoading && !error && raidLogsData && (
          <>
            <Header
              isPrivate={filters.isPrivate}
              onPrivateToggle={handlePrivateToggle}
              onFilterOpen={() => setIsFilterOpen(true)}
              onModalOpen={() => setIsModalOpen(true)}
              session={session}
            />

            <ActiveFilterBadges
              filters={filters}
              onFilterChange={handleFilterChange}
            />

            {/* Add pagination info if needed */}
            <div className="text-sm text-gray-500 mb-4">
              {raidLogsData.totalPages > 1 &&
                ` (Page ${raidLogsData.page} of ${raidLogsData.totalPages})`}
            </div>

            {!raidLogsData.entries.length ? (
              <div className="text-center py-8 md:py-12">
                <p className="text-gray-500">No matching sessions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <RaidLogTable
                  entries={raidLogsData.entries}
                  isSubscribed={false}
                  isLoading={isLogsLoading}
                  showPrivateOnly={filters.isPrivate}
                  onBeachClick={handleBeachClick}
                />
              </div>
            )}

            <RaidLogFilter
              selectedRegionIds={filters.regions}
              selectedBeachIds={filters.beaches as string[]}
              selectedMinRating={filters.minRating}
              onFilterChange={handleFilterChange}
              onReset={resetFilters}
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
            />

            <RaidLogForm
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
            />

            {selectedBeach && (
              <BeachDetailsModal
                beach={selectedBeach}
                isOpen={true}
                onClose={() => setSelectedBeach(null)}
                isSubscribed={!!session?.user?.isSubscribed}
                onSubscribe={() => router.push("/pricing")}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
