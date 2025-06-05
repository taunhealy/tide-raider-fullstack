import { useSubscription } from "@/app/context/SubscriptionContext";
import { usePagination } from "@/app/hooks/usePagination";
import { ForecastData } from "@/app/types/forecast";

import BeachCard from "../BeachCard";

import LocationFilter from "../LocationFilter";
import type { BeachWithScore } from "@/app/types/scores";
import { useMemo } from "react";
import FilterSidebar from "../filters/FiltersSidebar";
import BeachHeaderControls from "./BeachHeaderControls";

import { FilterType, Region } from "@/app/types/beaches";

interface BeachListViewProps {
  beaches: BeachWithScore[];
  filters: FilterType;
  setFilters: (filters: FilterType) => void;
  forecastData: ForecastData | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  regions?: Region[];
}

export default function BeachListView({
  beaches,
  filters,
  setFilters,
  forecastData,
  currentPage,
  showFilters,
  setShowFilters,
  regions,
}: BeachListViewProps) {
  const { isSubscribed } = useSubscription();

  // Pagination
  const { currentItems } = usePagination(beaches, currentPage, 18);

  // Extract unique regions from beaches
  const uniqueRegions = useMemo(() => {
    if (!beaches?.length) return [];
    const regionMap = new Map();

    beaches.forEach((beach) => {
      if (!regionMap.has(beach.region.id)) {
        regionMap.set(beach.region.id, beach.region);
      }
    });

    return Array.from(regionMap.values());
  }, [beaches]);

  // Add detailed logging
  console.log("🔍 BeachListView Detailed Props:", {
    beachesLength: beaches?.length || 0,
    firstBeach: beaches?.[0]
      ? {
          id: beaches[0].id,
          name: beaches[0].name,
          region: beaches[0].region,
          score: beaches[0].score,
          // Log critical scoring fields
          optimalWindDirections: beaches[0].optimalWindDirections,
          swellSize: beaches[0].swellSize,
          optimalSwellDirections: beaches[0].optimalSwellDirections,
          idealSwellPeriod: beaches[0].idealSwellPeriod,
        }
      : null,

    forecastDataPresent: !!forecastData,
    forecastDetails: forecastData
      ? {
          windSpeed: forecastData.windSpeed,
          windDirection: forecastData.windDirection,
          swellHeight: forecastData.swellHeight,
          swellPeriod: forecastData.swellPeriod,
          swellDirection: forecastData.swellDirection,
        }
      : null,
  });

  console.log("🏖️ BeachListView rendering with:", {
    totalBeaches: beaches.length,

    forecastDataPresent: !!forecastData,
  });

  console.log("Beaches before filtering:", beaches.length);
  console.log("Current filters:", filters);
  console.log("Beaches after pagination:", currentItems.length);

  console.log(
    "Raw beaches data:",
    beaches.map((b) => ({
      id: b.id,
      name: b.name,
      optimalWindDirections: b.optimalWindDirections,
      swellSize: b.swellSize,
      optimalSwellDirections: b.optimalSwellDirections,
      idealSwellPeriod: b.idealSwellPeriod,
    }))
  );

  if (beaches.length === 0) {
    return (
      <div className="flex flex-col">
        <BeachHeaderControls
          filters={filters}
          setFilters={setFilters}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          regions={Array.isArray(regions) ? regions : []}
        />

        <div className="text-center py-8">
          <p className="text-[var(--color-text-primary)] text-left max-w-[34ch] font-primary">
            {filters.location.region
              ? `No beaches found in ${filters.location.region}. Please select a different region.`
              : "Please select a region to view beaches."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <BeachHeaderControls
        filters={filters}
        setFilters={setFilters}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        regions={Array.isArray(regions) ? regions : []}
      />

      {/* 3. Beach Cards */}
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

      {/* Filter Sidebar Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowFilters(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[300px] transform bg-white shadow-xl">
            <FilterSidebar
              filters={filters}
              setFilters={setFilters}
              beaches={beaches}
            />
          </div>
        </div>
      )}
    </div>
  );
}
