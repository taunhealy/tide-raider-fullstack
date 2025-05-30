// components/forecast/ForecastSummary.tsx
import { degreesToCardinal } from "@/app/lib/surfUtils";
import { format } from "date-fns";
import { RandomLoader } from "../ui/random-loader";
import DataLoadingProgress from "../DataLoadingProgress";
import { ForecastData } from "@/app/types/forecast";

interface ForecastSummaryProps {
  windData: ForecastData | null;
  isLoading: boolean;
  windError: string | null;
}

export default function ForecastSummary({
  windData,
  isLoading,
  windError,
}: ForecastSummaryProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <RandomLoader isLoading={isLoading} />
        <DataLoadingProgress isLoading={isLoading} />
      </div>
    );
  }

  if (windError) {
    return (
      <div className="text-red-600 font-primary text-sm">
        Forecast loading failed
      </div>
    );
  }

  if (!windData) {
    return (
      <div className="text-yellow-600 font-primary text-sm">
        Please select a region to view a region's forecast.
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 font-primary bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-gray-800">🌬️ Wind</span>
        <span>{degreesToCardinal(windData.windDirection) || "N/A"}</span>
        <span>{windData.windSpeed}kts</span>
      </div>

      <div className="hidden sm:block h-4 w-px bg-gray-300" />

      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-gray-800">🌊 Swell</span>
        <span>{windData.swellHeight}m</span>
        <span>@{windData.swellPeriod}s</span>
        <span>{degreesToCardinal(windData.swellDirection)}</span>
      </div>

      <div className="hidden sm:block h-4 w-px bg-gray-300" />

      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-gray-800">⏱️ Time</span>
        <span>{format(new Date(), "haaa")}</span>
      </div>
    </div>
  );
}
