import * as React from "react";
import { useState, Suspense } from "react";
import { Beach } from "@/app/types/beaches";
import { cn } from "@/app/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { subDays, subYears, startOfDay, endOfDay } from "date-fns";
import { RandomLoader } from "@/app/components/ui/random-loader";
import { useRegions } from "@/app/hooks/useRegions";

type TimePeriod = "today" | "week" | "year" | "3years" | "month";

interface RegionalHighScoresProps {
  beaches: Beach[];
  selectedRegion: string; // This is just the region ID
  onBeachClick?: (beach: Beach) => void;
}

interface BeachScore {
  beachId: string;
  appearances: number;
}

interface BeachWithScore extends Beach {
  totalScore: number;
  latestScore: number;
  appearances: number;
}

// Create a new component for the data fetching part
function RegionalHighScoresContent({
  beaches,
  selectedRegion,
  onBeachClick,
}: RegionalHighScoresProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("week");

  // Use the new endpoint
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["regionalHighScores", selectedRegion, timePeriod],
    queryFn: async () => {
      if (!selectedRegion) return { beaches: [] };

      const response = await fetch(
        `/api/beach-ratings/historical?regionId=${selectedRegion.toLowerCase()}&period=${timePeriod}`
      );

      if (!response.ok) throw new Error("Failed to fetch scores");
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Time period tab labels
  const timePeriodLabels = {
    today: "Today",
    week: "Week",
    month: "Month",
    year: "Year",
    "3years": "3 Years",
  };

  if (!data) {
    return <RandomLoader isLoading={true} />;
  }

  return (
    <>
      {/* Time period tabs */}
      <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-md">
        {(Object.keys(timePeriodLabels) as TimePeriod[]).map((period) => (
          <button
            key={period}
            onClick={() => setTimePeriod(period)}
            className={cn(
              "flex-1 py-1.5 px-2 text-xs font-medium rounded font-primary transition-colors",
              timePeriod === period
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            {timePeriodLabels[period]}
          </button>
        ))}
      </div>

      {isLoading || isFetching ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
              <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-gray-600 text-sm font-primary">
          Error loading surf breaks. Please try again.
        </p>
      ) : data.beaches.length === 0 ? (
        <p className="text-gray-600 text-sm font-primary">
          No good surf breaks found for this time period in {selectedRegion}.
        </p>
      ) : (
        <>
          <div className="space-y-0">
            {data.beaches
              .slice(0, 10)
              .map((beach: BeachWithScore, index: number) => (
                <div
                  key={beach.id}
                  className={`flex items-center gap-3 p-2 hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors ${
                    index < 9
                      ? "border-b border-[var(--color-border-light)]"
                      : ""
                  }`}
                  onClick={() => onBeachClick?.(beach)}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[var(--color-text-primary)] truncate font-primary">
                      {beach.name}
                    </h4>
                    <p className="text-[12px] text-[var(--color-text-secondary)] font-primary">
                      {`${Math.round(beach.totalScore)} total points${
                        beach.appearances > 1
                          ? ` over ${beach.appearances} days`
                          : ""
                      }`}
                    </p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[var(--color-tertiary)] flex items-center justify-center text-white font-medium text-[12px] font-primary">
                    {Math.round(
                      timePeriod === "today"
                        ? beach.latestScore
                        : beach.totalScore
                    )}
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </>
  );
}

export default RegionalHighScoresContent;
