"use client";

import { Suspense, useEffect, useMemo } from "react";
import type { Beach } from "@/app/types/beaches";
import type { BaseForecastData } from "@/app/types/forecast";
import StickyForecastWidget from "./StickyForecastWidget";
import {
  calculateRegionScores,
  getSortedBeachesByScore,
} from "@/app/lib/scoreUtils";

import RightSidebar from "./raid/RightSidebar";
import LeftSidebar from "./raid/LeftSidebar";
import { useQuery } from "@tanstack/react-query";
import { useSubscription } from "@/app/context/SubscriptionContext";
import { client } from "@/app/lib/sanity";
import { blogListingQuery } from "@/app/lib/queries";
import { useState } from "react";
import { useBeach } from "@/app/context/BeachContext";
import { useFilteredBeaches } from "@/app/hooks/useFilteredBeaches";
import { usePagination } from "@/app/hooks/usePagination";

import BeachCard from "@/app/components/BeachCard";
import FilterSidebar from "@/app/components/filters/FiltersSidebar";
import BeachHeaderControls from "@/app/components/raid/BeachHeaderControls";

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

function SidebarSkeleton() {
  return <div className="w-full h-96 bg-gray-200 rounded animate-pulse" />;
}

// Add a loading skeleton for beach cards
function BeachCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-[16px]">
      {[...Array(6)].map((_, index) => (
        <div
          key={index}
          className="bg-gray-100 rounded-lg h-[200px] animate-pulse"
        />
      ))}
    </div>
  );
}

// Move the fetch function outside component for reusability
const fetchRegionData = async (regionId: string) => {
  console.log("🌊 Fetching forecast data for region:", regionId);
  const response = await fetch(`/api/surf-conditions?regionId=${regionId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch forecast data: ${response.status}`);
  }
  const data = await response.json();
  return data as BaseForecastData;
};

const fetchBeaches = async (regionId?: string) => {
  try {
    const params = new URLSearchParams();
    if (regionId) {
      params.append("regionId", regionId);
    }
    params.append("sortField", "score");
    params.append("sortDirection", "desc");

    const response = await fetch(`/api/beaches?${params.toString()}`);

    if (!response.ok) {
      throw new Error("Failed to fetch beaches");
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error fetching beaches:", error);
    return [];
  }
};

// Fetch ads function
const fetchAdsForBeaches = async (
  beaches: Beach[],
  regionId: string | null
) => {
  if (!regionId || !beaches.length) return [];

  const batchSize = 5;
  const batches = [];

  for (let i = 0; i < beaches.length; i += batchSize) {
    const batch = beaches.slice(i, i + batchSize);
    batches.push(batch);
  }

  const allAds = [];
  for (const batch of batches) {
    const batchPromises = batch.map((beach) =>
      fetch(
        `/api/advertising/ads?beachId=${beach.id}&regionId=${regionId}`
      ).then((res) => res.json())
    );
    const batchResults = await Promise.all(batchPromises);
    allAds.push(...batchResults.flat());
  }

  return allAds;
};

// Fetch blog posts function
const fetchBlogPosts = async () => {
  const data = await client.fetch(blogListingQuery);
  return data.posts;
};

export default function BeachContainer() {
  const {
    filters,
    beaches,
    setBeaches,
    forecastData,
    setForecastData,
    setBeachScores,
    currentPage,
    beachScores,
    setTodayGoodBeaches,
    setLoadingState,
  } = useBeach();

  // Use the filtered beaches hook for the beach list
  const filteredBeaches = useFilteredBeaches();

  // Sort beaches by score
  const sortedBeaches = useMemo(() => {
    if (!filteredBeaches || !beachScores) return [];

    return [...filteredBeaches]
      .map((beach) => ({
        ...beach,
        score: beachScores[beach.id]?.score ?? 0,
      }))
      .sort((a, b) => b.score - a.score);
  }, [filteredBeaches, beachScores]);

  // Use sortedBeaches for pagination
  const { currentItems } = usePagination(sortedBeaches, currentPage, 18);

  // Add a new state to track when both data fetching and score calculation are complete
  const [dataProcessingComplete, setDataProcessingComplete] = useState(false);

  // Add a state to track whether the sorted beach data is stable
  const [stableSortComplete, setStableSortComplete] = useState(false);

  // Add this state to track the current stable region
  const [stableRegionId, setStableRegionId] = useState(
    filters.location.regionId
  );

  // Modify our existing effect to only set dataProcessingComplete when we have both
  // beach data and forecast data
  useEffect(() => {
    if (beaches?.length && forecastData) {
      const scores = calculateRegionScores(
        beaches,
        filters.location.region || null,
        forecastData
      );
      setBeachScores(scores);
      console.log("✅ Beach scores calculated:", {
        count: Object.keys(scores).length,
        sample: Object.entries(scores)[0],
      });

      // Mark data processing as complete when we have scores
      setDataProcessingComplete(true);
    } else {
      // If we don't have both beaches and forecast data, we're not ready
      setDataProcessingComplete(false);
    }
  }, [beaches, forecastData, filters.location.region, setBeachScores]);

  // Let's increase the timeout substantially and add a more direct approach
  useEffect(() => {
    if (dataProcessingComplete) {
      // Longer delay to ensure ALL processing is complete
      const timer = setTimeout(() => {
        setStableSortComplete(true);
      }, 300); // Increased delay
      return () => clearTimeout(timer);
    } else {
      setStableSortComplete(false);
    }
  }, [dataProcessingComplete]);

  // Reset all states when region changes
  useEffect(() => {
    setDataProcessingComplete(false);
    setStableSortComplete(false);
  }, [filters.location.regionId]);

  // Update it when the sort is complete
  useEffect(() => {
    if (stableSortComplete) {
      setStableRegionId(filters.location.regionId);
    }
  }, [stableSortComplete, filters.location.regionId]);

  // First, combine all our loading/processing states into one
  const isProcessing = useMemo(() => {
    return (
      stableRegionId !== filters.location.regionId ||
      !beachScores ||
      Object.keys(beachScores).length === 0 ||
      !stableSortComplete
    );
  }, [
    stableRegionId,
    filters.location.regionId,
    beachScores,
    stableSortComplete,
  ]);

  const { isSubscribed } = useSubscription();

  const [showFilters, setShowFilters] = useState(false);

  // Prevent premature rendering during loading
  const [regionSelected, setRegionSelected] = useState(false);

  const { isLoading: isForecastLoading, data: forecastDataFromQuery } =
    useQuery({
      queryKey: ["forecast", filters.location.regionId],
      queryFn: () => fetchRegionData(filters.location.regionId),
      enabled: !!filters.location.regionId,
      staleTime: 1000 * 60 * 5,
    });

  // Use React Query for beaches with proper initial loading
  const { isLoading: isBeachesLoading, data: beachesData } = useQuery({
    queryKey: ["beaches", filters.location.regionId],
    queryFn: () => fetchBeaches(filters.location.regionId),
    enabled: true,
    staleTime: 1000 * 60 * 5,
  });

  // Use React Query for blog posts
  const { data: blogPosts = [] } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: fetchBlogPosts,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Use React Query for ads
  const { data: ads = [] } = useQuery({
    queryKey: ["beach-ads", filters.location.regionId, filteredBeaches],
    queryFn: () =>
      fetchAdsForBeaches(filteredBeaches, filters.location.regionId),
    enabled: !!filters.location.regionId && filteredBeaches.length > 0,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Add a query to fetch all regions
  const { data: allRegions = [] } = useQuery({
    queryKey: ["all-regions"],
    queryFn: () => fetch("/api/regions").then((res) => res.json()),
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });

  // Add this query
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
      const data = await response.json();
      console.log(
        `Received ${data.ratings?.length || 0} ratings for ${filters.location.region || "all regions"}`
      );
      return data.ratings || [];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Set regionSelected when a region is selected
  useEffect(() => {
    if (filters.location.regionId) {
      setRegionSelected(true);
    }
  }, [filters.location.regionId]);

  // Update forecast data when it changes
  useEffect(() => {
    if (forecastDataFromQuery) {
      setForecastData(forecastDataFromQuery);
    }
  }, [forecastDataFromQuery, setForecastData]);

  // Update beaches data when it changes
  useEffect(() => {
    if (beachesData) {
      setBeaches(beachesData);
    }
  }, [beachesData, setBeaches]);

  // Update context when data changes
  useEffect(() => {
    if (todayRatings) {
      setTodayGoodBeaches(todayRatings);
    }
  }, [todayRatings, setTodayGoodBeaches]);

  // Update loading state when region changes
  useEffect(() => {
    setLoadingState("forecast", isForecastLoading);
  }, [isForecastLoading, setLoadingState]);

  return (
    <div className="bg-[var(--color-bg-secondary)] p-4 sm:p-6 mx-auto relative min-h-[calc(100vh-72px)] flex flex-col">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px]">
        <Suspense fallback={<SidebarSkeleton />}>
          <LeftSidebar blogPosts={blogPosts} regions={allRegions || []} />
        </Suspense>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px] flex-1 overflow-hidden">
          <main className="min-w-0 overflow-y-auto">
            <Suspense fallback={<BeachListViewSkeleton />}>
              <div className="flex flex-col gap-5">
                <BeachHeaderControls
                  showFilters={showFilters}
                  setShowFilters={setShowFilters}
                  regions={allRegions || []}
                />

                {!stableSortComplete ||
                stableRegionId !== filters.location.regionId ? (
                  <BeachCardsSkeleton />
                ) : (
                  <div className="grid grid-cols-1 gap-[16px]">
                    {sortedBeaches.length > 0 ? (
                      currentItems.map((beach, index) => (
                        <BeachCard
                          key={beach.id || beach.name}
                          beach={beach}
                          isFirst={index === 0}
                          forecastData={forecastData}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-[var(--color-text-primary)] text-left max-w-[34ch] font-primary">
                          {regionSelected
                            ? `No beaches found in ${filters.location.region}. Please select a different region.`
                            : "Please select a region to view beaches."}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Suspense>
          </main>

          <Suspense fallback={<SidebarSkeleton />}>
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
