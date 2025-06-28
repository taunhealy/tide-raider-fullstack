"use client";

// components/sidebar/WeatherForecastWidget.tsx
import { useEffect } from "react";
import { degreesToCardinal } from "@/app/lib/surfUtils";
import { CoreForecastData } from "@/app/types/forecast";
import { useBeachData } from "@/app/hooks/useBeachData";
import { useSearchParams } from "next/navigation";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface WeatherForecastWidgetProps {
  regionId: string;
  regionName: string;
  forecastData: CoreForecastData | null;
  isLoading: boolean;
}

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
      No forecast data available. Please select a region to view forecast.
    </span>
  </div>
);

export default function WeatherForecastWidget() {
  const searchParams = useSearchParams();
  const { forecastData, isLoading } = useBeachData();

  const regionId = searchParams.get("regionId");
  const regionName = searchParams.get("region");

  const getWidgetContent = () => {
    if (!regionId) {
      return "Please select a region to view forecast";
    }
    if (isLoading) {
      return <LoadingSpinner />;
    }
    if (!forecastData) {
      return "No forecast data available";
    }
    return null;
  };

  const statusMessage = getWidgetContent();

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg px-5 py-2 inline-block relative border-l-2 border-r-2 border-[var(--color-tertiary)]">
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[var(--color-tertiary)] rounded-full"></div>
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[var(--color-tertiary)] rounded-full"></div>
          <h3
            className={`font-primary font-bold text-lg md:text-xl text-white tracking-wider ${isLoading ? "animate-pulse" : ""}`}
          >
            {"TODAY'S FORECAST"}
          </h3>
        </div>
        <div className="flex items-center justify-end">
          <div className="font-primary text-[var(--color-tertiary)] bg-gray-800/80 px-4 py-1.5 rounded-[21px] text-sm border border-[var(--color-tertiary)]/30 shadow-[0_0_10px_rgba(28,217,255,0.2)]">
            8AM
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
                  {degreesToCardinal(forecastData!.windDirection)}
                </span>
                <span className="block text-sm text-gray-300 font-primary">
                  {forecastData!.windDirection.toFixed(1)}°
                </span>
                <span className="block text-sm text-gray-300 font-primary">
                  {forecastData!.windSpeed} kts
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
                {forecastData!.swellHeight}m
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
                {forecastData!.swellPeriod}s
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
                  {degreesToCardinal(forecastData!.swellDirection)}
                </span>
                <span className="block text-sm text-gray-300 font-primary">
                  {forecastData!.swellDirection}°
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
