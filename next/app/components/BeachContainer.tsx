"use client";

import { Suspense, useMemo, useCallback, useState, useEffect } from "react";
import { useBeachData } from "@/app/hooks/useBeachData";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";
import { useQueryClient } from "@tanstack/react-query";

// Components
import StickyForecastWidget from "./StickyForecastWidget";
import RightSidebar from "./raid/RightSidebar";
import LeftSidebar from "./raid/LeftSidebar";
import BeachCard from "./BeachCard";
import FilterSidebar from "./filters/FiltersSidebar";
import BeachHeaderControls from "./raid/BeachHeaderControls";
import SidebarSkeleton from "./SidebarSkeleton";
import LoadingIndicator from "./LoadingIndicator";
import EmptyState from "./EmptyState";

export default function BeachContainer() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { filters, updateFilter } = useBeachFilters();
  const { beaches, beachScores, isLoading, hasNextPage, loadMore } =
    useBeachData();
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log(
      "Beach scores structure:",
      Object.keys(beachScores).length > 0
        ? Object.entries(beachScores)
            .slice(0, 1)
            .map(([id, data]) => ({
              id,
              keys: Object.keys(data),
              data: JSON.stringify(data),
            }))
        : "No scores available"
    );
  }, [beachScores]);

  useEffect(() => {
    // If we have beaches but no scores, refetch after a delay
    if (beaches.length > 0 && Object.keys(beachScores).length === 0) {
      const timer = setTimeout(() => {
        // Force a refetch of the data
        queryClient.invalidateQueries({
          queryKey: ["beaches", filters.regionId, filters.searchQuery],
        });
      }, 2000); // 2 second delay

      return () => clearTimeout(timer);
    }
  }, [
    beaches,
    beachScores,
    filters.regionId,
    filters.searchQuery,
    queryClient,
  ]);

  const filteredBeaches = useMemo(() => {
    return beaches.filter((beach) => {
      if (filters.regionId && beach.regionId !== filters.regionId) return false;
      if (
        filters.waveTypes.length &&
        !filters.waveTypes.includes(beach.waveType)
      )
        return false;
      if (
        filters.difficulty.length &&
        !filters.difficulty.includes(beach.difficulty)
      )
        return false;
      if (filters.hasSharkAlert && !beach.hasSharkAlert) return false;
      return true;
    });
  }, [beaches, filters]);

  const handleRegionSelect = useCallback(
    (regionId: string) => {
      updateFilter("regionId", regionId);
    },
    [updateFilter]
  );

  return (
    <div className="bg-[var(--color-bg-secondary)] p-4 sm:p-6 mx-auto relative min-h-[calc(100vh-72px)] flex flex-col font-primary">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px]">
        <Suspense fallback={<SidebarSkeleton />}>
          <LeftSidebar />
        </Suspense>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px] flex-1 overflow-hidden">
          <main className="min-w-0 overflow-y-auto">
            <BeachHeaderControls
              showFilters={isSidebarOpen}
              onToggleFilters={setSidebarOpen}
              onSearch={(value) => updateFilter("searchQuery", value)}
              onRegionSelect={handleRegionSelect}
              currentRegion={filters.regionId}
              beaches={beaches}
            />

            <div className="grid grid-cols-1 gap-[16px] relative">
              {!filters.regionId ? (
                <EmptyState message="Select a region to view beaches" />
              ) : isLoading ? (
                <LoadingIndicator />
              ) : beaches.length === 0 ? (
                <EmptyState message="No beaches found in this region" />
              ) : filteredBeaches.length === 0 ? (
                <EmptyState message="No beaches match your current filters" />
              ) : (
                <>
                  {isLoading && (
                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                      <LoadingIndicator />
                    </div>
                  )}
                  <div className={isLoading ? "opacity-50" : ""}>
                    {filteredBeaches.map((beach) => (
                      <BeachCard
                        key={beach.id}
                        beach={beach}
                        score={beachScores[beach.id]?.score ?? 0}
                        forecastData={
                          isLoading
                            ? null
                            : beachScores[beach.id]?.beach
                                  ?.beachDailyScores?.[0]?.conditions
                              ? {
                                  id: beach.id,
                                  regionId: beach.regionId,
                                  date: new Date(
                                    beachScores[beach.id]?.beach
                                      ?.beachDailyScores?.[0]?.date ||
                                      new Date()
                                  ),
                                  ...beachScores[beach.id]?.beach
                                    ?.beachDailyScores[0].conditions,
                                }
                              : null
                        }
                      />
                    ))}
                  </div>
                  {hasNextPage && (
                    <button
                      onClick={() => loadMore()}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Load More Beaches
                    </button>
                  )}
                </>
              )}
            </div>
          </main>
          <RightSidebar />
        </div>
      </div>

      <FilterSidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onFilterUpdate={updateFilter}
        currentFilters={filters as any}
      />

      <StickyForecastWidget />
    </div>
  );
}
