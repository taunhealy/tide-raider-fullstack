"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { Beach } from "@/app/types/beaches";
import { cn } from "@/app/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { useSubscriptionStatus } from "@/app/hooks/useSubscriptionStatus";
import { Lock } from "lucide-react";
import Link from "next/link";

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
  const [mounted, setMounted] = useState(false);
  // Use date strings for state: "YYYY-MM-DD"
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate the 3 dates for tabs
  const dateTabs = useMemo(() => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const dayAfter = addDays(today, 2);

    return [
      { id: format(today, "yyyy-MM-dd"), label: "Today" },
      { id: format(tomorrow, "yyyy-MM-dd"), label: "Tomorrow" },
      {
        id: format(dayAfter, "yyyy-MM-dd"),
        label: format(dayAfter, "EEE, MMM d"),
      },
    ];
  }, []);

  // Initialize selectedDate with today once mounted
  useEffect(() => {
    if (mounted && !selectedDate && dateTabs.length > 0) {
      setSelectedDate(dateTabs[0].id);
    }
  }, [mounted, dateTabs, selectedDate]);

  // Debug: Log when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      console.log("[RegionalHighScores] Selected date changed:", selectedDate);
    }
  }, [selectedDate]);

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

  const queryClient = useQueryClient();

  // Force clear cache and refetch when date changes
  useEffect(() => {
    if (selectedDate && selectedRegion) {
      console.log(
        `[RegionalHighScores] 🔄 Date changed to ${selectedDate}, invalidating cache`
      );
      // Invalidate all queries for this region (will trigger refetch)
      queryClient.invalidateQueries({
        queryKey: ["regionalHighScores", selectedRegion],
        exact: false, // Match all queries that start with this key
      });
    }
  }, [selectedDate, selectedRegion, queryClient]);

  // Use the new endpoint
  // Only enable query when we have a date (client-side) and region
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["regionalHighScores", selectedRegion, selectedDate],
    queryFn: async () => {
      if (!selectedRegion || !selectedDate) {
        console.warn(
          "[RegionalHighScores] Missing region or date, returning empty"
        );
        return { beaches: [] };
      }

      const url = `/api/beach-ratings/historical?regionId=${selectedRegion.toLowerCase()}&date=${selectedDate}`;
      console.log(`[RegionalHighScores] 🔍 FETCHING: ${url}`);
      console.log(
        `[RegionalHighScores] Query key: ["regionalHighScores", "${selectedRegion}", "${selectedDate}"]`
      );

      const fetchStartTime = Date.now();
      const response = await fetch(url);

      // Handle 429 gracefully - return empty beaches array
      if (response.status === 429) {
        console.warn(
          "[RegionalHighScores] Rate limited, returning empty beaches"
        );
        return { beaches: [] };
      }

      if (!response.ok) {
        // For other errors, still return empty array instead of throwing
        const errorText = await response.text();
        console.error("[RegionalHighScores] ❌ Failed to fetch scores:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: url,
        });
        return { beaches: [] };
      }

      const data = await response.json();
      const fetchDuration = Date.now() - fetchStartTime;

      // Detailed logging for debugging
      console.log(
        `[RegionalHighScores] ✅ API response received (${fetchDuration}ms):`,
        {
          regionId: selectedRegion,
          date: selectedDate,
          url: url,
          beachCount: data?.beaches?.length || 0,
          hasBeaches: Array.isArray(data?.beaches),
          top3Beaches:
            data?.beaches?.slice(0, 3).map((b: any) => ({
              name: b.name,
              totalScore: b.totalScore,
              latestScore: b.latestScore,
            })) || [],
        }
      );

      // Ensure we always return an object with beaches array
      const result = Array.isArray(data?.beaches) ? data : { beaches: [] };
      console.log(
        `[RegionalHighScores] 📦 Returning data for ${selectedDate}:`,
        {
          beachCount: result.beaches.length,
          topBeach: result.beaches[0]?.name || "none",
        }
      );
      return result;
    },
    enabled: !!selectedRegion && !!selectedDate, // Only run query when we have region and date
    staleTime: 0, // NO CACHING - always fetch fresh data
    gcTime: 0, // NO CACHE - don't keep in cache at all
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: true, // Refetch on reconnect
    retry: 0, // Don't retry on error
    // Don't provide initialData - let it be undefined so loading state shows properly
  });

  // Safely access beaches from API response with fallback to empty array
  // Type assertion needed because the API returns BeachWithScore[]
  const apiBeaches = (data?.beaches || []) as BeachWithScore[];

  // Debug: Log when data changes to verify different dates return different data
  useEffect(() => {
    if (data && selectedDate) {
      console.log(
        `[RegionalHighScores] 📊 RENDER: Data updated for ${selectedDate}:`,
        {
          beachCount: apiBeaches.length,
          top5Beaches: apiBeaches.slice(0, 5).map((b) => ({
            name: b.name,
            totalScore: b.totalScore,
            latestScore: b.latestScore,
          })),
          queryKey: ["regionalHighScores", selectedRegion, selectedDate],
        }
      );
    }
  }, [data, selectedDate, apiBeaches, selectedRegion]);

  // Handle initial loading state - show skeleton while data is being fetched
  // Show loading if not mounted (hydration safety), query is loading OR if we don't have data yet
  if (!mounted || isLoading || (isFetching && !data)) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-md p-4">
        <div className="mb-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-primary">
            TOP SURF BREAKS
          </h3>
          <p className="text-xs text-gray-500 font-primary mt-1">
            Scores aggregated from all forecast sources
          </p>
        </div>
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
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-md p-4">
      <div className="mb-4">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-primary">
          TOP SURF BREAKS
        </h3>
        <p className="text-xs text-gray-500 font-primary mt-1">
          Scores aggregated from all forecast sources
        </p>
      </div>

      {/* Time period tabs */}
      <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-md">
        {dateTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedDate(tab.id)}
            className={cn(
              "flex-1 py-1.5 px-2 text-xs font-medium rounded font-primary transition-colors",
              selectedDate === tab.id
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            {tab.label}
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
      ) : apiBeaches.length === 0 ? (
        <p className="text-gray-600 text-sm font-primary text-center py-4">
          No surf breaks with scores found for this time period.
        </p>
      ) : (
        <>
          <div className="space-y-0" key={`beaches-${selectedDate}`}>
            {apiBeaches
              .slice(0, 10)
              .map((beach: BeachWithScore, index: number) => {
                // Calculate display score for the badge
                // Since we are filtering by a specific date, totalScore represents the score for that day
                const displayScore = beach.totalScore;
                const roundedScore = Math.round(displayScore);

                // Lock the first 5 items for all time periods for non-premium users
                // This consistently locks the top locations regardless of time period
                // Only lock if subscription status has been loaded and user is not premium
                // If user is premium (subscribed or has trial), NO gates at all
                // All surf breaks are now unlocked for everyone
                const isLocked = false;

                // Debug logging for first item to verify gating
                if (index === 0 && !isSubscriptionLoading) {
                  console.log("[RegionalHighScores] First item gating check:", {
                    index,
                    isSubscriptionLoading,
                    isPremium,
                    isSubscribed,
                    hasActiveTrial,
                    subscriptionStatus,
                    selectedDate,
                    isLocked,
                  });
                }

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
    </div>
  );
}

export default RegionalHighScoresContent;
