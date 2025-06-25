"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useBeachContext } from "@/app/context/BeachContext";
import { usePagination } from "@/app/hooks/usePagination";
import { LAST_REGION_KEY, LAST_REGION_ID_KEY } from "@/app/constants/storage";
import { useBeachData } from "@/app/hooks/useBeachData";

// Components
import StickyForecastWidget from "@/app/components/StickyForecastWidget";
import RightSidebar from "@/app/components/raid/RightSidebar";
import LeftSidebar from "@/app/components/raid/LeftSidebar";
import BeachCard from "@/app/components/BeachCard";
import FilterSidebar from "@/app/components/filters/FiltersSidebar";
import BeachHeaderControls from "@/app/components/raid/BeachHeaderControls";
import SidebarSkeleton from "@/app/components/SidebarSkeleton";
import LoadingIndicator from "@/app/components/LoadingIndicator";
import EmptyState from "@/app/components/EmptyState";

// Constants
const ITEMS_PER_PAGE = 18;

export default function BeachContainer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get state from context
  const {
    filters,
    currentPage,
    isSidebarOpen,
    setSidebarOpen,
    setFilters,
    setLoadingState,
    filteredBeaches,
    setBeachScores,
  } = useBeachContext();

  // Use BeachData hook to fetch beaches and scores
  const { beaches, beachScores, forecastData, isLoading } = useBeachData();

  // Add these console logs to debug the data flow
  console.log("Debug Data:", {
    "All Beaches": beaches.length,
    "Filtered Beaches": filteredBeaches.length,
    "Current Region": filters.location.regionId,
    "Beach Scores": Object.keys(beachScores).length,
    "Raw Beaches": beaches,
    "Raw Filtered": filteredBeaches,
    "Forecast Data": forecastData,
    "Loading State": isLoading,
  });

  // Use pagination hook
  const { currentItems } = usePagination(
    filteredBeaches,
    currentPage,
    ITEMS_PER_PAGE
  );

  // Fetch additional data
  const { data: allRegions = [] } = useQuery({
    queryKey: ["all-regions"],
    queryFn: () => fetch("/api/regions").then((res) => res.json()),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: () => fetch("/api/blog-posts").then((res) => res.json()),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: ads = [] } = useQuery({
    queryKey: ["ads", filters.location.regionId],
    queryFn: () =>
      fetch(`/api/advertising/ads?regionId=${filters.location.regionId}`).then(
        (res) => res.json()
      ),
    enabled: !!filters.location.regionId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update beach scores in context when they change
  useEffect(() => {
    if (beachScores) {
      setBeachScores(beachScores);
    }
  }, [beachScores, setBeachScores]);

  // Update loading states
  useEffect(() => {
    setLoadingState("forecast", isLoading);
    setLoadingState("beaches", isLoading);
    setLoadingState("scores", isLoading);
  }, [isLoading, setLoadingState]);

  // Handle initial region setup from URL or localStorage
  useEffect(() => {
    const regionIdFromUrl = searchParams.get("regionId");

    if (regionIdFromUrl && regionIdFromUrl !== filters.location.regionId) {
      setFilters({
        ...filters,
        location: { ...filters.location, regionId: regionIdFromUrl },
      });
    } else if (!filters.location.regionId) {
      const lastRegionId = localStorage.getItem(LAST_REGION_ID_KEY);
      if (lastRegionId) {
        setFilters({
          ...filters,
          location: { ...filters.location, regionId: lastRegionId },
        });
      }
    }
  }, [searchParams, filters, setFilters]);

  // Persist region selection
  useEffect(() => {
    if (filters.location.region && filters.location.regionId) {
      localStorage.setItem(LAST_REGION_KEY, filters.location.region);
      localStorage.setItem(LAST_REGION_ID_KEY, filters.location.regionId);
    }
  }, [filters.location.region, filters.location.regionId]);

  // Modal handlers
  const handleOpenModal = (beachName: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("beach", beachName);
    router.push(`${pathname}?${params}`, { scroll: false });
  };

  const handleCloseModal = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("beach");
    router.replace(`${pathname}?${params}`, { scroll: false });
  };

  console.log("Beach Scores:", beachScores);
  console.log(
    "Current Items with Scores:",
    currentItems.map((beach) => ({
      id: beach.id,
      name: beach.name,
      score: beachScores[beach.id]?.score,
    }))
  );

  return (
    <div className="bg-[var(--color-bg-secondary)] p-4 sm:p-6 mx-auto relative min-h-[calc(100vh-72px)] flex flex-col font-primary">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px]">
        <Suspense fallback={<SidebarSkeleton />}>
          <LeftSidebar blogPosts={blogPosts} regions={allRegions} />
        </Suspense>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px] flex-1 overflow-hidden">
          <main className="min-w-0 overflow-y-auto">
            <BeachHeaderControls
              showFilters={isSidebarOpen}
              onToggleFilters={(show) => setSidebarOpen(show)}
              beaches={beaches}
              filters={filters}
              onFiltersChange={setFilters}
            />

            <div className="grid grid-cols-1 gap-[16px] relative">
              {!filters.location.regionId ? (
                <EmptyState message="Select a region to view beaches" />
              ) : isLoading && beaches.length === 0 ? (
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
                    {currentItems.map((beach) => {
                      console.log(`Preparing BeachCard for ${beach.name}:`, {
                        beachId: beach.id,
                        hasForecastData: !!forecastData,
                        hasScore: !!beachScores[beach.id],
                        score: beachScores[beach.id]?.score,
                        isLoading,
                      });

                      return (
                        <BeachCard
                          key={beach.id}
                          beach={beach}
                          score={beachScores[beach.id]?.score ?? 0}
                          forecastData={forecastData}
                          isLoading={isLoading}
                          onOpenModal={() => handleOpenModal(beach.name)}
                          onCloseModal={handleCloseModal}
                        />
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </main>

          <Suspense fallback={<SidebarSkeleton />}>
            <RightSidebar
              availableAds={ads}
              selectedRegion={filters.location.region}
              forecastData={forecastData}
              isLoading={isLoading}
            />
          </Suspense>
        </div>
      </div>

      <FilterSidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        filters={filters}
        onFilterChange={setFilters}
        beaches={beaches}
      />

      <Suspense fallback={null}>
        <StickyForecastWidget
          selectedRegion={filters.location.region}
          selectedRegionId={filters.location.regionId}
          forecastData={forecastData}
          isLoading={isLoading}
        />
      </Suspense>
    </div>
  );
}
