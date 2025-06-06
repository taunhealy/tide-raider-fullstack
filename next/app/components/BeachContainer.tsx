"use client";

import { Suspense, useEffect } from "react";
import type { Beach } from "@/app/types/beaches";
import type { BaseForecastData } from "@/app/types/forecast";
import StickyForecastWidget from "./StickyForecastWidget";
import { calculateRegionScores } from "@/app/lib/scoreUtils";

import RightSidebar from "./raid/RightSidebar";
import LeftSidebar from "./raid/LeftSidebar";
import { useQuery } from "@tanstack/react-query";
import { useSubscription } from "@/app/context/SubscriptionContext";
import { client } from "@/app/lib/sanity";
import { blogListingQuery } from "@/app/lib/queries";
import BeachListView from "./raid/BeachListView";
import { useState } from "react";
import { useBeach } from "@/app/context/BeachContext";
import { useFilteredBeaches } from "@/app/hooks/useFilteredBeaches";

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
    setFilters,
    beaches,
    setBeaches,
    forecastData,
    setForecastData,
    setBeachScores,
  } = useBeach();

  // Use the hook to get filtered beaches
  const filteredBeaches = useFilteredBeaches();

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

  return (
    <div className="bg-[var(--color-bg-secondary)] p-4 sm:p-6 mx-auto relative min-h-[calc(100vh-72px)] flex flex-col">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px]">
        <Suspense fallback={<SidebarSkeleton />}>
          <LeftSidebar blogPosts={blogPosts} />
        </Suspense>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px] flex-1 overflow-hidden">
          <main className="min-w-0 overflow-y-auto">
            <Suspense fallback={<BeachListViewSkeleton />}>
              <BeachListView
                regions={allRegions}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
              />
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

      <Suspense fallback={null}>
        <StickyForecastWidget />
      </Suspense>
    </div>
  );
}
