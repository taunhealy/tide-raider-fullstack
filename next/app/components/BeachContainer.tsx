"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import { useBeach } from "@/app/context/BeachContext";
import { useFilteredBeaches } from "@/app/hooks/useFilteredBeaches";
import { usePagination } from "@/app/hooks/usePagination";
import {
  calculateRegionScores,
  getSortedBeachesByScore,
} from "@/app/lib/scoreUtils";

// Components
import StickyForecastWidget from "./StickyForecastWidget";
import RightSidebar from "./raid/RightSidebar";
import LeftSidebar from "./raid/LeftSidebar";
import BeachCard from "@/app/components/BeachCard";
import FilterSidebar from "@/app/components/filters/FiltersSidebar";
import BeachHeaderControls from "@/app/components/raid/BeachHeaderControls";

// Constants
const ITEMS_PER_PAGE = 18;
const LAST_REGION_KEY = "lastVisitedRegion";
const LAST_REGION_ID_KEY = "lastVisitedRegionId";

// Loading components
function BeachListViewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-12 bg-gray-200 rounded animate-pulse" />
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}

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
    beaches,
    setBeaches,
    beachScores,
    setBeachScores,
    setTodayGoodBeaches,
    currentPage,
    setForecastData,
    setLoadingState,
  } = useBeach();

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

  const { data: beachData } = useQuery({
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
        `/api/beach-ratings?date=${today}${regionParam}`
      );
      if (!response.ok) return [];
      return response.json().then((data) => data.ratings || []);
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
      fetch(`/api/ads?regionId=${filters.location.regionId}`).then((res) =>
        res.json()
      ),
    enabled: !!filters.location.regionId,
    staleTime: 1000 * 60 * 5,
  });

  // Filtered beaches
  const filteredBeaches = useFilteredBeaches();

  // Sort beaches by score - updated to use getSortedBeachesByScore
  const sortedBeaches = useMemo(() => {
    if (
      !filteredBeaches ||
      !beachScores ||
      Object.keys(beachScores).length === 0
    ) {
      return [];
    }
    return getSortedBeachesByScore(filteredBeaches, beachScores);
  }, [filteredBeaches, beachScores]);

  // Pagination
  const { currentItems } = usePagination(
    sortedBeaches,
    currentPage,
    ITEMS_PER_PAGE
  );

  // Calculate scores when we have both beaches and forecast data
  useEffect(() => {
    if (beaches?.length && forecastData) {
      const scores = calculateRegionScores(
        beaches,
        filters.location.region || null,
        forecastData
      );
      console.log("Beach scores before setting:", {
        scores,
        sampleBeach: beaches[0].name,
        sampleScore: scores[beaches[0].id],
      });
      setBeachScores(scores);
    }
  }, [beaches, forecastData, filters.location.region, setBeachScores]);

  // Effects
  useEffect(() => {
    if (forecastData) setForecastData(forecastData);
  }, [forecastData, setForecastData]);

  useEffect(() => {
    if (beachData) setBeaches(beachData);
  }, [beachData, setBeaches]);

  useEffect(() => {
    if (todayRatings) {
      const goodBeaches = todayRatings
        .filter((rating: TodayRating) => rating.score >= 4)
        .map((rating: TodayRating) => ({
          beachId: rating.beachId,
          region: rating.region,
          score: rating.score,
        }));
      setTodayGoodBeaches(goodBeaches);
    }
  }, [todayRatings, setTodayGoodBeaches]);

  useEffect(() => {
    setLoadingState("forecast", isForecastLoading);
  }, [isForecastLoading, setLoadingState]);

  // Initial region setup from URL or localStorage
  useEffect(() => {
    const regionFromUrl = searchParams.get("region");
    const regionIdFromUrl = searchParams.get("regionId");

    if (regionFromUrl && regionIdFromUrl) {
      setFilters({
        ...filters,
        location: {
          ...filters.location,
          region: regionFromUrl,
          regionId: regionIdFromUrl,
        },
      });
    } else {
      const lastRegion = localStorage.getItem(LAST_REGION_KEY);
      const lastRegionId = localStorage.getItem(LAST_REGION_ID_KEY);

      if (lastRegion && lastRegionId && !filters.location.regionId) {
        setFilters({
          ...filters,
          location: {
            ...filters.location,
            region: lastRegion,
            regionId: lastRegionId,
          },
        });
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
            <Suspense fallback={<BeachListViewSkeleton />}>
              <div className="flex flex-col gap-5">
                <BeachHeaderControls
                  showFilters={showFilters}
                  setShowFilters={setShowFilters}
                  regions={allRegions}
                />
                <div className="grid grid-cols-1 gap-[16px]">
                  {currentItems.map((beach, index) => (
                    <BeachCard key={beach.id} beachId={beach.id} />
                  ))}
                </div>
              </div>
            </Suspense>
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
