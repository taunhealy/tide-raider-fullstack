import { useSubscription } from "@/app/context/SubscriptionContext";
import { usePagination } from "@/app/hooks/usePagination";
import { useBeach } from "@/app/context/BeachContext";
import { useFilteredBeaches } from "@/app/hooks/useFilteredBeaches";

import BeachCard from "../BeachCard";

import type { BeachWithScore } from "@/app/types/scores";
import { useMemo, useState } from "react";
import FilterSidebar from "../filters/FiltersSidebar";
import BeachHeaderControls from "./BeachHeaderControls";

import { Region } from "@/app/types/beaches";

interface BeachListViewProps {
  regions?: Region[];
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
}

export default function BeachListView({
  regions,
  showFilters,
  setShowFilters,
}: BeachListViewProps) {
  const { forecastData, currentPage } = useBeach();
  const { isSubscribed } = useSubscription();

  // Use the filtered beaches hook for the beach list
  const filteredBeaches = useFilteredBeaches();

  // Update pagination to use filtered beaches
  const { currentItems } = usePagination(filteredBeaches, currentPage, 18);

  // Add detailed logging
  console.log("🔍 BeachListView Detailed Props:", {
    beachesLength: filteredBeaches?.length || 0,
    firstBeach: filteredBeaches?.[0]
      ? {
          id: filteredBeaches[0].id,
          name: filteredBeaches[0].name,
          region: filteredBeaches[0].region,
          score: filteredBeaches[0].score,
          // Log critical scoring fields
          optimalWindDirections: filteredBeaches[0].optimalWindDirections,
          swellSize: filteredBeaches[0].swellSize,
          optimalSwellDirections: filteredBeaches[0].optimalSwellDirections,
          idealSwellPeriod: filteredBeaches[0].idealSwellPeriod,
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
    totalBeaches: filteredBeaches.length,

    forecastDataPresent: !!forecastData,
  });

  console.log(
    "Raw beaches data:",
    filteredBeaches.map((b) => ({
      id: b.id,
      name: b.name,
      optimalWindDirections: b.optimalWindDirections,
      swellSize: b.swellSize,
      optimalSwellDirections: b.optimalSwellDirections,
      idealSwellPeriod: b.idealSwellPeriod,
    }))
  );

  if (filteredBeaches.length === 0) {
    return (
      <div className="flex flex-col">
        <BeachHeaderControls
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          regions={regions}
        />

        <div className="text-center py-8">
          <p className="text-[var(--color-text-primary)] text-left max-w-[34ch] font-primary">
            {regions?.length && regions[0]?.name
              ? `No beaches found in ${regions[0].name}. Please select a different region.`
              : "Please select a region to view beaches."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <BeachHeaderControls
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        regions={regions}
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
      <FilterSidebar
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
      />
    </div>
  );
}
