"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";
import { useFilteredBeaches } from "@/app/hooks/useFilteredBeaches";
import { useQueryClient } from "@tanstack/react-query";

// Components
import StickyForecastWidget from "./StickyForecastWidget";
import RightSidebar from "./raid/RightSidebar";
import LeftSidebar from "./raid/LeftSidebar";
import BeachCard from "./BeachCard";
import BeachHeaderControls from "./raid/BeachHeaderControls";
import SidebarSkeleton from "./SidebarSkeleton";
import LoadingIndicator from "./LoadingIndicator";
import EmptyState from "./EmptyState";
import BeachCardSkeleton from "./skeletons/BeachCardSkeleton";

import type { Beach } from "@/app/types/beaches";

// Add this helper function at the top of the file
const getBeachForecastData = (
  beach: Beach,
  beachScores: Record<string, any>
) => {
  const score = beachScores[beach.id]?.score ?? 0;

  // Extract forecast data or return null if unavailable
  const conditions =
    beachScores[beach.id]?.beach?.beachDailyScores?.[0]?.conditions;
  const date = beachScores[beach.id]?.beach?.beachDailyScores?.[0]?.date;

  const forecastData = conditions
    ? {
        id: beach.id,
        regionId: beach.regionId,
        date: date ? new Date(date) : new Date(),
        ...conditions,
      }
    : null;

  return { score, forecastData };
};

export default function BeachContainer() {
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
    // Consider data ready if:
    // 1. We have beaches AND
    // 2. Either we have at least one valid score OR loading has completed
    const hasBeaches = beaches && beaches.length > 0;
    const hasAnyValidScores = beaches?.some(
      (beach) => beachScores[beach.id]?.score !== undefined
    );

    setDataReady(hasBeaches && (hasAnyValidScores || !isLoading));
  }, [beaches, beachScores, isLoading]);

  const handleRegionSelect = (regionId: string) => {
    updateFilter("regionId", regionId);
  };

  const sortedBeaches = useMemo(() => {
    return (
      beaches?.sort((a, b) => {
        const scoreA = beachScores[a.id]?.score ?? 0;
        const scoreB = beachScores[b.id]?.score ?? 0;
        return scoreB - scoreA; // Sort descending (highest score first)
      }) ?? []
    );
  }, [beaches, beachScores]);

  return (
    <div className="bg-[var(--color-bg-secondary)] p-4 sm:p-6 mx-auto relative min-h-[calc(100vh-72px)] flex flex-col font-primary">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px]">
        <Suspense fallback={<SidebarSkeleton />}>
          <LeftSidebar />
        </Suspense>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px] flex-1 overflow-hidden">
          <main className="min-w-0 overflow-y-auto">
            <BeachHeaderControls
              onSearch={(value) => updateFilter("searchQuery", value)}
              onRegionSelect={handleRegionSelect}
              currentRegion={filters.regionId}
              beaches={beaches}
            />

            <div className="grid grid-cols-1 gap-5 relative">
              {!filters.regionId ? (
                <EmptyState message="Select a region to view beaches" />
              ) : !dataReady ? (
                <div className="space-y-4 mt-4">
                  <LoadingIndicator />
                  <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                      <BeachCardSkeleton key={`skeleton-${index}`} />
                    ))}
                  </div>
                </div>
              ) : sortedBeaches.length === 0 ? (
                <EmptyState message="No beaches found in this region" />
              ) : (
                <>
                  <div>
                    {sortedBeaches.map((beach) => {
                      const { score, forecastData } = getBeachForecastData(
                        beach,
                        beachScores
                      );
                      return (
                        <BeachCard
                          key={beach.id}
                          beach={beach}
                          score={score}
                          forecastData={forecastData}
                          isLoading={!beachScores[beach.id]?.score}
                        />
                      );
                    })}
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

      <StickyForecastWidget />
    </div>
  );
}
