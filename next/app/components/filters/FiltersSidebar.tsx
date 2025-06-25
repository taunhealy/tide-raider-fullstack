"use client";

import type { FilterType, Difficulty, CrimeLevel } from "@/app/types/beaches";
import { useBeachAttributes } from "@/app/hooks/useBeachAttributes";

interface FiltersSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterType;
  onFilterChange: (newFilters: FilterType) => void;
  beaches: Beach[];
}

export default function FiltersSidebar({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  beaches,
}: FiltersSidebarProps) {
  const { waveTypes } = useBeachAttributes(beaches);

  const toggleArrayFilter = <T extends string>(
    key: keyof FilterType,
    value: T
  ) => {
    const currentValues = filters[key] as T[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    onFilterChange({
      ...filters,
      [key]: newValues,
    });
  };

  return (
    <div
      className={`fixed inset-y-0 right-0 w-80 z-50 bg-white shadow-lg transform transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ pointerEvents: isOpen ? "auto" : "none" }}
    >
      <div className="bg-white p-4 sm:p-6">
        <div className="space-y-6">
          {/* Wave Type Filter */}
          <div className="space-y-2">
            <h6 className="heading-6 font-primary">Wave Type</h6>
            <div className="flex flex-wrap gap-2">
              {waveTypes.map((waveType) => (
                <button
                  key={waveType}
                  onClick={() => toggleArrayFilter("waveType", waveType)}
                  className={`px-3 py-1 rounded-full text-sm font-primary ${
                    filters.waveType.includes(waveType)
                      ? "bg-cyan-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {waveType}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="space-y-2">
            <h6 className="heading-6 font-primary">Difficulty</h6>
            <div className="flex flex-wrap gap-2">
              {["Beginner", "Intermediate", "Advanced"].map((level) => (
                <button
                  key={level}
                  onClick={() =>
                    toggleArrayFilter("difficulty", level as Difficulty)
                  }
                  className={`px-3 py-1 rounded-full text-sm font-primary ${
                    filters.difficulty.includes(level as Difficulty)
                      ? "bg-cyan-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Crime Level Filter */}
          <div className="space-y-2">
            <h6 className="heading-6 font-primary">Crime Level</h6>
            <div className="flex flex-wrap gap-2">
              {["Low", "Medium", "High"].map((level) => (
                <button
                  key={level}
                  onClick={() =>
                    toggleArrayFilter<CrimeLevel>(
                      "crimeLevel",
                      level as CrimeLevel
                    )
                  }
                  className={`px-3 py-1 rounded-full text-sm font-primary ${
                    filters.crimeLevel.includes(level as CrimeLevel)
                      ? "bg-cyan-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Shark Attack Filter */}
          <div className="space-y-2">
            <h6 className="heading-6 font-primary">Shark Attack</h6>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sharkAttack"
                checked={filters.sharkAttack.includes("true")}
                onChange={(e) => {
                  onFilterChange({
                    ...filters,
                    sharkAttack: e.target.checked ? ["true"] : [],
                  });
                }}
                className="h-4 w-4 text-cyan-600 border-gray-300 rounded"
              />
              <label
                htmlFor="sharkAttack"
                className="ml-2 text-sm text-gray-700 font-primary"
              >
                Only show beaches with shark attacks
              </label>
            </div>
          </div>

          {/* Minimum Points */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h6 className="heading-6 font-primary">Minimum Rating</h6>
              <span className="text-sm text-gray-500 font-primary">
                {filters.minPoints} {filters.minPoints === 1 ? "star" : "stars"}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={filters.minPoints}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  minPoints: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
          </div>

          {/* Save Filters button */}
          <button
            onClick={() => {
              // Add any save filters logic here if needed
            }}
            className="w-full px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors font-primary"
          >
            Save Filters
          </button>

          {/* Clear All Filters */}
          <button
            onClick={() => {
              onFilterChange({
                ...filters,
                waveType: [],
                difficulty: [],
                crimeLevel: [],
                minPoints: 0,
                sharkAttack: [],
                searchQuery: "",
              });
            }}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-primary"
          >
            Clear All Filters
          </button>

          {/* Add close button */}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-primary mt-4"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
