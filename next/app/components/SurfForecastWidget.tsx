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
      <div className="text-gray-600 font-primary">
        Sorry, no forecast data available. Please adjust filters, select a
        region or refresh.
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-100">
      <div className="bg-gray-50 p-2.5 rounded-lg space-y-1.5">
        <div className="flex flex-col gap-1.5">
          {/* Wind Speed Badge */}
          {forecast.windSpeed != null && (
            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-primary">
              <span className="mr-1">{getWindEmoji(forecast.windSpeed)}</span>
              <span>{forecast.windSpeed}kts</span>
            </div>
          )}

          {/* Wind Direction Badge */}
          {forecast.windDirection != null && (
            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-primary">
              <span>{degreesToCardinal(forecast.windDirection)}</span>
            </div>
          )}

          {/* Swell Height Badge */}
          {forecast.swellHeight != null && (
            <div className="inline-flex items-center bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full text-xs font-primary">
              <span className="mr-1">
                {getSwellEmoji(forecast.swellHeight)}
              </span>
              <span>{forecast.swellHeight}m</span>
            </div>
          )}

          {/* Swell Period Badge */}
          {forecast.swellPeriod != null && (
            <div className="inline-flex items-center bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full text-xs font-primary">
              <span>{forecast.swellPeriod}s</span>
            </div>
          )}

          {/* Swell Direction Badge */}
          {forecast.swellDirection != null && (
            <div className="inline-flex items-center bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full text-xs font-primary">
              <span>{degreesToCardinal(forecast.swellDirection)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
