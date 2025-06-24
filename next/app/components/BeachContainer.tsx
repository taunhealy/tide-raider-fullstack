"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import { useBeach } from "@/app/context/BeachContext";
import { useFilteredBeaches } from "@/app/hooks/useFilteredBeaches";
import { usePagination } from "@/app/hooks/usePagination";
import { useRaidFilters } from "@/app/hooks/useRaidFilters";
import { LAST_REGION_KEY, LAST_REGION_ID_KEY } from "@/app/constants/storage";

// Components
import StickyForecastWidget from "./StickyForecastWidget";
import RightSidebar from "./raid/RightSidebar";
import LeftSidebar from "./raid/LeftSidebar";
import BeachCard from "@/app/components/BeachCard";
import FilterSidebar from "@/app/components/filters/FiltersSidebar";
import BeachHeaderControls from "@/app/components/raid/BeachHeaderControls";

// Constants
const ITEMS_PER_PAGE = 18;

interface TodayRating {
  beachId: string;
  region: string;
  score: number;
}

export default function BeachContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // Context
  const {
    filters,
    setFilters,
    setBeaches,
    currentPage,
    setForecastData,
    setLoadingState,
  } = useBeach();
  const { getInitialFilters } = useRaidFilters();

  // Queries
  const { data: forecastData, isLoading: isForecastLoading } = useQuery({
    queryKey: ["forecast", filters.location.regionId],
    queryFn: async () => {
      const response = await fetch(
        `/api/surf-conditions?regionId=${filters.location.regionId}`
      );
      if (!response.ok) throw new Error("Failed to fetch forecast data");
      return response.json();
    },
    enabled: !!filters.location.regionId,
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: beachData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["beaches", filters.location.regionId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.location.regionId)
        params.append("regionId", filters.location.regionId);
      params.append("sortField", "score");
      params.append("sortDirection", "desc");

      const response = await fetch(`/api/beaches?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch beaches");
      return response.json();
    },
    enabled: !!filters.location.regionId,
    staleTime: 1000 * 60 * 5,
  });

  const { data: todayRatings } = useQuery({
    queryKey: ["today-ratings", filters.location.region],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const regionParam = filters.location.region
        ? `&region=${encodeURIComponent(filters.location.region)}`
        : "";
      const response = await fetch(
        `/api/beach-scores?date=${today}${regionParam}`
      );
      if (!response.ok) return [];
      return response.json().then((data) => data.scores || []);
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: allRegions = [] } = useQuery({
    queryKey: ["all-regions"],
    queryFn: () => fetch("/api/regions").then((res) => res.json()),
    staleTime: 1000 * 60 * 30,
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: () => fetch("/api/blog-posts").then((res) => res.json()),
    staleTime: 1000 * 60 * 5,
  });

  const { data: ads = [] } = useQuery({
    queryKey: ["ads", filters.location.regionId],
    queryFn: () =>
      fetch(`/api/advertising/ads?regionId=${filters.location.regionId}`).then(
        (res) => res.json()
      ),
    enabled: !!filters.location.regionId,
    staleTime: 1000 * 60 * 5,
  });

  // Filtered beaches
  const filteredBeaches = useFilteredBeaches();

  // Pagination
  const { currentItems } = usePagination(
    filteredBeaches,
    currentPage,
    ITEMS_PER_PAGE
  );

  // Effects
  useEffect(() => {
    if (forecastData) setForecastData(forecastData);
  }, [forecastData, setForecastData]);

  useEffect(() => {
    console.log("Current filters:", filters);
    console.log("Beach data:", beachData);
    console.log("Filtered beaches:", filteredBeaches);
    if (beachData) setBeaches(beachData);
  }, [beachData, setBeaches, filters]);

  useEffect(() => {
    setLoadingState("forecast", isForecastLoading);
  }, [isForecastLoading, setLoadingState]);

  // Handle initial filters setup
  useEffect(() => {
    const regionIdFromUrl = searchParams.get("regionId");

    if (regionIdFromUrl) {
      // URL params take precedence
      setFilters(
        getInitialFilters({ regionId: regionIdFromUrl }) // Just pass regionId
      );
    } else {
      // Try localStorage
      const lastRegionId = localStorage.getItem(LAST_REGION_ID_KEY);

      if (lastRegionId && !filters.location.regionId) {
        setFilters(getInitialFilters({ regionId: lastRegionId }));
      } else {
        // Use default filters
        setFilters(getInitialFilters({}));
      }
    }
  }, []);

  // Save region to localStorage when it changes
  useEffect(() => {
    if (filters.location.region && filters.location.regionId) {
      localStorage.setItem(LAST_REGION_KEY, filters.location.region);
      localStorage.setItem(LAST_REGION_ID_KEY, filters.location.regionId);
    }
  }, [filters.location.region, filters.location.regionId]);

  // Only show error state
  if (error) return <div>Error loading beaches</div>;

  return (
    <div className="bg-[var(--color-bg-secondary)] p-4 sm:p-6 mx-auto relative min-h-[calc(100vh-72px)] flex flex-col">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px]">
        <Suspense
          fallback={
            <div className="w-full h-96 bg-gray-200 rounded animate-pulse" />
          }
        >
          <LeftSidebar blogPosts={blogPosts} regions={allRegions} />
        </Suspense>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px] flex-1 overflow-hidden">
          <main className="min-w-0 overflow-y-auto">
            <div className="flex flex-col gap-5">
              <BeachHeaderControls
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                regions={allRegions}
              />

              <div className="grid grid-cols-1 gap-[16px] relative">
                {isLoading && (
                  <div className="absolute inset-0 bg-white/50 z-10 flex items-start justify-end p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-bg-tertiary)]"></div>
                  </div>
                )}

                {!isLoading && !currentItems.length ? (
                  <div>No beaches found</div>
                ) : (
                  currentItems.map((beach, index) => (
                    <BeachCard key={beach.id} beachId={beach.id} />
                  ))
                )}
              </div>
            </div>
          </main>

          <Suspense
            fallback={
              <div className="w-full h-96 bg-gray-200 rounded animate-pulse" />
            }
          >
            <RightSidebar
              availableAds={ads}
              selectedRegion={filters.location.region}
            />
          </Suspense>
        </div>
      </div>

      <FilterSidebar
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
      />
      <Suspense fallback={null}>
        <StickyForecastWidget />
      </Suspense>
    </div>
  );
}
