"use client";

import { useBeachData } from "@/app/hooks/useBeachData";
import WeatherForecastWidget from "../sidebar/WeatherForecastWidget";
import AdventureExperiences from "../AdventureExperiences";
import RegionalHighScores from "../RegionalHighScores";
import RegionalSidebar from "../RegionalServicesSidebar";
import FunFacts from "../FunFacts";
import { Skeleton } from "@/app/components/ui/skeleton";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";
import { useFilteredBeaches } from "@/app/hooks/useFilteredBeaches";

// Create skeleton components outside the main component
const ForecastWidgetSkeleton = () => (
  <div
    className="bg-gray-50 backdrop-blur-md rounded-lg shadow-xl border border-gray-200 p-6"
    style={{
      borderColor: "rgba(28, 217, 255, 0.1)",
      boxShadow:
        "0 0 20px rgba(28, 217, 255, 0.1), 0 8px 32px rgba(0, 0, 0, 0.05)",
    }}
  >
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-8 w-16" />
    </div>

    <div className="grid grid-cols-2 gap-4">
      {/* Wind Direction Skeleton */}
      <div className="bg-gray-100/80 backdrop-blur-sm p-4 rounded-lg border border-gray-200 shadow-md aspect-square">
        <Skeleton className="h-5 w-16 mb-4" />
        <div className="flex flex-col items-center justify-center h-[calc(100%-28px)]">
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-5 w-10 mb-2" />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>

      {/* Swell Height Skeleton */}
      <div className="bg-gray-100/80 backdrop-blur-sm p-4 rounded-lg border border-gray-200 shadow-md aspect-square">
        <Skeleton className="h-5 w-24 mb-4" />
        <div className="flex flex-col items-center justify-center h-[calc(100%-28px)]">
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      {/* Swell Period Skeleton */}
      <div className="bg-gray-100/80 backdrop-blur-sm p-4 rounded-lg border border-gray-200 shadow-md aspect-square">
        <Skeleton className="h-5 w-24 mb-4" />
        <div className="flex flex-col items-center justify-center h-[calc(100%-28px)]">
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      {/* Swell Direction Skeleton */}
      <div className="bg-gray-100/80 backdrop-blur-sm p-4 rounded-lg border border-gray-200 shadow-md aspect-square">
        <Skeleton className="h-5 w-24 mb-4" />
        <div className="flex flex-col items-center justify-center h-[calc(100%-28px)]">
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>
    </div>
  </div>
);

const RegionalHighScoresSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-md p-4">
    <Skeleton className="h-7 w-40 mb-4" />
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  </div>
);

const AdventureExperiencesSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-md p-4">
    <Skeleton className="h-7 w-48 mb-4" />
    <div className="space-y-3">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-40 w-full rounded-md" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  </div>
);

const RegionalServicesSidebarSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-md p-4">
    <Skeleton className="h-7 w-36 mb-4" />
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-12 w-12 rounded" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Add only the RaidLogSkeleton component
const RaidLogSkeleton = () => (
  <div className="bg-[var(--color-bg-primary)] p-6 rounded-lg shadow-sm border border-gray-200">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-5 w-16" />
    </div>
    <div className="space-y-3">
      <Skeleton className="aspect-video w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-4" />
          ))}
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  </div>
);

export default function RightSidebar() {
  const { beaches } = useFilteredBeaches({
    initialData: null,
    enabled: true,
  });
  const { filters } = useBeachFilters();

  return (
    <aside className="space-y-6 lg:w-[250px] xl:w-[300px]">
      <WeatherForecastWidget />
      {filters.regionId && (
        <RegionalHighScores
          beaches={beaches}
          selectedRegion={filters.regionId}
        />
      )}
      <AdventureExperiences
        selectedRegion={filters.region || filters.regionId}
      />
      <RegionalSidebar />
      <FunFacts />
    </aside>
  );
}
