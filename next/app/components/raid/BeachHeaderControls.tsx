import { useAppDispatch, useAppSelector } from "@/app/redux/hooks";
import { setSearchQuery } from "@/app/redux/slices/filterSlice";
import { setSidebarOpen, setViewMode } from "@/app/redux/slices/uiSlice";
import { cn } from "@/app/lib/utils";
import SearchBar from "../SearchBar";
import { List, Map as MapIcon } from "lucide-react";

export default function BeachHeaderControls() {
  const dispatch = useAppDispatch();
  const { searchQuery, ...filters } = useAppSelector((state) => state.filters);
  const { isSidebarOpen, viewMode } = useAppSelector((state) => state.ui);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-9">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-xl sm:text-2xl font-semi-bold text-[var(--color-text-primary)] font-primary">
          This Morning's Recommendations
        </h3>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={() => dispatch(setSidebarOpen(!isSidebarOpen))}
          className={cn(
            "font-primary",
            "text-black font-semibold",
            "bg-white border border-gray-200",
            "px-4 py-1",
            "rounded-[21px]",
            "flex items-center gap-2",
            "hover:bg-gray-50 transition-colors",
            "w-full sm:w-auto justify-center sm:justify-start"
          )}
        >
          <span>Filters</span>
          {Object.values(filters).some((f) =>
            Array.isArray(f) ? f.length > 0 : f !== 0
          ) && (
            <span className="w-2 h-2 rounded-full bg-[var(--color-bg-tertiary)]" />
          )}
        </button>

        <SearchBar
          value={searchQuery}
          onChange={(value) => dispatch(setSearchQuery(value))}
          placeholder="Search by name, region or description..."
          className="font-primary w-full sm:w-auto"
        />

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-white rounded-md border border-gray-200 mt-3 sm:mt-0">
          <button
            onClick={() => dispatch(setViewMode("list"))}
            className={cn(
              "p-2 rounded-l-md",
              viewMode === "list" ? "bg-gray-100" : "hover:bg-gray-50"
            )}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => dispatch(setViewMode("map"))}
            className={cn(
              "p-2 rounded-r-md",
              viewMode === "map" ? "bg-gray-100" : "hover:bg-gray-50"
            )}
          >
            <MapIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
