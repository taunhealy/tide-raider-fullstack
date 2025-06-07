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
  console.log("📊 Received forecast data:", data);
  return data as BaseForecastData;
};

const fetchBeaches = async (regionId?: string) => {
  try {
    const response = await fetch(
      regionId ? `/api/beaches?regionId=${regionId}` : `/api/beaches` // This will fetch all beaches for Global view
    );

    if (!response.ok) {
      throw new Error("Failed to fetch beaches");
    }

    const data = await response.json();
    console.log("Fetched beaches:", {
      count: data.length,
      firstBeach: data[0],
      hasRegions: data[0]?.region !== undefined,
    });

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
  } = useBeach();

  // Use the filtered beaches hook for the beach list
  const filteredBeaches = useFilteredBeaches();

  // Calculate scores when beaches or forecast data changes
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
    }
  }, [beaches, forecastData, filters.location.region, setBeachScores]);

  // Add after the score calculation effect
  useEffect(() => {
    if (Object.keys(beachScores).length > 0) {
      // Filter only good beaches (score >= 4) before saving
      const goodBeaches = Object.entries(beachScores)
        .filter(([_, { score }]) => score >= 4)
        .reduce<Record<string, { score: number; region: string }>>(
          (acc, [beachId, data]) => {
            acc[beachId] = data;
            return acc;
          },
          {}
        );

      // Only save if there are good beaches
      if (Object.keys(goodBeaches).length > 0) {
        // Save good beach ratings to database
        fetch("/api/beach-ratings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ beachScores: goodBeaches }),
        });
      }
    }
  }, [beachScores]);

  // Replace filteredBeaches usage with:
  const sortedBeaches = useMemo(
    () => getSortedBeachesByScore(filteredBeaches, beachScores),
    [filteredBeaches, beachScores]
  );

  // Use sortedBeaches for pagination
  const { currentItems } = usePagination(sortedBeaches, currentPage, 18);

  const { isSubscribed } = useSubscription();

  const [showFilters, setShowFilters] = useState(false);

  // Use React Query for forecast data
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
    enabled: true, // This ensures it runs on initial load
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
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

  // Combine loading states
  const isLoading = isForecastLoading || isBeachesLoading;

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

                {filteredBeaches.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[var(--color-text-primary)] text-left max-w-[34ch] font-primary">
                      {allRegions?.length && allRegions[0]?.name
                        ? `No beaches found in ${allRegions[0].name}. Please select a different region.`
                        : "Please select a region to view beaches."}
                    </p>
                  </div>
                ) : (
                  <Suspense fallback={<BeachCardsSkeleton />}>
                    <div className="grid grid-cols-1 gap-[16px]">
                      {currentItems.map((beach, index) => (
                        <BeachCard
                          key={beach.name}
                          beach={beach}
                          isFirst={index === 0}
                          forecastData={forecastData}
                        />
                      ))}
                    </div>
                  </Suspense>
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
