"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";
import { useFilteredBeaches } from "@/app/hooks/useFilteredBeaches";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/app/components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

import type { Beach, BeachInitialData } from "@/app/types/beaches";

import { LocationFilter } from "../types/filters";

// Remove the getBeachForecastData helper function

interface BeachContainerProps {
  initialData: BeachInitialData | null;
}

export default function BeachContainer({ initialData }: BeachContainerProps) {
  const { filters, updateFilter } = useBeachFilters();
  const { data, isLoading } = useFilteredBeaches({
    initialData,
    enabled: true,
  });
  const queryClient = useQueryClient();

  // Track region searches when regionId changes
  const { mutate: trackSearch } = useMutation({
    mutationFn: async (regionId: string) => {
      const res = await fetch("/api/user-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regionId }),
      });
      if (!res.ok) throw new Error("Failed to track search");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate recent searches to refresh the list
      queryClient.invalidateQueries({ queryKey: ["recentSearches"] });
    },
  });

  // Track search when regionId changes
  useEffect(() => {
    if (filters.regionId) {
      trackSearch(filters.regionId.toLowerCase());
    }
  }, [filters.regionId, trackSearch]);

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const beaches = data?.beaches || [];
  const beachScores = data?.scores || {};
  const forecast = data?.forecast ?? null; // Regional forecast
  const totalCount = data?.totalCount || 0; // Added totalCount

  const handleRegionSelect = (regionId: LocationFilter["regionId"]) => {
    updateFilter("regionId", regionId || "");
    // Reset to first page when region changes
    setCurrentPage(1);
    // Invalidate the query cache to force refetch
    queryClient.invalidateQueries({ queryKey: ["filteredBeaches"] });
  };

  const sortedBeaches = useMemo(() => {
    return (
      beaches?.sort((a: Beach, b: Beach) => {
        const scoreA = beachScores[a.id]?.score ?? 0;
        const scoreB = beachScores[b.id]?.score ?? 0;
        const hasScoreA = a.id in beachScores;
        const hasScoreB = b.id in beachScores;

        // Beaches with scores come before beaches without scores
        if (hasScoreA && !hasScoreB) return -1;
        if (!hasScoreA && hasScoreB) return 1;

        // Both have scores or both don't - sort by score descending
        return scoreB - scoreA;
      }) ?? []
    );
  }, [beaches, beachScores]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedBeaches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBeaches = sortedBeaches.slice(startIndex, endIndex);

  // Reset to first page if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of beach list
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (initialData) {
      console.log("Initial data received:", {
        beachCount: initialData.beaches?.length || 0,
        hasScores: Boolean(initialData.scores),
        hasForecast: Boolean(initialData.forecast),
        forecastDetails: initialData.forecast,
      });
    }
  }, [initialData]);

  return (
    <div className="bg-[var(--color-bg-secondary)] p-4 sm:p-6 lg:p-8 xl:p-12 mx-auto relative min-h-[calc(100vh-72px)] flex flex-col font-primary">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px] max-w-7xl mx-auto w-full">
        <Suspense fallback={<SidebarSkeleton />}>
          <LeftSidebar />
        </Suspense>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px] flex-1 overflow-hidden">
          <main className="min-w-0 overflow-y-auto">
            <BeachHeaderControls
              onSearch={(value) => updateFilter("searchQuery", value)}
              onRegionSelect={handleRegionSelect}
              currentRegion={filters.regionId || ""}
              beaches={beaches}
            />

            <div className="grid grid-cols-1 gap-5 relative mt-5">
              {!filters.regionId ? (
                <EmptyState message="Select a region to view beaches" />
              ) : sortedBeaches.length === 0 ? (
                <EmptyState message="No beaches found in this region" />
              ) : (
                <div>
                  {currentBeaches.map((beach: Beach) => {
                    const score = beachScores[beach.id]?.score ?? 0;
                    // Directly use the regional forecast
                    const beachForecastData = forecast; // Renamed to avoid confusion

                    // Check if score actually exists in the scores object, not just if it's 0
                    const hasScore = beach.id in beachScores;
                    const scoreValue = hasScore
                      ? score !== null && score !== undefined
                        ? Number(score)
                        : null
                      : null;

                    return (
                      <BeachCard
                        key={beach.id}
                        beach={beach}
                        score={scoreValue} // Pass null if no score exists, or the numeric score
                        forecastData={beachForecastData} // Pass the regional forecast
                        isLoading={!hasScore && isLoading} // Only show loading if score doesn't exist
                      />
                    );
                  })}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8 mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* Page Info */}
                  {totalPages > 1 && (
                    <div className="text-center text-sm text-gray-600 mb-4">
                      Showing {startIndex + 1}-
                      {Math.min(endIndex, sortedBeaches.length)} of{" "}
                      {sortedBeaches.length} beaches
                    </div>
                  )}
                </div>
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
