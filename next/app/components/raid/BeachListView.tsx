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
import BeachGrid from "../BeachGrid";
import Pagination from "../common/Pagination";
import FunFacts from "../FunFacts";
import RegionFilter from "../RegionFilter";

interface BeachListViewProps {
  handleBeachClick?: (beach: any) => void;
}

export default function BeachListView({
  handleBeachClick,
}: BeachListViewProps) {
  const dispatch = useAppDispatch();
  const { isSubscribed } = useSubscription();

  // Get data from Redux using selectors
  const { waveTypes, uniqueRegions, uniqueContinents, uniqueCountries } =
    useAppSelector(selectBeachAttributes);

  const filters = useAppSelector((state) => state.filters);
  const { currentPage } = useAppSelector((state) => state.ui);

  // Use the selector to get properly filtered and sorted beaches
  const filteredBeaches = useAppSelector(selectFilteredBeaches);

  // Get beach scores from Redux
  const { allBeaches, regionCounts, beachScores } = useAppSelector(
    (state) => state.beaches
  );

  // Use proper typing for forecast data
  const { data, loading, error } = useAppSelector((state) => state.forecast);

  // Cast to proper type
  const forecastData = data as ForecastData | null;
  const isLoading = loading;
  const windError = error;

  // Pagination
  const { currentItems, totalPages } = usePagination(
    filteredBeaches,
    currentPage,
    18
  );

  return (
    <>
      {/* Wave Type Icons */}
      <WaveTypeFilter
        waveTypes={waveTypes}
        selectedWaveTypes={filters.waveType}
        onWaveTypeChange={(newWaveTypes) =>
          dispatch(setFilters({ ...filters, waveType: newWaveTypes }))
        }
      />

      {/* Forecast widget */}
      <div className="mb-6">
        <ForecastSummary
          windData={forecastData}
          isLoading={isLoading}
          windError={windError}
        />
      </div>

      {/* Region filters */}
      <div className="mb-6">
        <RegionFilter />
      </div>

      {filteredBeaches.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[var(--color-text-primary)] text-left max-w-[34ch] font-primary">
            No beaches match filters. Try adjusting the filters or your search
            query.
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

          {/* Beach Grid */}
          <BeachGrid
            beaches={currentItems}
            isLoading={isLoading}
            onBeachClick={
              handleBeachClick ||
              ((beach) => console.log("Beach clicked:", beach))
            }
          />

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
