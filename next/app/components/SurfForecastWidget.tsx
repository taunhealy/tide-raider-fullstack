import { degreesToCardinal } from "@/app/lib/surfUtils";
import { useState, useEffect } from "react";
import type { CoreForecastData } from "@/app/types/forecast";

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
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
      <div className="grid gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-primary">Wind</span>
            <div className="text-right">
              <span className="font-primary text-gray-900">
                {typeof forecast.windDirection === "number" &&
                forecast.windDirection > 0
                  ? degreesToCardinal(forecast.windDirection)
                  : "N/A"}
              </span>
              <div className="text-sm font-primary text-gray-700">
                {typeof forecast.windSpeed === "number" &&
                forecast.windSpeed > 0
                  ? `${forecast.windSpeed} kts`
                  : "N/A"}
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-primary">Swell</span>
            <div className="text-right">
              <span className="font-primary text-gray-900">
                {typeof forecast.swellHeight === "number" &&
                forecast.swellHeight > 0
                  ? `${forecast.swellHeight}m`
                  : "N/A"}
              </span>
              <div className="text-sm font-primary text-gray-700">
                {typeof forecast.swellPeriod === "number" &&
                forecast.swellPeriod > 0
                  ? `${forecast.swellPeriod}s period`
                  : "N/A"}
              </div>
              <div className="text-sm font-primary text-gray-700">
                {typeof forecast.swellDirection === "number" &&
                forecast.swellDirection > 0
                  ? degreesToCardinal(forecast.swellDirection)
                  : "N/A"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
