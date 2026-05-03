"use client";

import { useState, useCallback, useEffect } from "react";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { useBeaches } from "@/app/hooks/useBeaches";
import { FilterConfig, LogEntry } from "@/app/types/raidlogs";
import { Beach as BeachType } from "@/app/types/beaches";
import { RaidLogFilter } from "@/app/components/raid-logs/RaidLogFilter";
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
  session?: {
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      isSubscribed?: boolean;
      hasActiveTrial?: boolean;
    } | null;
  } | null;
}

export function RaidLogsComponent({
  userId,
  initialFilters,
  session: sessionProp,
}: RaidLogsComponentProps) {
  const { filters, updateFilters, resetFilters } = useRaidLogFilters({
    initialFilters,
  });

  // State hooks
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedBeach, setSelectedBeach] = useState<BeachType | null>(null);

  // Data fetching hooks
  // Use session from props (fetched at page level) as primary source
  // Fall back to hook if not provided (for backwards compatibility)
  const { data: sessionFromHook } = useBackendAuth();
  // Normalize session type to match Header component expectation
  const session = sessionProp
    ? { user: sessionProp.user || null }
    : sessionFromHook
      ? { user: sessionFromHook.user || null }
      : null;
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

  // Add timeout for loading states
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  useEffect(() => {
    if (isBeachesLoading || isLogsLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 15000); // 15 second timeout (reduced from 30)
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [isBeachesLoading, isLogsLoading]);

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
    <div id="raid-logs-container" className="min-h-0 py-4 font-primary relative pb-20">
      <div className="max-w-6xl mx-auto px-0 md:px-4">
        {(isBeachesLoading || isLogsLoading) && !loadingTimeout && (
          <RandomLoader isLoading={isBeachesLoading || isLogsLoading} />
        )}

        {(isBeachesLoading || isLogsLoading) && loadingTimeout && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">
              Loading is taking longer than expected.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[var(--color-tertiary)] text-white rounded"
            >
              Reload Page
            </button>
          </div>
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
              session={session}
            />

            <ActiveFilterBadges
              filters={filters}
              onFilterChange={handleFilterChange}
              beaches={beaches}
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
                  beaches={beaches || []}
                  isSubscribed={!!session?.user?.isSubscribed}
                  isLoading={isLogsLoading}
                  showPrivateOnly={filters.isPrivate}
                  onBeachClick={handleBeachClick}
                  session={session}
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
