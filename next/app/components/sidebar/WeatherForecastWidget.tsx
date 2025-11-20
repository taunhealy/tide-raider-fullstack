"use client";

// components/sidebar/WeatherForecastWidget.tsx
import { useMemo, useEffect, useState } from "react";
import { degreesToCardinal } from "@/app/lib/surfUtils";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/app/lib/api-client";

type ForecastSource = "WINDFINDER" | "WINDGURU" | "WINDY";

const LoadingState = () => (
  <div className="col-span-2 flex items-center justify-center p-6">
    <span className="text-gray-300 font-primary text-center animate-pulse">
      Loading forecast data...
    </span>
  </div>
);

const NoDataState = () => (
  <div className="col-span-2 flex items-center justify-center p-6">
    <span className="text-gray-300 font-primary text-center">
      No forecast data available. Awaiting region selection.
    </span>
  </div>
);

export default function WeatherForecastWidget() {
  const queryClient = useQueryClient();
  const {
    filters: { regionId, forecastDate },
  } = useBeachFilters();
  // Store selected source in localStorage so it's shared across components
  const [selectedSource, setSelectedSource] = useState<ForecastSource>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("forecastSource");
      if (stored && ["WINDFINDER", "WINDGURU", "WINDY"].includes(stored)) {
        return stored as ForecastSource;
      }
    }
    return "WINDFINDER";
  });

  // Update localStorage when source changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("forecastSource", selectedSource);
      // Dispatch custom event so other components can listen
      window.dispatchEvent(
        new CustomEvent("forecastSourceChanged", { detail: selectedSource })
      );
    }
  }, [selectedSource]);

  // Normalize date - use today's date if no date is selected
  const normalizedDate = useMemo(() => {
    if (forecastDate) {
      return forecastDate;
    }
    // Default to today's date
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return today.toISOString().split("T")[0];
  }, [forecastDate]);

  // Debug: Log when normalizedDate changes
  useEffect(() => {
    console.log(
      "[WeatherForecastWidget] normalizedDate changed:",
      normalizedDate
    );
    console.log("[WeatherForecastWidget] regionId:", regionId);
    console.log(
      "[WeatherForecastWidget] Query enabled:",
      !!regionId && !!normalizedDate
    );
  }, [normalizedDate, regionId]);

  // Invalidate and refetch when date or source changes
  useEffect(() => {
    if (regionId && normalizedDate) {
      console.log(
        "[WeatherForecastWidget] Date or source changed, invalidating queries:",
        {
          regionId,
          normalizedDate,
          source: selectedSource,
        }
      );
      queryClient.invalidateQueries({
        queryKey: ["forecast", regionId],
      });
      // Also invalidate filtered-beaches query so scores are recalculated with new source
      // This forces useFilteredBeaches to refetch with the new source
      queryClient.invalidateQueries({
        queryKey: ["filteredBeaches"],
      });
      // Remove all cached filteredBeaches queries to force fresh fetch
      queryClient.removeQueries({
        queryKey: ["filteredBeaches"],
      });
      // Force refetch to ensure the new source is used immediately
      queryClient.refetchQueries({
        queryKey: ["filteredBeaches"],
      });
    }
  }, [regionId, normalizedDate, selectedSource, queryClient]);

  const queryEnabled = !!regionId && !!normalizedDate;

  const {
    data: forecastData,
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["forecast", regionId, normalizedDate, selectedSource],
    queryFn: async () => {
      console.log(
        "[WeatherForecastWidget] ⚡ Query function called - Fetching forecast:",
        {
          regionId,
          normalizedDate,
          source: selectedSource,
          url: `/api/forecast?regionId=${regionId}&forecastDate=${normalizedDate}&source=${selectedSource}`,
        }
      );
      try {
        const result = await api.getForecast(
          regionId!,
          normalizedDate,
          selectedSource
        );
        console.log(
          "[WeatherForecastWidget] ✅ Forecast data received:",
          result
        );
        return result;
      } catch (err) {
        console.error(
          "[WeatherForecastWidget] ❌ Error fetching forecast:",
          err
        );
        throw err;
      }
    },
    enabled: queryEnabled,
    staleTime: 0, // Always refetch when query key changes (date change)
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Refetch when component mounts with new date
    gcTime: 0, // Don't cache - always fetch fresh data
  });

  // Debug: Log query state
  useEffect(() => {
    console.log("[WeatherForecastWidget] Query state:", {
      enabled: queryEnabled,
      isLoading,
      isFetching,
      hasData: !!forecastData,
      hasError: !!error,
      regionId,
      normalizedDate,
    });
  }, [
    queryEnabled,
    isLoading,
    isFetching,
    forecastData,
    error,
    regionId,
    normalizedDate,
  ]);

  // Determine the title based on selected date
  const getForecastTitle = () => {
    if (!forecastDate) {
      return "TODAY";
    }

    // Parse the selected date
    const [year, month, day] = forecastDate.split("-").map(Number);
    const selectedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    // Get today's date
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Get tomorrow's date
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    // Compare dates (ignoring time)
    const selectedTime = selectedDate.getTime();
    const todayTime = today.getTime();
    const tomorrowTime = tomorrow.getTime();

    if (selectedTime === todayTime) {
      return "TODAY";
    }

    if (selectedTime === tomorrowTime) {
      return "TOMORROW";
    }

    // Format as "MON, NOV 18"
    const dayName = selectedDate
      .toLocaleDateString("en-US", { weekday: "short" })
      .toUpperCase();
    const monthName = selectedDate
      .toLocaleDateString("en-US", { month: "short" })
      .toUpperCase();
    const dayNum = selectedDate.getUTCDate();
    return `${dayName}, ${monthName} ${dayNum}`;
  };

  const getWidgetContent = () => {
    if (!regionId) {
      return "Awaiting region selection";
    }
    if (error) {
      console.error("[WeatherForecastWidget] Error state:", error);
      return `Error: ${error instanceof Error ? error.message : "Failed to load forecast"}`;
    }
    if (isLoading || isFetching) {
      return <LoadingSpinner />;
    }
    if (!forecastData) {
      return "No forecast data available";
    }
    return null;
  };

  // Fix: Only show status message if there's an error condition
  const statusMessage =
    !regionId || isLoading || isFetching || !forecastData || error
      ? getWidgetContent()
      : null;

  return (
    <div
      className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 p-6"
      style={{
        borderColor: "rgba(28, 217, 255, 0.4)",
        boxShadow:
          "0 0 20px rgba(28, 217, 255, 0.25), 0 8px 32px rgba(0, 0, 0, 0.15)",
      }}
      data-forecast-widget
    >
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 inline-block relative border-l-2 border-r-2 border-[var(--color-tertiary)] flex-shrink min-w-0">
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[var(--color-tertiary)] rounded-full"></div>
            <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[var(--color-tertiary)] rounded-full"></div>
            <h3
              className={`font-primary font-bold text-sm sm:text-base md:text-lg text-white tracking-wide sm:tracking-wider truncate ${isLoading ? "animate-pulse" : ""}`}
            >
              {getForecastTitle()}
            </h3>
          </div>
          <div className="flex items-center justify-end flex-shrink-0">
            <div className="font-primary text-[var(--color-tertiary)] bg-gray-800/80 px-3 sm:px-4 py-1.5 rounded-[21px] text-xs sm:text-sm border border-[var(--color-tertiary)]/30 shadow-[0_0_10px_rgba(28,217,255,0.2)] whitespace-nowrap">
              8AM
            </div>
          </div>
        </div>

        {/* Source Selection */}
        <div className="flex flex-col gap-1.5">
          <h4 className="text-xs text-gray-400 font-primary uppercase tracking-wide">
            Sources
          </h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedSource("WINDFINDER")}
              className={`flex-1 px-2 py-1 rounded text-xs font-primary transition-all duration-200 ${
                selectedSource === "WINDFINDER"
                  ? "bg-[var(--color-tertiary)] text-white shadow-[0_0_10px_rgba(28,217,255,0.4)]"
                  : "bg-gray-800/80 text-gray-300 border border-gray-700 hover:border-[var(--color-tertiary)]/50"
              }`}
            >
              A
            </button>
            <button
              onClick={() => setSelectedSource("WINDGURU")}
              className={`flex-1 px-2 py-1 rounded text-xs font-primary transition-all duration-200 ${
                selectedSource === "WINDGURU"
                  ? "bg-[var(--color-tertiary)] text-white shadow-[0_0_10px_rgba(28,217,255,0.4)]"
                  : "bg-gray-800/80 text-gray-300 border border-gray-700 hover:border-[var(--color-tertiary)]/50"
              }`}
            >
              B
            </button>
            <button
              onClick={() => setSelectedSource("WINDY")}
              className={`flex-1 px-2 py-1 rounded text-xs font-primary transition-all duration-200 ${
                selectedSource === "WINDY"
                  ? "bg-[var(--color-tertiary)] text-white shadow-[0_0_10px_rgba(28,217,255,0.4)]"
                  : "bg-gray-800/80 text-gray-300 border border-gray-700 hover:border-[var(--color-tertiary)]/50"
              }`}
            >
              C
            </button>
          </div>
        </div>
      </div>

      {statusMessage ? (
        <div className="grid place-items-center h-[120px]">
          <div className="bg-gray-800/80 backdrop-blur-sm px-6 py-4 rounded-lg border border-gray-700 shadow-md">
            <div className="flex items-center space-x-3">
              <svg
                className="w-5 h-5 text-[var(--color-tertiary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-gray-300 font-primary">
                {statusMessage}
              </span>
            </div>
          </div>
        </div>
      ) : (
        // Grid Layout
        <div className="grid grid-cols-2 gap-4">
          {/* Wind Direction */}
          <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg border border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-200 aspect-square flex flex-col relative group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--color-tertiary)]/50 to-transparent"></div>
            <label className="text-xs text-[var(--color-tertiary)] uppercase tracking-wide mb-2 font-primary font-medium">
              Wind
            </label>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="space-y-2 text-center">
                <span className="text-2xl font-semibold text-white font-primary">
                  {degreesToCardinal(forecastData?.windDirection)}
                </span>
                <span className="block text-sm text-gray-300 font-primary">
                  {forecastData?.windDirection?.toFixed(1)}°
                </span>
                <span className="block text-sm text-gray-300 font-primary">
                  {forecastData?.windSpeed} kts
                </span>
              </div>
            </div>
          </div>

          {/* Swell Height */}
          <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg border border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-200 aspect-square flex flex-col relative group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--color-tertiary)]/50 to-transparent"></div>
            <label className="text-xs text-[var(--color-tertiary)] uppercase tracking-wide mb-2 font-primary font-medium">
              Swell Height
            </label>
            <div className="flex-1 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold text-white font-primary">
                {forecastData?.swellHeight}m
              </span>
            </div>
          </div>

          {/* Swell Period */}
          <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg border border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-200 aspect-square flex flex-col relative group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--color-tertiary)]/50 to-transparent"></div>
            <label className="text-xs text-[var(--color-tertiary)] uppercase tracking-wide mb-2 font-primary font-medium">
              Swell Period
            </label>
            <div className="flex-1 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold text-white font-primary">
                {forecastData?.swellPeriod}s
              </span>
            </div>
          </div>

          {/* Swell Direction */}
          <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg border border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-200 aspect-square flex flex-col relative group">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--color-tertiary)]/50 to-transparent"></div>
            <label className="text-xs text-[var(--color-tertiary)] uppercase tracking-wide mb-2 font-primary font-medium">
              Swell Direction
            </label>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="space-y-2 text-center">
                <span className="text-2xl font-semibold text-white font-primary">
                  {degreesToCardinal(forecastData?.swellDirection)}
                </span>
                <span className="block text-sm text-gray-300 font-primary">
                  {forecastData?.swellDirection}°
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
