"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";
import { useFilteredBeaches } from "@/app/hooks/useFilteredBeaches";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/app/components/ui/Button";

// Components
import StickyForecastWidget from "./StickyForecastWidget";
import RightSidebar from "./raid/RightSidebar";
import LeftSidebar from "./raid/LeftSidebar";
import BeachCard from "./BeachCard";
import BeachHeaderControls from "./raid/BeachHeaderControls";
import SidebarSkeleton from "./SidebarSkeleton";
import LoadingIndicator from "./LoadingIndicator";
import EmptyState from "./EmptyState";
import BeachCardSkeleton from "./skeletons/BeachCardSkeleton";

import type { Beach, BeachInitialData } from "@/app/types/beaches";

import { LocationFilter } from "../types/filters";

// Add this helper function at the top of the file
const getBeachForecastData = (
  beach: Beach,
  beachScores: Record<string, any>
) => {
  const score = beachScores[beach.id]?.score ?? 0;

  // Extract forecast data or return null if unavailable
  const conditions =
    beachScores[beach.id]?.beach?.beachDailyScores?.[0]?.conditions;
  const date = beachScores[beach.id]?.beach?.beachDailyScores?.[0]?.date;

  const forecastData = conditions
    ? {
        id: beach.id,
        regionId: beach.regionId,
        date: date ? new Date(date) : new Date(),
        ...conditions,
      }
    : null;

  return { score, forecastData };
};

interface BeachContainerProps {
  initialData: BeachInitialData | null;
}

export default function BeachContainer({ initialData }: BeachContainerProps) {
  const { filters, updateFilter } = useBeachFilters();
  const { data, isLoading } = useFilteredBeaches({
    initialData,
    enabled: true,
  });
  const queryClient = useQueryClient();

  const beaches = data?.beaches || [];
  const beachScores = data?.scores || {};
  const forecastData = data?.forecastData ?? null;

  const handleRegionSelect = (regionId: LocationFilter["regionId"]) => {
    updateFilter("regionId", regionId || ""); // Convert null to empty string
  };

  const sortedBeaches = useMemo(() => {
    return (
      beaches?.sort((a: Beach, b: Beach) => {
        const scoreA = beachScores[a.id]?.score ?? 0;
        const scoreB = beachScores[b.id]?.score ?? 0;
        return scoreB - scoreA;
      }) ?? []
    );
  }, [beaches, beachScores]);

  useEffect(() => {
    if (initialData) {
      console.log("Initial data received:", {
        beachCount: initialData.beaches?.length || 0,
        hasScores: Boolean(initialData.scores),
        hasForecast: Boolean(initialData.forecast),
        forecastDetails: initialData.forecast,
      });
    }
  }, [initialData]);

  return (
    <div className="bg-[var(--color-bg-secondary)] p-4 sm:p-6 mx-auto relative min-h-[calc(100vh-72px)] flex flex-col font-primary">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px]">
        <Suspense fallback={<SidebarSkeleton />}>
          <LeftSidebar />
        </Suspense>

        <div className="grid grid-cols-1 p-9 xl:grid-cols-[1fr_400px] gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px] flex-1 overflow-hidden">
          <main className="min-w-0 overflow-y-auto">
            <BeachHeaderControls
              onSearch={(value) => updateFilter("searchQuery", value)}
              onRegionSelect={handleRegionSelect}
              currentRegion={filters.regionId || ""}
              beaches={beaches}
            />

            <div className="grid grid-cols-1 gap-5 relative mt-5">
              {!filters.regionId ? (
                <EmptyState message="Select a region to view beaches" />
              ) : sortedBeaches.length === 0 ? (
                <EmptyState message="No beaches found in this region" />
              ) : (
                <div>
                  {sortedBeaches.map((beach: Beach) => (
                    <BeachCard
                      key={beach.id}
                      beach={beach}
                      score={beachScores[beach.id]?.score ?? 0}
                      forecastData={beachScores[beach.id]?.forecastData ?? null}
                      isLoading={!beachScores[beach.id]?.score}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>
          <RightSidebar />
        </div>
      </div>

      <StickyForecastWidget />
    </div>
  );
}
