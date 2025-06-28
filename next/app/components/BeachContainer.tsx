"use client";

import { Suspense, useState, useEffect } from "react";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";
import { useFilteredBeaches } from "@/app/hooks/useFilteredBeaches";
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
import BeachCardSkeleton from "./skeletons/BeachCardSkeleton";

import type { Beach } from "@/app/types/beaches";

export default function BeachContainer() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { filters, updateFilter } = useBeachFilters();

  // Use the new hook for server-side filtering
  const { beaches, beachScores, isLoading, hasNextPage, loadMore } =
    useFilteredBeaches();
  const queryClient = useQueryClient();
  const [dataReady, setDataReady] = useState(false);

  // Add more detailed debug logging
  console.log("Detailed render state:", {
    isLoading,
    dataReady,
    beachScoresLength: Object.keys(beachScores).length,
    hasBeaches: beaches?.length > 0,
    beachScoresExample: beaches?.[0]?.id ? beachScores[beaches[0].id] : null,
    firstBeachId: beaches?.[0]?.id,
  });

  // Simplify the loading state logic
  useEffect(() => {
    // Check if we have at least one valid score
    const hasValidScores = beaches?.some(
      (beach) => typeof beachScores[beach.id]?.score === "number"
    );

    setDataReady(!isLoading && hasValidScores);
  }, [beaches, isLoading, beachScores]);

  const handleRegionSelect = (regionId: string) => {
    updateFilter("regionId", regionId);
  };

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
              ) : !dataReady ? (
                <>
                  <LoadingIndicator />
                  {beaches?.length > 0 &&
                    beaches
                      .slice(0, 5)
                      .map((_, index) => (
                        <BeachCardSkeleton key={`skeleton-${index}`} />
                      ))}
                </>
              ) : beaches.length === 0 ? (
                <EmptyState message="No beaches found in this region" />
              ) : (
                <>
                  <div>
                    {beaches.map((beach) => (
                      <BeachCard
                        key={beach.id}
                        beach={beach}
                        score={beachScores[beach.id]?.score ?? 0}
                        forecastData={
                          beachScores[beach.id]?.beach?.beachDailyScores?.[0]
                            ?.conditions
                            ? {
                                id: beach.id,
                                regionId: beach.regionId,
                                date: new Date(
                                  beachScores[
                                    beach.id
                                  ]?.beach?.beachDailyScores[0].date
                                ),
                                ...beachScores[beach.id]?.beach
                                  ?.beachDailyScores[0].conditions,
                              }
                            : null
                        }
                        isLoading={!beachScores[beach.id]?.score}
                      />
                    ))}
                  </div>

                  {hasNextPage && (
                    <button
                      onClick={() => loadMore()}
                      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-primary"
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
      />

      <StickyForecastWidget />
    </div>
  );
}
