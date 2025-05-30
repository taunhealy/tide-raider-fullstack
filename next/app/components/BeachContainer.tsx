"use client";

import { useEffect, useMemo } from "react";
import type { Beach } from "@/app/types/beaches";
import StickyForecastWidget from "./StickyForecastWidget";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  setAllBeaches,
  calculateBeachScores,
} from "../redux/slices/beachSlice";
import { loadDefaultFilters } from "../redux/slices/filterSlice";
import { setIsMounted } from "../redux/slices/uiSlice";
import FilterSidebar from "@/app/components/filters/FiltersSidebar";
import BeachHeaderControls from "./raid/BeachHeaderControls";
import BeachListView from "./raid/BeachListView";
import MapView from "./raid/MapView";
import RightSidebar from "./raid/RightSidebar";
import LeftSidebar from "./raid/LeftSidebar";
import { useForecastData } from "@/app/hooks/useForecastData";
import BeachCard from "./BeachCard";
import { useQuery } from "@tanstack/react-query";
import { fetchForecast } from "@/app/redux/slices/forecastSlice";
import { selectRegionBeaches, selectBeachScores } from "@/app/redux/selectors";
import { addScoresToBeaches, sortBeachesByScore } from "@/app/lib/beachUtils";

interface BeachContainerCompProps {
  initialBeaches: Beach[];
  blogPosts: any;
  availableAds: any[];
}

// Add this function at the top level
const fetchAdsForBeaches = async (beaches: Beach[], regionId: string) => {
  // Batch the requests into groups of 5
  const batchSize = 5;
  const batches = [];

  for (let i = 0; i < beaches.length; i += batchSize) {
    const batch = beaches.slice(i, i + batchSize);
    batches.push(batch);
  }

  // Process batches sequentially
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

export default function BeachContainer({
  initialBeaches,
  blogPosts,
  availableAds,
}: BeachContainerCompProps) {
  const dispatch = useAppDispatch();
  const { viewMode, isMounted } = useAppSelector((state) => state.ui);
  const filters = useAppSelector((state) => state.filters);
  const allBeaches = useAppSelector((state) => state.beaches.allBeaches);
  const selectedRegion = useAppSelector(
    (state) => state.filters.selectedRegion
  );
  const isCalculating = useAppSelector((state) => state.beaches.isCalculating);
  const calculationError = useAppSelector((state) => state.beaches.error);
  const forecastError = useAppSelector((state) => state.forecast.error);

  // Use the hook for forecast data - single source of truth
  const { forecastData, isLoading: forecastLoading } = useForecastData(
    selectedRegion || null
  );

  // First, memoize just the forecast data for the region
  const forecastForRegion = useMemo(() => {
    if (!forecastData || forecastData.region !== selectedRegion) {
      return null;
    }

    return forecastData;
  }, [forecastData, selectedRegion]);

  // First get the data
  const regionBeaches = useAppSelector(selectRegionBeaches);
  const beachScores = useAppSelector(selectBeachScores);
  const beachesWithScores = addScoresToBeaches(regionBeaches, beachScores);
  const sortedBeaches = sortBeachesByScore(beachesWithScores);

  // Then log it
  console.log("Pre-sort state:", {
    beachScoresExists: !!beachScores,
    allBeachesLength: allBeaches?.length,
    selectedRegion,
  });

  // Calculate scores when forecast data changes
  useEffect(() => {
    if (
      !isCalculating && // Not already calculating
      !forecastLoading && // Forecast data is ready
      forecastForRegion && // We have forecast data
      forecastForRegion.region === selectedRegion // Regions match
    ) {
      dispatch(calculateBeachScores());
    }
  }, [
    forecastForRegion,
    selectedRegion,
    dispatch,
    isCalculating,
    forecastLoading,
  ]);

  // Count of suitable beaches
  const suitableCount = sortedBeaches.length;

  // Add debug logging
  useEffect(() => {
    console.log("Score calculation state:", {
      isCalculating,
      forecastLoading,
      hasForcastData: !!forecastData,
      forecastRegion: forecastData?.region,
      selectedRegion,
      beachScoresCount: Object.keys(beachScores || {}).length,
      error: calculationError,
    });
  }, [
    isCalculating,
    forecastLoading,
    forecastData,
    selectedRegion,
    beachScores,
    calculationError,
  ]);

  // Initialize beaches
  useEffect(() => {
    const beachesWithIds = initialBeaches.map((beach) => ({
      ...beach,
      id: beach.id || beach.name.toLowerCase().replace(/\s+/g, "-"),
    }));
    dispatch(setAllBeaches(beachesWithIds));
  }, [initialBeaches, dispatch]);

  // Initialize UI state
  useEffect(() => {
    dispatch(setIsMounted(true));
    dispatch(loadDefaultFilters());
    return () => {
      dispatch(setIsMounted(false));
    };
  }, [dispatch]);

  // Add near the top of the component, after the selector hooks
  useEffect(() => {
    console.log("Debug - State Update:", {
      hasBeachScores: !!beachScores,
      scoreCount: Object.keys(beachScores || {}).length,
      hasSelectedRegion: !!selectedRegion,
      hasForecastData: !!forecastData,
      forecastRegion: forecastData?.region,
      beachCount: allBeaches?.length,
    });
  }, [beachScores, selectedRegion, forecastData, allBeaches]);

  // Use React Query for ads to handle caching and batching
  const { data: ads } = useQuery({
    queryKey: ["beach-ads", selectedRegion],
    queryFn: () => fetchAdsForBeaches(sortedBeaches, selectedRegion || ""),
    enabled: !!selectedRegion && sortedBeaches.length > 0,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Fetch forecast data when region changes
  useEffect(() => {
    if (selectedRegion) {
      dispatch(fetchForecast(selectedRegion));
    }
  }, [dispatch, selectedRegion]);

  return (
    <div className="bg-[var(--color-bg-secondary)] p-4 sm:p-6 mx-auto relative min-h-[calc(100vh-72px)] flex flex-col">
      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px]">
        {/* Left Sidebar */}
        <LeftSidebar blogPosts={blogPosts} />

        {/* Main Content and Right Sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px] flex-1 overflow-hidden">
          <main className="min-w-0 overflow-y-auto">
            {/* Header Controls */}
            <BeachHeaderControls />

            {viewMode === "list" ? <BeachListView /> : <MapView />}
          </main>

          {/* Right Sidebar */}
          {isMounted && <RightSidebar availableAds={availableAds} />}
        </div>
      </div>

      {/* Filter Sidebar Component */}
      <FilterSidebar />

      {/* Sticky Forecast Widget */}
      <StickyForecastWidget />

      <div className="grid grid-cols-1 gap-4 md:gap-6">
        {forecastError ? (
          <div className="text-red-500 p-4 bg-red-50 rounded-md">
            Error: {forecastError}
          </div>
        ) : isCalculating ? (
          // Show loading state for cards
          Array.from({ length: 3 }).map((_, index) => (
            <BeachCard
              key={`loading-${index}`}
              beach={
                {
                  id: `loading-${index}`,
                  name: "Loading...",
                  region: selectedRegion || "Loading...",
                } as Beach
              }
              isLoading={true}
              index={index}
              onClick={() => {}}
            />
          ))
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4">
              Found {suitableCount} suitable beaches in {selectedRegion}
            </h1>

            <BeachListView />
          </>
        )}
      </div>
    </div>
  );
}
