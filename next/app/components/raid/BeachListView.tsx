import { useAppSelector, useAppDispatch } from "@/app/redux/hooks";
import { setCurrentPage } from "@/app/redux/slices/uiSlice";
import { setFilters } from "@/app/redux/slices/filterSlice";
import {
  selectBeachAttributes,
  selectFilteredBeaches,
} from "@/app/redux/selectors";
import { useSubscription } from "@/app/context/SubscriptionContext";
import { usePagination } from "@/app/hooks/usePagination";
import { ForecastData } from "@/app/types/forecast";
import WaveTypeFilter from "../filters/WaveTypeFilters";
import ForecastSummary from "../forecast/ForecastSummary";
import BeachCard from "../BeachCard";
import Pagination from "../common/Pagination";
import FunFacts from "../FunFacts";
import RegionFilter from "../RegionFilter";
import type { Beach } from "@/app/types/beaches";
import type { BeachWithScore } from "@/app/types/scores";

interface BeachListViewProps {
  isLoading: boolean;
  forecastData: ForecastData | null;
  selectedRegion: string | null;
  onRegionChange: (region: string | null) => void;
  handleBeachClick?: (beach: Beach) => void;
  beaches: BeachWithScore[];
}

export default function BeachListView({
  beaches,
  isLoading,
  forecastData,
  selectedRegion,
  onRegionChange,
  handleBeachClick,
}: BeachListViewProps) {
  const dispatch = useAppDispatch();
  const { isSubscribed } = useSubscription();
  const filters = useAppSelector((state) => state.filters);
  const { currentPage } = useAppSelector((state) => state.ui);
  const { waveTypes } = useAppSelector(selectBeachAttributes);

  // Pagination
  const { currentItems, totalPages } = usePagination(beaches, currentPage, 18);

  // Add detailed logging
  console.log("🔍 BeachListView Detailed Props:", {
    beachesLength: beaches?.length || 0,
    firstBeach: beaches?.[0]
      ? {
          id: beaches[0].id,
          name: beaches[0].name,
          region: beaches[0].region,
          score: beaches[0].score,
          // Log critical scoring fields
          optimalWindDirections: beaches[0].optimalWindDirections,
          swellSize: beaches[0].swellSize,
          optimalSwellDirections: beaches[0].optimalSwellDirections,
          idealSwellPeriod: beaches[0].idealSwellPeriod,
        }
      : null,
    selectedRegion,
    forecastDataPresent: !!forecastData,
    forecastDetails: forecastData
      ? {
          windSpeed: forecastData.windSpeed,
          windDirection: forecastData.windDirection,
          swellHeight: forecastData.swellHeight,
          swellPeriod: forecastData.swellPeriod,
          swellDirection: forecastData.swellDirection,
        }
      : null,
  });

  console.log("🏖️ BeachListView rendering with:", {
    totalBeaches: beaches.length,
    selectedRegion,
    forecastDataPresent: !!forecastData,
  });

  console.log("Beaches before filtering:", beaches.length);
  console.log("Current filters:", filters);
  console.log("Beaches after pagination:", currentItems.length);

  console.log(
    "Raw beaches data:",
    beaches.map((b) => ({
      id: b.id,
      name: b.name,
      optimalWindDirections: b.optimalWindDirections,
      swellSize: b.swellSize,
      optimalSwellDirections: b.optimalSwellDirections,
      idealSwellPeriod: b.idealSwellPeriod,
    }))
  );

  return (
    <>
      <WaveTypeFilter
        waveTypes={waveTypes}
        selectedWaveTypes={filters.waveType}
        onWaveTypeChange={(newWaveTypes) =>
          dispatch(setFilters({ ...filters, waveType: newWaveTypes }))
        }
      />

      <div className="mb-6">
        <ForecastSummary
          windData={forecastData}
          isLoading={isLoading}
          windError={null}
        />
      </div>

      {/* Region filters - now pass props */}
      <div className="mb-6">
        <RegionFilter
          selectedRegion={selectedRegion}
          onRegionChange={onRegionChange}
        />
      </div>

      {beaches.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[var(--color-text-primary)] text-left max-w-[34ch] font-primary">
            {selectedRegion
              ? `No beaches found in ${selectedRegion}. Please select a different region.`
              : "Please select a region to view beaches."}
          </p>
        </div>
      ) : (
        <>
          {/* Forecast Source Toggle */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[21px] heading-6 text-gray-800 font-primary">
              Breaks
            </h3>
            <div className="flex items-center gap-2">
              {/* Source Toggle Buttons */}
            </div>
          </div>

          {/* Beach Grid - Integrated directly */}
          <div className="grid grid-cols-1 gap-[16px]">
            {currentItems.map((beach, index) => (
              <BeachCard
                key={beach.name}
                beach={beach}
                isFirst={index === 0}
                isLoading={isLoading}
                index={index}
                forecastData={forecastData}
                beachScore={{ score: beach.score }}
                onClick={() => handleBeachClick?.(beach)}
              />
            ))}
          </div>

          {/* Pagination */}
          {(isSubscribed ? totalPages > 1 : false) && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => dispatch(setCurrentPage(page))}
            />
          )}
        </>
      )}

      {/* Move Fun Facts below beach cards */}
      <div className="lg:hidden mt-6">
        <FunFacts />
      </div>
    </>
  );
}
