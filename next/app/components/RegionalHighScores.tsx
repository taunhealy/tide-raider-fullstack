import * as React from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Beach } from "@/app/types/beaches";
import { cn } from "@/app/lib/utils";
import { DEFAULT_PROFILE_IMAGE } from "@/app/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, subYears } from "date-fns";

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

export default function RegionalHighScores({
  beaches,
  selectedRegion,
  onBeachClick,
}: RegionalHighScoresProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("week");
  const [isClient, setIsClient] = useState(false);

  // Add this useEffect to handle client-side initialization
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate dates based on selected time period
  const getDateForPeriod = () => {
    const today = new Date();

    switch (timePeriod) {
      case "week":
        return format(subDays(today, 7), "yyyy-MM-dd");
      case "year":
        return format(subYears(today, 1), "yyyy-MM-dd");
      case "3years":
        return format(subYears(today, 3), "yyyy-MM-dd");
      case "today":
      default:
        return format(today, "yyyy-MM-dd");
    }
  };

  // Fetch good beaches for the selected region and time period
  const { data, isLoading, error } = useQuery({
    queryKey: ["regionalHighScores", selectedRegion, timePeriod],
    queryFn: async () => {
      if (!selectedRegion) return { scores: [] };

      const response = await fetch(
        `/api/regional-high-scores?region=${encodeURIComponent(selectedRegion)}&period=${timePeriod}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch high scores");
      }

      const data = await response.json();

      // Map scores to beach details
      const beachesWithScores = data.scores
        .map((score: BeachScore) => {
          const beach = beaches.find((b) => b.id === score.beachId);
          return {
            ...beach,
            appearances: score.appearances,
            averageScore: score.averageScore,
          };
        })
        .filter(Boolean);

      return { beaches: beachesWithScores };
    },
    enabled: !!selectedRegion && isClient, // Only enable the query on the client side
  });

  // Time period tab labels
  const timePeriodLabels = {
    today: "Today",
    week: "Week",
    year: "Year",
    "3years": "3 Years",
  };

  // Show loading skeleton during SSR or when loading on client
  if (!isClient || isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 font-primary">
          High Scores
        </h3>
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
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 font-primary">
        {selectedRegion ? `Top Breaks in ${selectedRegion}` : "Top Breaks"}
      </h3>

      {!selectedRegion ? (
        <p className="text-gray-600 text-sm font-primary">
          Choose a region to view its high scores.
        </p>
      ) : (
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

          {error || !data || data.beaches.length === 0 ? (
            <p className="text-gray-600 text-sm font-primary">
              No good surf breaks found for this time period in {selectedRegion}
              .
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600 font-primary">
                  {data.beaches.length} highest scoring{" "}
                  {data.beaches.length === 1 ? "break" : "breaks"}
                </span>
                <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full font-primary">
                  Score 4+
                </div>
              </div>

              <div className="space-y-0">
                {data.beaches.map((beach: any, index: number) => {
                  // Ensure we have valid numbers before any calculations
                  const score =
                    typeof beach.averageScore === "number"
                      ? Math.floor(beach.averageScore * 10) / 10
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
                          {timePeriod === "today"
                            ? `${score.toFixed(1)} avg`
                            : `${beach.appearances || 0} days • ${score.toFixed(1)} avg`}
                        </p>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-[var(--color-tertiary)] flex items-center justify-center text-white font-medium font-primary">
                        {timePeriod === "today"
                          ? score.toFixed(1)
                          : beach.appearances || 0}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
