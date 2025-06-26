"use client";

import { Suspense } from "react";
import { useBeachContext } from "@/app/context/BeachContext";
import { useBeachData } from "@/app/hooks/useBeachData";

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
  const { filters, isSidebarOpen, setSidebarOpen } = useBeachContext();
  const {
    beaches,
    beachScores,
    forecastData,
    isLoading,
    hasNextPage,
    loadMore,
  } = useBeachData();

  // First filter by search query
  const filteredBeaches = beaches.filter((beach) =>
    beach.name.toLowerCase().includes(filters.searchQuery.toLowerCase())
  );

  // Then sort by score
  const sortedBeaches = filteredBeaches.sort((a, b) => {
    const scoreA = beachScores[a.id]?.score ?? 0;
    const scoreB = beachScores[b.id]?.score ?? 0;
    return scoreB - scoreA; // Sort in descending order (highest score first)
  });

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
              onToggleFilters={(show) => setSidebarOpen(show)}
            />

            <div className="grid grid-cols-1 gap-[16px] relative">
              {!filters.regionId ? (
                <EmptyState message="Select a region to view beaches" />
              ) : isLoading && beaches.length === 0 ? (
                <LoadingIndicator />
              ) : beaches.length === 0 ? (
                <EmptyState message="No beaches found in this region" />
              ) : sortedBeaches.length === 0 ? (
                <EmptyState message="No beaches match your current filters" />
              ) : (
                <>
                  {isLoading && (
                    <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
                      <LoadingIndicator />
                    </div>
                  )}
                  <div className={isLoading ? "opacity-50" : ""}>
                    {sortedBeaches.map((beach) => (
                      <BeachCard
                        key={beach.id}
                        beach={beach}
                        score={beachScores[beach.id]?.score ?? 0}
                        forecastData={forecastData}
                        isLoading={isLoading}
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
      />

      <StickyForecastWidget />
    </div>
  );
}
