"use client";

// components/sidebar/WeatherForecastWidget.tsx
import { useMemo, useEffect, useState } from "react";
import { degreesToCardinal } from "@/app/lib/surfUtils";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/app/lib/api-client";
import { useSubscription } from "@/app/providers/SubscriptionProvider";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { cn } from "@/app/lib/utils";

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
    <span className="text-gray-300 font-primary text-center text-[14px]">
      Dive in to see conditions. Zoom or select a region.
    </span>
  </div>
);

export default function WeatherForecastWidget() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const {
    filters: { regionId, forecastDate },
  } = useBeachFilters();
  const { isSubscribed, hasActiveTrial } = useSubscription();
  const isPremium = isSubscribed || hasActiveTrial;

  // Track if component is mounted to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  // Store selected source in localStorage so it's shared across components
  // Initialize to default to ensure server and client render the same
  const [selectedSource, setSelectedSource] =
    useState<ForecastSource>("WINDFINDER");

  // Load from localStorage only after mount (client-side only)
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("forecastSource");
      if (stored && ["WINDFINDER", "WINDGURU", "WINDY"].includes(stored)) {
        setSelectedSource(stored as ForecastSource);
      }
    }
  }, []);

  // Update localStorage when source changes (only after mount to prevent hydration issues)
  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      localStorage.setItem("forecastSource", selectedSource);
      // Dispatch custom event so other components can listen
      window.dispatchEvent(
        new CustomEvent("forecastSourceChanged", { detail: selectedSource })
      );
    }
  }, [selectedSource, mounted]);

  // Normalize date - use today's date if no date is selected
  // Use mounted state to ensure consistent date calculation between server and client
  const normalizedDate = useMemo(() => {
    if (forecastDate) {
      return forecastDate;
    }
    // Only calculate today's date after mount to prevent hydration mismatch
    // On server, return a placeholder that will be updated on client
    if (!mounted) {
      // Return a consistent placeholder for SSR - will be updated after mount
      return new Date().toISOString().split("T")[0];
    }
    // Default to today's date (only on client after mount)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return today.toISOString().split("T")[0];
  }, [forecastDate, mounted]);

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

  // Invalidate queries when date or source changes (but don't be too aggressive)
  // The query key change will automatically trigger a refetch, so we don't need to manually invalidate
  useEffect(() => {
    if (regionId && normalizedDate && mounted) {
      console.log("[WeatherForecastWidget] Date or source changed:", {
        regionId,
        normalizedDate,
        source: selectedSource,
      });
      // Only invalidate filtered-beaches when source changes (not on every date change)
      // The forecast query will automatically refetch due to query key change
      if (selectedSource) {
        queryClient.invalidateQueries({
          queryKey: ["filteredBeaches"],
          exact: false, // Invalidate all filteredBeaches queries
        });
      }
    }
  }, [regionId, normalizedDate, selectedSource, queryClient, mounted]);

  // Only enable query after mount to prevent hydration issues
  const queryEnabled = mounted && !!regionId && !!normalizedDate;

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
    staleTime: 60 * 1000, // Data is fresh for 1 minute - reduces unnecessary refetches
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cached data if available - faster loading
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes - improves performance
    retry: 2, // Retry twice on failure
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff, max 30s
    networkMode: "online", // Only run query when online
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
  // Use useMemo to ensure consistent calculation and prevent hydration issues
  const forecastTitle = useMemo(() => {
    if (!forecastDate) {
      return "TODAY";
    }

    // Only calculate date comparisons after mount to prevent hydration mismatch
    if (!mounted) {
      return "TODAY"; // Return consistent default for SSR
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
  }, [forecastDate, mounted]);

  const getWidgetContent = () => {
    if (!regionId) {
      return "Awaiting region selection";
    }
    if (error) {
      console.error("[WeatherForecastWidget] Error state:", error);
      // Don't show error message - just show "No forecast data available"
      // The error is likely a 404 (no data), which is expected
      return "No forecast data available";
    }
    if (isLoading || isFetching) {
      return <LoadingSpinner />;
    }
    if (!forecastData) {
      // Show which source doesn't have data
      const sourceLabel =
        selectedSource === "WINDFINDER"
          ? "A"
          : selectedSource === "WINDGURU"
            ? "B"
            : "C";
      return `No data for source ${sourceLabel}`;
    }
    return null;
  };

  // Fix: Only show status message if there's an error condition
  const statusMessage =
    !regionId || isLoading || isFetching || !forecastData || error
      ? getWidgetContent()
      : null;

  // Mobile compact bar version
  const mobileBarHeight = "h-12"; // Same height for both bars

  return (
    <>
      {/* Mobile Compact Bar Version - Show below region selection on mobile only */}
      <div
        className={`lg:hidden bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 ${mobileBarHeight}`}
        style={{
          borderColor: "rgba(28, 217, 255, 0.4)",
          boxShadow:
            "0 0 20px rgba(28, 217, 255, 0.25), 0 8px 32px rgba(0, 0, 0, 0.15)",
        }}
        data-forecast-widget-mobile
      >
        {/* Sources Bar */}
        <div className="flex items-center h-full px-3 gap-2">
          <span className="text-xs text-gray-400 font-primary uppercase tracking-wide whitespace-nowrap">
            Sources:
          </span>
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={() => setSelectedSource("WINDFINDER")}
              className={`flex-1 ${mobileBarHeight} px-3 rounded text-xs font-primary transition-all duration-200 ${
                selectedSource === "WINDFINDER"
                  ? "bg-[var(--color-tertiary)] text-white shadow-lg shadow-[var(--color-tertiary)]/30"
                  : "bg-gray-700/80 text-gray-300 border border-gray-700 hover:border-[var(--color-tertiary)]/50"
              }`}
            >
              A
            </button>
            <button
              onClick={() => setSelectedSource("WINDGURU")}
              className={`relative flex flex-1 items-center justify-center gap-0.5 ${mobileBarHeight} px-3 rounded text-xs font-primary transition-all duration-200 ${
                selectedSource === "WINDGURU"
                  ? "bg-[var(--color-tertiary)] text-white shadow-lg shadow-[var(--color-tertiary)]/30"
                  : "bg-gray-800/80 text-gray-300 border border-gray-700 hover:border-[var(--color-tertiary)]/50"
              }`}
            >
              B
            </button>
            <button
              onClick={() => setSelectedSource("WINDY")}
              className={`relative flex-1 ${mobileBarHeight} px-3 rounded text-xs font-primary transition-all duration-200 ${
                selectedSource === "WINDY"
                  ? "bg-[var(--color-tertiary)] text-white shadow-lg shadow-[var(--color-tertiary)]/30"
                  : "bg-gray-800/80 text-gray-300 border border-gray-700 hover:border-[var(--color-tertiary)]/50"
              }`}
            >
              C
            </button>
          </div>
        </div>
      </div>

      {/* Forecast Conditions Bar - Below Sources Bar */}
      {regionId && forecastData && !isLoading && !error ? (
        <div
          className={`lg:hidden bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 ${mobileBarHeight} mt-2`}
          style={{
            borderColor: "rgba(28, 217, 255, 0.4)",
            boxShadow:
              "0 0 20px rgba(28, 217, 255, 0.25), 0 8px 32px rgba(0, 0, 0, 0.15)",
          }}
        >
          <div className="flex items-center h-full px-3 gap-3 overflow-x-auto">
            {/* Wind */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-[var(--color-tertiary)] font-primary uppercase tracking-wide whitespace-nowrap">
                Wind:
              </span>
              <span className="text-xs font-semibold text-white font-primary whitespace-nowrap">
                {degreesToCardinal(forecastData?.windDirection)}{" "}
                {forecastData?.windSpeed}kts
              </span>
            </div>

            {/* Swell Height */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-[var(--color-tertiary)] font-primary uppercase tracking-wide whitespace-nowrap">
                Swell:
              </span>
              <span className="text-xs font-semibold text-white font-primary whitespace-nowrap">
                {forecastData?.swellHeight}m
              </span>
            </div>

            {/* Swell Period */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-[var(--color-tertiary)] font-primary uppercase tracking-wide whitespace-nowrap">
                Period:
              </span>
              <span className="text-xs font-semibold text-white font-primary whitespace-nowrap">
                {forecastData?.swellPeriod}s
              </span>
            </div>

            {/* Swell Direction */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-[var(--color-tertiary)] font-primary uppercase tracking-wide whitespace-nowrap">
                Dir:
              </span>
              <span className="text-xs font-semibold text-white font-primary whitespace-nowrap">
                {degreesToCardinal(forecastData?.swellDirection)}
              </span>
            </div>
          </div>
        </div>
      ) : regionId && (isLoading || isFetching) ? (
        <div
          className={`lg:hidden bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 ${mobileBarHeight} mt-2 flex items-center justify-center`}
          style={{
            borderColor: "rgba(28, 217, 255, 0.4)",
          }}
        >
          <span className="text-xs text-gray-400 font-primary">
            Loading forecast...
          </span>
        </div>
      ) : regionId && error ? (
        <div
          className={`lg:hidden bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 ${mobileBarHeight} mt-2 flex items-center justify-center`}
          style={{
            borderColor: "rgba(28, 217, 255, 0.4)",
          }}
        >
          <span className="text-xs text-gray-400 font-primary">
            No forecast data
          </span>
        </div>
      ) : null}

      {/* Desktop Full Widget Version */}
      <div
        className="hidden lg:block bg-gray-900 rounded-2xl shadow-2xl border border-white/5 p-6"
        data-forecast-widget
      >
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-600/20 rounded flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              </div>
              <h3 className="font-primary text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">
                {forecastTitle}
              </h3>
            </div>
            <div className="flex items-center justify-end flex-shrink-0">
              <div className="font-primary text-white/40 bg-white/5 px-3 py-1.5 rounded-lg text-[10px] font-black border border-white/5 whitespace-nowrap uppercase tracking-widest">
                08:00 UTC
              </div>
            </div>
          </div>

          <div className="h-px bg-white/5 w-full my-1" />

          {/* Source Selection */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">
              Data Source
            </h4>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedSource("WINDFINDER")}
                className={cn(
                  "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  selectedSource === "WINDFINDER"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "bg-white/5 text-white/40 hover:bg-white/10"
                )}
              >
                Alpha
              </button>
              <button
                onClick={() => setSelectedSource("WINDGURU")}
                className={cn(
                  "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  selectedSource === "WINDGURU"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "bg-white/5 text-white/40 hover:bg-white/10"
                )}
              >
                Beta
              </button>
              <button
                onClick={() => setSelectedSource("WINDY")}
                className={cn(
                  "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  selectedSource === "WINDY"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "bg-white/5 text-white/40 hover:bg-white/10"
                )}
              >
                Gamma
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
                <span className="text-gray-300 font-primary text-[14px]">
                  {statusMessage}
                </span>
              </div>
            </div>
          </div>
        ) : (
          // Grid Layout
          <div className="grid grid-cols-2 gap-4">
            {/* Wind Direction */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1 group overflow-hidden relative">
              <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-600 opacity-20 group-hover:opacity-100 transition-opacity" />
              <span className="text-[24px] font-black text-white tracking-tighter">
                {degreesToCardinal(forecastData?.windDirection)}
              </span>
              <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] font-primary">
                Wind {forecastData?.windSpeed}kts
              </label>
            </div>

            {/* Swell Height */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center gap-1 group overflow-hidden relative">
              <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-600 opacity-20 group-hover:opacity-100 transition-opacity" />
              <span className="text-[24px] font-black text-white tracking-tighter">
                {forecastData?.swellHeight}m
              </span>
              <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] font-primary">
                Swell Height
              </label>
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
    </>
  );
}
