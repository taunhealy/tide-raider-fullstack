// components/sidebar/WeatherForecastWidget.tsx
import { degreesToCardinal } from "@/app/lib/surfUtils";

interface WeatherForecastWidgetProps {
  windData: any;
}

export default function WeatherForecastWidget({
  windData,
}: WeatherForecastWidgetProps) {
  if (!windData) {
    return (
      <div className="col-span-2 flex items-center justify-center p-6">
        <span className="text-gray-300 font-primary text-center">
          No forecast data available. Please select a region to view forecast.
        </span>
      </div>
    );
  }

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
          <h3 className="font-primary font-bold text-lg md:text-xl text-white tracking-wider">
            TODAY'S FORECAST
          </h3>
        </div>
        <div className="flex items-center justify-end">
          <div className="font-primary text-[var(--color-tertiary)] bg-gray-800/80 px-4 py-1.5 rounded-[21px] text-sm border border-[var(--color-tertiary)]/30 shadow-[0_0_10px_rgba(28,217,255,0.2)]">
            8AM
          </div>
        </div>
      </div>

      {/* Grid Layout */}
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
                {degreesToCardinal(parseFloat(windData.windDirection)) || "N/A"}
              </span>
              <span className="block text-sm text-gray-300 font-primary">
                {typeof windData.windDirection === "number"
                  ? windData.windDirection.toFixed(1)
                  : "N/A"}
                °
              </span>
              <span className="block text-sm text-gray-300 font-primary">
                {typeof windData.windSpeed === "number"
                  ? `${windData.windSpeed} kts`
                  : "N/A"}
              </span>
            </div>
          </div>
          <div className="absolute inset-0 border border-[var(--color-tertiary)]/0 group-hover:border-[var(--color-tertiary)]/30 rounded-lg transition-all duration-300"></div>
        </div>

        {/* Swell Height */}
        <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg border border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-200 aspect-square flex flex-col relative group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--color-tertiary)]/50 to-transparent"></div>
          <label className="text-xs text-[var(--color-tertiary)] uppercase tracking-wide mb-2 font-primary font-medium">
            Swell Height
          </label>
          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-white font-primary">
              {typeof windData.swellHeight === "number"
                ? `${windData.swellHeight}m`
                : "N/A"}
            </span>
          </div>
          <div className="absolute inset-0 border border-[var(--color-tertiary)]/0 group-hover:border-[var(--color-tertiary)]/30 rounded-lg transition-all duration-300"></div>
        </div>

        {/* Swell Period */}
        <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg border border-gray-700 shadow-md hover:shadow-lg transition-shadow duration-200 aspect-square flex flex-col relative group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--color-tertiary)]/50 to-transparent"></div>
          <label className="text-xs text-[var(--color-tertiary)] uppercase tracking-wide mb-2 font-primary font-medium">
            Swell Period
          </label>
          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-white font-primary">
              {windData.swellPeriod || "N/A"}s
            </span>
          </div>
          <div className="absolute inset-0 border border-[var(--color-tertiary)]/0 group-hover:border-[var(--color-tertiary)]/30 rounded-lg transition-all duration-300"></div>
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
                {degreesToCardinal(windData.swellDirection) || "N/A"}
              </span>
              <span className="block text-sm text-gray-300 font-primary">
                {typeof windData.swellDirection === "number"
                  ? `${windData.swellDirection}°`
                  : "N/A"}
              </span>
            </div>
          </div>
          <div className="absolute inset-0 border border-[var(--color-tertiary)]/0 group-hover:border-[var(--color-tertiary)]/30 rounded-lg transition-all duration-300"></div>
        </div>
      </div>
    </div>
  );
}
