import * as React from "react";
import { useState, Suspense } from "react";
import { Beach } from "@/app/types/beaches";
import { cn } from "@/app/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { subDays, subYears, startOfDay, endOfDay } from "date-fns";
import { RandomLoader } from "@/app/components/ui/random-loader";
import { useRegions } from "@/app/hooks/useRegions";
import { useSubscriptionStatus } from "@/app/hooks/useSubscriptionStatus";
import { Lock } from "lucide-react";
import Link from "next/link";

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
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("today");
  // Use the same backend subscription check as BeachCard
  // This calls /api/paypal/subscription-status which proxies to the backend
  const {
    isPremium,
    isSubscribed,
    hasActiveTrial,
    subscriptionStatus,
    isLoading: isSubscriptionLoading,
  } = useSubscriptionStatus();

  // Debug logging to confirm backend subscription check
  React.useEffect(() => {
    if (!isSubscriptionLoading) {
      console.log("[RegionalHighScores] Subscription status from backend:", {
        isPremium,
        isSubscribed,
        hasActiveTrial,
        subscriptionStatus,
      });
    }
  }, [
    isSubscriptionLoading,
    isPremium,
    isSubscribed,
    hasActiveTrial,
    subscriptionStatus,
  ]);

  // Get today's date string to include in query key - this ensures cache refreshes when scores are recalculated
  const today = new Date().toISOString().split("T")[0];

  // Use the new endpoint
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["regionalHighScores", selectedRegion, timePeriod, today],
    queryFn: async () => {
      if (!selectedRegion) return { beaches: [] };

      const response = await fetch(
        `/api/beach-ratings/historical?regionId=${selectedRegion.toLowerCase()}&period=${timePeriod}`
      );

      // Handle 429 gracefully - return empty beaches array
      if (response.status === 429) {
        console.warn(
          "[RegionalHighScores] Rate limited, returning empty beaches"
        );
        return { beaches: [] };
      }

      if (!response.ok) {
        // For other errors, still return empty array instead of throwing
        console.error(
          "[RegionalHighScores] Failed to fetch scores:",
          response.status
        );
        return { beaches: [] };
      }

      const data = await response.json();
      // Ensure we always return an object with beaches array
      return Array.isArray(data.beaches) ? data : { beaches: [] };
    },
    staleTime: 0, // Always consider data stale - refetch on mount/window focus
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    retry: 0, // Don't retry on error to avoid hitting rate limits
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
              .map((beach: BeachWithScore, index: number) => {
                // Calculate display score for the badge
                const displayScore =
                  timePeriod === "today" ? beach.latestScore : beach.totalScore;
                const roundedScore = Math.round(displayScore);

                // Lock the first 5 items for all time periods for non-premium users
                // This consistently locks the top locations regardless of time period
                const isLocked =
                  !isSubscriptionLoading && index < 5 && !isPremium;

                return (
                  <div
                    key={beach.id}
                    className={`flex items-center gap-3 p-2 transition-colors ${
                      isLocked
                        ? ""
                        : "hover:bg-[var(--color-bg-hover)] cursor-pointer"
                    } ${
                      index < 9
                        ? "border-b border-[var(--color-border-light)]"
                        : ""
                    }`}
                    onClick={isLocked ? undefined : () => onBeachClick?.(beach)}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-[var(--color-text-primary)] truncate font-primary flex items-center gap-2">
                        {isLocked ? (
                          <>
                            <Lock className="w-3 h-3 text-amber-700" />
                            <Link
                              href="/checkout"
                              className="text-amber-900 hover:text-amber-800 transition-colors font-primary text-xs font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Subscribe to Unlock
                            </Link>
                          </>
                        ) : (
                          beach.name
                        )}
                      </h4>
                      <p className="text-[12px] text-[var(--color-text-secondary)] font-primary">
                        {isLocked
                          ? "Premium content"
                          : `${Math.round(beach.totalScore)} total points${
                              beach.appearances > 1
                                ? ` over ${beach.appearances} days`
                                : ""
                            }`}
                      </p>
                    </div>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-medium text-[12px] font-primary ${
                        isLocked ? "bg-gray-400" : "bg-[var(--color-tertiary)]"
                      }`}
                    >
                      {isLocked ? (
                        <Lock className="w-3 h-3 text-white" />
                      ) : (
                        roundedScore
                      )}
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

export default RegionalHighScoresContent;
