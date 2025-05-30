// app/components/StickyForecastWidget.tsx
"use client";

import { useAppSelector } from "@/app/redux/hooks";
import { WindData } from "@/app/types/wind";
import {
  getWindEmoji,
  getSwellEmoji,
  getDirectionEmoji,
  degreesToCardinal,
} from "@/app/lib/forecastUtils";
import { cn } from "@/app/lib/utils";

export default function StickyForecastWidget() {
  const { data: windData } = useAppSelector((state) => state.forecast);
  const { selectedRegion } = useAppSelector((state) => state.filters);

  // Format the data for display
  const forecast = windData
    ? {
        date: new Date(),
        region: selectedRegion || "Global",
        windSpeed: windData.windSpeed || 0,
        windDirection: windData.windDirection || 0,
        swellHeight: windData.swellHeight || 0,
        swellPeriod: windData.swellPeriod || 0,
        swellDirection: windData.swellDirection || 0,
      }
    : {
        date: new Date(),
        region: "Global",
        windSpeed: 0,
        windDirection: 0,
        swellHeight: 0,
        swellPeriod: 0,
        swellDirection: 0,
      };

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-white rounded-lg shadow-lg p-3 border border-gray-200 max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold font-primary">Today's Forecast</h4>
        <span className="text-xs text-gray-500 font-primary">
          {forecast.region}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center">
          <span className="text-gray-500 mr-1">Wind:</span>
          <span>{forecast.windSpeed} kts</span>
        </div>
        <div className="flex items-center">
          <span className="text-gray-500 mr-1">Direction:</span>
          <span>{forecast.windDirection}°</span>
        </div>
        <div className="flex items-center">
          <span className="text-gray-500 mr-1">Swell:</span>
          <span>{forecast.swellHeight}m</span>
        </div>
        <div className="flex items-center">
          <span className="text-gray-500 mr-1">Period:</span>
          <span>{forecast.swellPeriod}s</span>
        </div>
      </div>
    </div>
  );
}
