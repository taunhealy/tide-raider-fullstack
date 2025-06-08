import { cn } from "@/app/lib/utils";
import SearchBar from "../SearchBar";

import { Region } from "@/app/types/beaches";
import { useBeach } from "@/app/context/BeachContext";

interface BeachHeaderControlsProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  regions: Region[];
}

export default function BeachHeaderControls({
  showFilters,
  setShowFilters,
  regions,
}: BeachHeaderControlsProps) {
  const { filters, setFilters } = useBeach();

  console.log("Current filters in HeaderControls:", filters);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-xl sm:text-2xl font-semi-bold text-[var(--color-text-primary)] font-primary">
            This Morning's Recommendations
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <SearchBar
            value={filters.searchQuery}
            onChange={(value) => {
              console.log("Search value changing to:", value);
              setFilters({ ...filters, searchQuery: value });
            }}
            placeholder="Search breaks..."
            className="w-full sm:w-auto flex-1"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
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
        </div>
      </div>
    </div>
  );
}
