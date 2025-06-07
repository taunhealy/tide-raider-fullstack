import WeatherForecastWidget from "../sidebar/WeatherForecastWidget";
import AdventureExperiences from "../AdventureExperiences";
import RegionalHighScores from "../RegionalHighScores";
import RegionalSidebar from "../RegionalServicesSidebar";
import FunFacts from "../FunFacts";
import { useBeach } from "@/app/context/BeachContext";
import { Skeleton } from "@/app/components/ui/skeleton";
import { useMemo } from "react";

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

interface RightSidebarProps {
  availableAds: any[];
  selectedRegion?: string;
  beaches?: any[];
}

export default function RightSidebar({
  availableAds,
  selectedRegion = "Western Cape",
  beaches = [],
}: RightSidebarProps) {
  const { forecastData, beaches: allBeaches, isLoading } = useBeach();

  const handleBeachClick = (beach: any) => {
    // Implement beach click handler logic
  };

  // Pre-determine what to render to avoid complex conditional logic
  const sidebarContent = useMemo(() => {
    if (isLoading) {
      return {
        forecast: <ForecastWidgetSkeleton />,
        highScores: <RegionalHighScoresSkeleton />,
        adventures: <AdventureExperiencesSkeleton />,
        services: <RegionalServicesSidebarSkeleton />,
      };
    } else {
      return {
        forecast: (
          <WeatherForecastWidget
            forecastData={forecastData}
            isLoading={false}
          />
        ),
        highScores: selectedRegion ? (
          <RegionalHighScores
            beaches={allBeaches}
            selectedRegion={selectedRegion}
            onBeachClick={handleBeachClick}
          />
        ) : null,
        adventures: <AdventureExperiences selectedRegion={selectedRegion} />,
        services: (
          <RegionalSidebar selectedRegion={selectedRegion} ads={availableAds} />
        ),
      };
    }
  }, [
    isLoading,
    forecastData,
    selectedRegion,
    allBeaches,
    availableAds,
    handleBeachClick,
  ]);

  return (
    <aside className="space-y-6 lg:w-[250px] xl:w-[300px]">
      {sidebarContent.forecast}

      {sidebarContent.highScores}

      {sidebarContent.adventures}

      {sidebarContent.services}

      <FunFacts />
    </aside>
  );
}
