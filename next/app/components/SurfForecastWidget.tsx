import { useState, useEffect } from "react";
import type { CoreForecastData } from "@/app/types/forecast";
import {
  getWindEmoji,
  getSwellEmoji,
  degreesToCardinal,
} from "@/app/lib/forecastUtils";

interface SurfForecastWidgetProps {
  forecast: CoreForecastData;
}

export default function SurfForecastWidget({
  forecast,
}: SurfForecastWidgetProps) {
  useEffect(() => {
    console.log("Forecast Data:", forecast);
  }, [forecast]);

  if (!forecast) {
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-100 flex items-center justify-center min-h-[100px]">
        <span className="text-gray-400 text-sm italic">No forecast data available</span>
      </div>
    );
  }

  // Helper function to check if value is 'unknown'
  const isUnknown = (value: any): boolean => {
    return value === 'unknown' || value === null || value === undefined;
  };

  // Helper function to format value (show 'unknown' if missing)
  const formatValue = (value: any, suffix: string = ''): string => {
    if (isUnknown(value)) {
      return 'unknown';
    }
    return `${value}${suffix}`;
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-100">
      <div className="bg-gray-50 p-2.5 rounded-lg space-y-1.5">
        <div className="flex flex-col gap-1.5">
          {/* Wind Speed Badge */}
          <div className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-primary">
            {!isUnknown(forecast.windSpeed) && (
              <span className="mr-1">{getWindEmoji(forecast.windSpeed)}</span>
            )}
            <span>{formatValue(forecast.windSpeed, 'kts')}</span>
          </div>

          {/* Wind Direction Badge */}
          <div className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-primary">
            <span>
              {isUnknown(forecast.windDirection)
                ? 'unknown'
                : degreesToCardinal(forecast.windDirection)}
            </span>
          </div>

          {/* Swell Height Badge */}
          <div className="inline-flex items-center bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full text-xs font-primary">
            {!isUnknown(forecast.swellHeight) && (
              <span className="mr-1">
                {getSwellEmoji(forecast.swellHeight)}
              </span>
            )}
            <span>{formatValue(forecast.swellHeight, 'm')}</span>
          </div>

          {/* Swell Period Badge */}
          <div className="inline-flex items-center bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full text-xs font-primary">
            <span>{formatValue(forecast.swellPeriod, 's')}</span>
          </div>

          {/* Swell Direction Badge */}
          <div className="inline-flex items-center bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full text-xs font-primary">
            <span>
              {isUnknown(forecast.swellDirection)
                ? 'unknown'
                : degreesToCardinal(forecast.swellDirection)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
