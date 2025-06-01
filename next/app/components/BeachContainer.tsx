"use client";

import { useEffect, useMemo } from "react";
import type { Beach } from "@/app/types/beaches";
import StickyForecastWidget from "./StickyForecastWidget";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import FilterSidebar from "@/app/components/filters/FiltersSidebar";
import BeachHeaderControls from "./raid/BeachHeaderControls";
import MapView from "./raid/MapView";
import RightSidebar from "./raid/RightSidebar";
import LeftSidebar from "./raid/LeftSidebar";
import { useForecastData } from "@/app/hooks/useForecastData";
import BeachCard from "./BeachCard";
import { useQuery } from "@tanstack/react-query";
import { RootState } from "@/app/redux/store";
import { fetchGeoData } from "../redux/slices/geoSlice";
import { changeRegion, setFilters } from "@/app/redux/slices/filterSlice";
import {
  selectSortedBeaches,
  selectBeachAttributes,
} from "@/app/redux/selectors";
import { fetchBeachesByRegion } from "../redux/slices/beachSlice";
import { useSubscription } from "@/app/context/SubscriptionContext";
import { usePagination } from "@/app/hooks/usePagination";
import { setCurrentPage } from "@/app/redux/slices/uiSlice";
import WaveTypeFilter from "./filters/WaveTypeFilters";
import ForecastSummary from "./forecast/ForecastSummary";
import RegionFilter from "./RegionFilter";
import Pagination from "./common/Pagination";
import FunFacts from "./FunFacts";

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
  blogPosts,
  availableAds,
}: BeachContainerCompProps) {
  const dispatch = useAppDispatch();
  const { viewMode } = useAppSelector((state) => state.ui);
  const selectedRegion = useAppSelector(
    (state) => state.filters.selectedRegion
  );
  const isCalculating = useAppSelector((state) => state.beaches.isCalculating);
  const forecastError = useAppSelector(
    (state: RootState) => state.forecast.error
  );
  const filters = useAppSelector((state) => state.filters);
  const { currentPage } = useAppSelector((state) => state.ui);
  const { waveTypes } = useAppSelector(selectBeachAttributes);
  const { isSubscribed } = useSubscription();

  // Get and process data in one place
  const processedBeaches = useAppSelector(selectSortedBeaches);
  const forecastData = useAppSelector((state) => state.forecast.data);

  console.log("🌊 BeachContainer state:", {
    regionBeaches: processedBeaches.length,
    hasBeachScores: processedBeaches.some((beach) => beach.score > 0),
    forecastData: forecastData
      ? {
          windSpeed: forecastData.windSpeed,
          windDirection: forecastData.windDirection,
          swellHeight: forecastData.swellHeight,
          swellPeriod: forecastData.swellPeriod,
          swellDirection: forecastData.swellDirection,
        }
      : null,
    selectedRegion,
    sampleBeaches: processedBeaches.slice(0, 3).map((beach) => ({
      id: beach.id,
      name: beach.name,
      region: beach.region,
      score: beach.score,
      optimalWindDirections: beach.optimalWindDirections,
      swellSize: beach.swellSize,
      optimalSwellDirections: beach.optimalSwellDirections,
      idealSwellPeriod: beach.idealSwellPeriod,
    })),
    allBeachIds: processedBeaches.map((b) => b.id),
  });

  // Forecast data handling
  const { isLoading: forecastLoading } = useForecastData(
    selectedRegion || null
  );

  // Pagination
  const { currentItems, totalPages } = usePagination(
    processedBeaches,
    currentPage,
    18
  );

  // Use React Query for ads to handle caching and batching
  const { data: ads } = useQuery({
    queryKey: ["beach-ads", selectedRegion],
    queryFn: () => fetchAdsForBeaches(processedBeaches, selectedRegion || ""),
    enabled: !!selectedRegion && processedBeaches.length > 0,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Handler for region changes
  const handleRegionChange = (region: string | null) => {
    dispatch(changeRegion(region));
  };

  useEffect(() => {
    // Fetch geographic data on component mount
    dispatch(fetchGeoData());

    // Remove the beaches initialization since we'll fetch beaches only when a region is selected
  }, [dispatch]);

  // Add effect to fetch beaches when region changes
  useEffect(() => {
    if (selectedRegion) {
      console.log("🔄 Fetching beaches for region:", selectedRegion);
      dispatch(fetchBeachesByRegion(selectedRegion));
    }
  }, [selectedRegion, dispatch]);

  // Add logging before BeachListView render
  console.log("🎯 About to render BeachListView with:", {
    beachCount: processedBeaches.length,
    isLoading: forecastLoading,
    hasForecastData: !!forecastData,
    selectedRegion,
  });

  const renderBeachList = () => {
    if (processedBeaches.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-[var(--color-text-primary)] text-left max-w-[34ch] font-primary">
            {selectedRegion
              ? `No beaches found in ${selectedRegion}. Please select a different region.`
              : "Please select a region to view beaches."}
          </p>
        </div>
      );
    }

    return (
      <>
        <WaveTypeFilter
          waveTypes={waveTypes}
          selectedWaveTypes={filters.waveType}
          onWaveTypeChange={(newWaveTypes) =>
            dispatch(setFilters({ ...filters, waveType: newWaveTypes }))
          }
        />

        <div className="mb-6">
          <ForecastSummary
            windData={forecastData}
            isLoading={forecastLoading}
            windError={null}
          />
        </div>

        <div className="mb-6">
          <RegionFilter
            selectedRegion={selectedRegion}
            onRegionChange={(region) => dispatch(changeRegion(region))}
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[21px] heading-6 text-gray-800 font-primary">
            Breaks
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-[16px]">
          {currentItems.map((beach, index) => (
            <BeachCard
              key={beach.name}
              beach={beach}
              isFirst={index === 0}
              isLoading={forecastLoading}
              index={index}
              forecastData={forecastData}
              beachScore={{ score: beach.score }}
              onClick={() => {}} // Add your click handler if needed
            />
          ))}
        </div>

        {(isSubscribed ? totalPages > 1 : false) && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => dispatch(setCurrentPage(page))}
          />
        )}

        <div className="lg:hidden mt-6">
          <FunFacts />
        </div>
      </>
    );
  };

  return (
    <div className="bg-[var(--color-bg-secondary)] p-4 sm:p-6 mx-auto relative min-h-[calc(100vh-72px)] flex flex-col">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px]">
        <LeftSidebar blogPosts={blogPosts} />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px] flex-1 overflow-hidden">
          <main className="min-w-0 overflow-y-auto">
            <BeachHeaderControls />

            {viewMode === "list" ? renderBeachList() : <MapView />}
          </main>

          <RightSidebar availableAds={availableAds} />
        </div>
      </div>

      <FilterSidebar
        selectedRegion={selectedRegion}
        onRegionChange={(region) => dispatch(changeRegion(region))}
      />
      <StickyForecastWidget />
    </div>
  );
}
