"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux/hooks";
import { setSidebarOpen } from "@/app/redux/slices/uiSlice";
import {
  setFilters,
  updateFilter,
  setMinPoints,
  saveDefaultFilters,
  setSelectedRegion,
} from "@/app/redux/slices/filterSlice";
import RegionFilter from "@/app/components/RegionFilter";
import { useState } from "react";
import { Difficulty, CrimeLevel, FilterType } from "@/app/types/beaches";

export default function FilterSidebar() {
  const dispatch = useAppDispatch();
  const { isSidebarOpen } = useAppSelector((state) => state.ui);
  const filters = useAppSelector((state) => state.filters);
  const { waveTypes } = useAppSelector((state) =>
    state.beaches.allBeaches
      ? {
          waveTypes: Array.from(
            new Set(state.beaches.allBeaches.map((beach) => beach.waveType))
          ).filter(Boolean),
        }
      : { waveTypes: [] }
  );

  const toggleArrayFilter = (key: keyof FilterType, value: string) => {
    const currentValues = filters[key] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    dispatch(updateFilter({ key, value: newValues }));
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-black/50 transform ${isSidebarOpen ? "translate-x-0" : "translate-x-full"} transition-transform duration-300 ease-in-out`}
    >
      <div className="absolute right-0 top-0 h-full w-80 sm:w-96 bg-white overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 font-primary">
              Filters
            </h2>
            <button
              onClick={() => dispatch(setSidebarOpen(false))}
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="sr-only">Close</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Region Filter */}
            <RegionFilter />

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
                      toggleArrayFilter("crimeLevel", level as CrimeLevel)
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
                    dispatch(
                      updateFilter({
                        key: "sharkAttack",
                        value: e.target.checked ? ["true"] : [],
                      })
                    );
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
                  {filters.minPoints}{" "}
                  {filters.minPoints === 1 ? "star" : "stars"}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={filters.minPoints}
                onChange={(e) =>
                  dispatch(setMinPoints(parseFloat(e.target.value)))
                }
                className="w-full"
              />
            </div>

            {/* Save Filters button */}
            <button
              onClick={() => dispatch(saveDefaultFilters())}
              className="w-full px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors font-primary"
            >
              Save Default Filters
            </button>

            {/* Clear All Filters */}
            <button
              onClick={() =>
                dispatch(
                  setFilters({
                    continent: [],
                    country: [],
                    waveType: [],
                    difficulty: [],
                    region: [],
                    crimeLevel: [],
                    minPoints: 0,
                    sharkAttack: [],
                    searchQuery: "",
                    selectedRegion: null,
                  })
                )
              }
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-primary"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
