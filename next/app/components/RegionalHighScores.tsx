import * as React from "react";
import { useState, Suspense } from "react";
import { Beach } from "@/app/types/beaches";
import { cn } from "@/app/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { subDays, subYears, startOfDay, endOfDay } from "date-fns";

type TimePeriod = "today" | "week" | "year" | "3years";

interface RegionalHighScoresProps {
  beaches: Beach[];
  selectedRegion: string;
  onBeachClick?: (beach: Beach) => void;
}

interface BeachScore {
  beachId: string;
  appearances: number;
  averageScore: number | null;
}

interface BeachWithScore extends Beach {
  appearances: number;
  averageScore: number;
}

// Create a new component for the data fetching part
function RegionalHighScoresContent({
  beaches,
  selectedRegion,
  onBeachClick,
}: RegionalHighScoresProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("week");

  // Calculate dates based on selected time period
  const getDateRange = () => {
    const now = new Date();
    let startDate;

    switch (timePeriod) {
      case "week":
        startDate = subDays(now, 7);
        break;
      case "year":
        startDate = subYears(now, 1);
        break;
      case "3years":
        startDate = subYears(now, 3);
        break;
      case "today":
      default:
        startDate = startOfDay(now);
        break;
    }

    return {
      startDate,
      endDate: timePeriod === "today" ? endOfDay(now) : now,
    };
  };

  // Fetch scores for the selected region and time period
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["regionalHighScores", selectedRegion, timePeriod],
    queryFn: async () => {
      if (!selectedRegion) return { beaches: [] };

      const { startDate, endDate } = getDateRange();

      const response = await fetch(
        `/api/beach-scores?region=${encodeURIComponent(selectedRegion)}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (!response.ok) throw new Error("Failed to fetch scores");

      const { scores } = await response.json();

      // Map scores to beach details
      const beachesWithScores = scores
        .map((score: BeachScore) => {
          const beach = beaches.find((b) => b.id === score.beachId);
          if (!beach) return null;
          return {
            ...beach,
            appearances: score.appearances,
            averageScore: score.averageScore ?? 0,
          } as BeachWithScore;
        })
        .filter(Boolean)
        .sort(
          (a: BeachWithScore, b: BeachWithScore) =>
            (b.averageScore ?? 0) - (a.averageScore ?? 0)
        )
        .slice(0, 5);

      return { beaches: beachesWithScores };
    },
  });

  // Time period tab labels
  const timePeriodLabels = {
    today: "Today",
    week: "Week",
    year: "Year",
    "3years": "3 Years",
  };

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
              <div className="bg-gray-200 w-8 h-8 rounded-full animate-pulse"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-gray-600 text-sm font-primary">
          Error loading surf breaks. Please try again.
        </p>
      ) : !data || data.beaches.length === 0 ? (
        <p className="text-gray-600 text-sm font-primary">
          No good surf breaks found for this time period in {selectedRegion}.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600 font-primary">
              {timePeriod === "today"
                ? "Today's total scores"
                : timePeriod === "week"
                  ? "This week's total scores"
                  : timePeriod === "year"
                    ? "This year's total scores"
                    : "Last 3 years' total scores"}
            </span>
          </div>
          <div className="space-y-0">
            {data?.beaches.map((beach: BeachWithScore, index: number) => {
              // Ensure we have valid numbers before any calculations
              const score =
                typeof beach.averageScore === "number"
                  ? beach.averageScore // Just use the raw score, no multiplication
                  : 0;

              return (
                <div
                  key={beach.id}
                  className={`flex items-center gap-3 p-2 hover:bg-[var(--color-bg-hover)] cursor-pointer transition-colors ${
                    index !== data.beaches.length - 1
                      ? "border-b border-[var(--color-border-light)]"
                      : ""
                  }`}
                  onClick={() => onBeachClick?.(beach)}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[var(--color-text-primary)] truncate font-primary">
                      {beach.name}
                    </h4>
                    <p className="text-sm text-[var(--color-text-secondary)] font-primary">
                      {`${score.toFixed(1)} points${beach.appearances > 1 ? ` over ${beach.appearances} days` : ""}`}
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-[var(--color-tertiary)] flex items-center justify-center text-white font-medium font-primary">
                    {score.toFixed(1)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

// Main component with Suspense
export default function RegionalHighScores(props: RegionalHighScoresProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 font-primary">
        {props.selectedRegion
          ? `High Scores in ${props.selectedRegion}`
          : "High Scores"}
      </h3>

      {!props.selectedRegion ? (
        <p className="text-gray-600 text-sm font-primary">
          Choose a region to view its high scores.
        </p>
      ) : (
        <Suspense
          fallback={
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="bg-gray-200 w-12 h-12 rounded-md"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="bg-gray-200 w-8 h-8 rounded-full"></div>
                </div>
              ))}
            </div>
          }
        >
          <RegionalHighScoresContent {...props} />
        </Suspense>
      )}
    </div>
  );
}
