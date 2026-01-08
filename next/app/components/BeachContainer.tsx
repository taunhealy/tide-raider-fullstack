"use client";

import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";
import { useFilteredBeaches } from "@/app/hooks/useFilteredBeaches";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
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
  const { filters, updateFilter, selectRegion } = useBeachFilters();
  const { data, isLoading, isFetching } = useFilteredBeaches({
    initialData,
    enabled: true,
  });
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const hasAutoRedirected = useRef(false);

  // Auto-redirect to last selected region if no regionId in URL
  const { data: recentSearches } = useQuery({
    queryKey: ["recentSearches"],
    queryFn: async () => {
      const res = await fetch("/api/user-searches?limit=1");
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60 * 5,
    enabled: !filters.regionId && !hasAutoRedirected.current, // Only fetch if no regionId and haven't redirected yet
  });

  // Auto-redirect to most recent region if no regionId in URL
  useEffect(() => {
    // Only redirect if:
    // 1. No regionId in URL
    // 2. We have recent searches
    // 3. We haven't already redirected
    // 4. We're on the /raid page
    if (
      !filters.regionId &&
      !hasAutoRedirected.current &&
      pathname === "/raid"
    ) {
      // If we have recent searches, use the most recent one
      if (recentSearches && recentSearches.length > 0) {
        const mostRecentSearch = recentSearches[0];
        if (mostRecentSearch?.region?.id) {
          // Construct region object from recent search data
          const selectedRegion = {
            id: mostRecentSearch.region.id,
            regionId: mostRecentSearch.region.id,
            name: mostRecentSearch.region.name,
            countryId: mostRecentSearch.region.country?.id || "",
            country: mostRecentSearch.region.country
              ? {
                  id: mostRecentSearch.region.country.id || "",
                  name: mostRecentSearch.region.country.name || "",
                  continentId: mostRecentSearch.region.country.continentId || "",
                }
              : undefined,
            continent: mostRecentSearch.region.continent || "",
          };

          // Use selectRegion to update URL properly
          selectRegion(selectedRegion);
          hasAutoRedirected.current = true;
        }
      } else if (recentSearches !== undefined) {
        // No recent searches - default to Western Cape for first-time visitors
        const defaultRegion = {
          id: "western-cape",
          regionId: "western-cape",
          name: "Western Cape",
          countryId: "za",
          country: {
            id: "za",
            name: "South Africa",
            continentId: "AF",
          },
          continent: "Africa",
        };
        
        selectRegion(defaultRegion);
        hasAutoRedirected.current = true;
      }
    }
  }, [filters.regionId, recentSearches, selectRegion, pathname]);

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

  // Generate pagination numbers
  const paginationRange = useMemo(() => {
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    
    if (currentPage >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  }, [totalPages, currentPage]);

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

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px] flex-1 overflow-hidden">
          <main className="min-w-0 overflow-y-auto overflow-x-visible">
            <BeachHeaderControls
              onSearch={(value) => updateFilter("searchQuery", value)}
              onRegionSelect={handleRegionSelect}
              currentRegion={filters.regionId || ""}
              beaches={beaches}
            />

            {/* Subtle background refresh indicator */}
            {isFetching && data && !isLoading && (
              <div className="text-xs text-gray-500 text-center py-2 font-primary">
                Refreshing data...
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 relative mt-5">
              {!filters.regionId ? (
                <EmptyState message="Select a region to view beaches" />
              ) : isLoading && !data ? (
                // Only show loading spinner when there's no data at all
                <div className="flex flex-col items-center justify-center py-12">
                  <LoadingIndicator />
                  <p className="text-gray-600 font-primary mt-4">
                    Loading surf breaks and forecast data...
                  </p>
                </div>
              ) : sortedBeaches.length === 0 ? (
                <EmptyState message="No breaks found in this region, change filters?" />
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
                        isLoading={!hasScore && isLoading && !data} // Only show loading if no score AND no data at all
                      />
                    );
                  })}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-8 mb-4">
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

                      {/* Mobile Page Indicator */}
                      <span className="text-sm font-medium text-gray-600 sm:hidden px-2">
                        Page {currentPage} of {totalPages}
                      </span>

                      {/* Desktop Page Numbers */}
                      <div className="hidden sm:flex items-center gap-1">
                        {paginationRange.map((page, index) => {
                          if (page === "...") {
                            return (
                              <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                                ...
                              </span>
                            );
                          }

                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(Number(page))}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          );
                        })}
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
