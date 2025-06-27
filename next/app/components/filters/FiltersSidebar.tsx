"use client";

import { useBeachAttributes } from "@/app/hooks/useBeachAttributes";
import { useBeachData } from "@/app/hooks/useBeachData";
import { Difficulty } from "@/app/types/beaches";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onFilterUpdate: (filterType: string, value: string | string[]) => void;
  currentFilters: {
    waveTypes: string[];
    difficulty: Difficulty[];
    hasSharkAlert: boolean;
  };
}

export default function FilterSidebar({ isOpen, onClose }: FilterSidebarProps) {
  const { beaches } = useBeachData();
  const { waveTypes } = useBeachAttributes(beaches as any);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const updateParams = (updates: { key: string; value: string | null }[]) => {
    const params = new URLSearchParams(searchParams);
    updates.forEach(({ key, value }) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleFilter = (key: string, value: string) => {
    const current = searchParams.get(key)?.split(",") || [];
    const isSelected = current.includes(value);
    const updated = isSelected
      ? current.filter((v) => v !== value)
      : [...current, value];

    updateParams([
      {
        key,
        value: updated.length ? updated.join(",") : null,
      },
    ]);
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? "" : "hidden"}`}>
      <div
        className={`fixed inset-y-0 right-0 w-80 z-50 bg-white shadow-lg transform ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="bg-white p-4 sm:p-6 overflow-y-auto h-full">
          <div className="space-y-6">
            {/* Wave Type Filter */}
            <div className="space-y-2">
              <h6 className="heading-6 font-primary">Wave Type</h6>
              <div className="flex flex-wrap gap-2">
                {waveTypes.map((type) => {
                  const currentTypes =
                    searchParams.get("waveType")?.split(",") || [];
                  const isSelected = currentTypes.includes(type);

                  return (
                    <button
                      key={type}
                      onClick={() => {
                        const newTypes = isSelected
                          ? currentTypes.filter((t) => t !== type)
                          : [...currentTypes, type];
                        updateParams([
                          {
                            key: "waveType",
                            value: newTypes.length ? newTypes.join(",") : null,
                          },
                        ]);
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-primary ${
                        isSelected
                          ? "bg-cyan-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div className="space-y-2">
              <h6 className="heading-6 font-primary">Difficulty</h6>
              <div className="flex flex-wrap gap-2">
                {["Beginner", "Intermediate", "Advanced"].map((level) => {
                  const currentLevels =
                    searchParams.get("difficulty")?.split(",") || [];
                  const isSelected = currentLevels.includes(level);

                  return (
                    <button
                      key={level}
                      onClick={() => {
                        const newLevels = isSelected
                          ? currentLevels.filter((l) => l !== level)
                          : [...currentLevels, level];
                        updateParams([
                          {
                            key: "difficulty",
                            value: newLevels.length
                              ? newLevels.join(",")
                              : null,
                          },
                        ]);
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-primary ${
                        isSelected
                          ? "bg-cyan-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optimal Tide Filter */}
            <div className="space-y-2">
              <h6 className="heading-6 font-primary">Optimal Tide</h6>
              <div className="flex flex-wrap gap-2">
                {["Low", "Mid", "High", "All", "Low to Mid", "Mid to High"].map(
                  (tide) => {
                    const isSelected = (
                      searchParams.get("optimalTide")?.split(",") || []
                    ).includes(tide);
                    return (
                      <button
                        key={tide}
                        onClick={() => toggleFilter("optimalTide", tide)}
                        className={`px-3 py-1 rounded-full text-sm font-primary ${
                          isSelected
                            ? "bg-cyan-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {tide}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Season Filter */}
            <div className="space-y-2">
              <h6 className="heading-6 font-primary">Best Season</h6>
              <div className="flex flex-wrap gap-2">
                {["Summer", "Autumn", "Winter", "Spring"].map((season) => {
                  const currentSeasons =
                    searchParams.get("bestSeasons")?.split(",") || [];
                  const isSelected = currentSeasons.includes(season);

                  return (
                    <button
                      key={season}
                      onClick={() => {
                        const newSeasons = isSelected
                          ? currentSeasons.filter((s) => s !== season)
                          : [...currentSeasons, season];
                        updateParams([
                          {
                            key: "bestSeasons",
                            value: newSeasons.length
                              ? newSeasons.join(",")
                              : null,
                          },
                        ]);
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-primary ${
                        isSelected
                          ? "bg-cyan-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {season}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amenities Filter */}
            <div className="space-y-2">
              <h6 className="heading-6 font-primary">Amenities</h6>
              <div className="space-y-2">
                {[
                  { key: "hasSharkAlert", label: "Shark Alert System" },
                  { key: "hasCoffeeShop", label: "Coffee Shop" },
                ].map(({ key, label }) => {
                  const isChecked = searchParams.get(key) === "true";

                  return (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          updateParams([
                            {
                              key,
                              value: e.target.checked ? "true" : null,
                            },
                          ]);
                        }}
                        className="h-4 w-4 text-cyan-600 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 font-primary">
                        {label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Crime Level Filter */}
            <div className="space-y-2">
              <h6 className="heading-6 font-primary">Crime Level</h6>
              <div className="flex flex-wrap gap-2">
                {["Low", "Medium", "High"].map((level) => {
                  const currentLevels =
                    searchParams.get("crimeLevel")?.split(",") || [];
                  const isSelected = currentLevels.includes(level);

                  return (
                    <button
                      key={level}
                      onClick={() => {
                        const newLevels = isSelected
                          ? currentLevels.filter((l) => l !== level)
                          : [...currentLevels, level];
                        updateParams([
                          {
                            key: "crimeLevel",
                            value: newLevels.length
                              ? newLevels.join(",")
                              : null,
                          },
                        ]);
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-primary ${
                        isSelected
                          ? "bg-cyan-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Shark Attack Filter */}
            <div className="space-y-2">
              <h6 className="heading-6 font-primary">Shark Attack</h6>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sharkAttack"
                  checked={searchParams.get("sharkAttack") === "true"}
                  onChange={(e) => {
                    updateParams([
                      {
                        key: "sharkAttack",
                        value: e.target.checked ? "true" : null,
                      },
                    ]);
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
                  {searchParams.get("minPoints") || "0"} stars
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={searchParams.get("minPoints") || "0"}
                onChange={(e) => {
                  updateParams([
                    {
                      key: "minPoints",
                      value: e.target.value || null,
                    },
                  ]);
                }}
                className="w-full"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => router.push(pathname)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-primary"
              >
                Clear All Filters
              </button>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors font-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
