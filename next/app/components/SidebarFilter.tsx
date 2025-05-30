import { useState, useEffect } from "react";
import type { Beach, Region } from "@/app/types/beaches";
import "@/styles/filters.css";
import {
  INITIAL_FILTERS,
  MAX_DISTANCE,
  WAVE_TYPE_ICONS,
  WaveType,
  DEFAULT_PROFILE_IMAGE,
} from "@/app/lib/constants";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { Button } from "@/app/components/ui/Button";
import { toast } from "sonner";

// Import types from BeachContainer
type Difficulty =
  | "Beginner"
  | "Intermediate"
  | "Advanced"
  | "All Levels"
  | "Expert";
type CrimeLevel = "Low" | "Medium" | "High";

interface FilterType {
  continent: string[];
  country: string[];
  waveType: string[];
  difficulty: Difficulty[];
  region: Region[];
  crimeLevel: CrimeLevel[];
  minPoints: number;
  sharkAttack: string[];
  minDistance?: number;
}

interface SidebarFilterProps {
  beaches: Beach[];
  minPoints: number;
  onMinPointsChange: (value: number) => void;
  onFilterChange: (filters: FilterType) => void;
  filters: FilterType;
  onSaveDefault: (filters: FilterType) => Promise<void>;
  isLoadingDefaults?: boolean;
  onRegionChange?: (region: string) => void;
}

export default function SidebarFilter({
  beaches,
  onFilterChange,
  minPoints,
  onMinPointsChange,
  filters,
  onSaveDefault,
  isLoadingDefaults,
  onRegionChange,
}: SidebarFilterProps) {
  const FILTERS_STORAGE_KEY = "surfspot_filters";

  const updateFilters = (key: keyof typeof INITIAL_FILTERS, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFilterChange(newFilters);
  };

  // Get unique wave types from beach data
  const waveTypes = [...new Set(beaches.map((beach) => beach.waveType))];

  // First, get unique regions from beaches data
  const uniqueRegions = Array.from(
    new Set(beaches.map((beach) => beach.region))
  ).sort() as Region[];

  const handleFilterChange = (newFilters: FilterType) => {
    console.log("Filter change:", newFilters);
    let filteredBeaches = [...beaches];

    // Apply region filter
    if (newFilters.region.length > 0) {
      filteredBeaches = filteredBeaches.filter((beach) =>
        newFilters.region.includes(beach.region)
      );
    }

    // Apply difficulty filter
    if (newFilters.difficulty.length > 0) {
      filteredBeaches = filteredBeaches.filter((beach) =>
        newFilters.difficulty.includes(beach.difficulty)
      );
    }

    // Apply crime level filter
    if (newFilters.crimeLevel.length > 0) {
      filteredBeaches = filteredBeaches.filter((beach) =>
        newFilters.crimeLevel.includes(beach.crimeLevel)
      );
    }

    // Apply wave type filter
    if (newFilters.waveType.length > 0) {
      filteredBeaches = filteredBeaches.filter((beach) =>
        newFilters.waveType.includes(beach.waveType)
      );
    }

    // Apply shark attack filter
    if (newFilters.sharkAttack.length > 0) {
      console.log("Filtering for shark attacks");
      filteredBeaches = filteredBeaches.filter((beach) => {
        return beach.sharkAttack.hasAttack === true;
      });
    }

    console.log("Filtered beaches count:", filteredBeaches.length); // Debug log
    onFilterChange(newFilters);
  };

  useEffect(() => {
    console.log(
      "Beaches with shark attacks:",
      beaches
        .filter((beach) => beach.sharkAttack.hasAttack)
        .map((beach) => beach.name)
    );
  }, [beaches]);

  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveDefault = async () => {
    setIsSaving(true);
    try {
      await onSaveDefault(filters);
      toast.success("Default settings saved!");
    } catch (error) {
      console.error("Error saving defaults:", error);
      toast.error("Failed to save defaults");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegionClick = (region: string) => {
    // We'll just update the filters here without triggering the loading animation
    // Don't call onRegionChange from the sidebar filter
    // This way, only clicks from the main region filter will show the animation

    // If you need to do something else with the region, do it here
    console.log(`Region selected from sidebar: ${region}`);
  };

  return (
    <div className="p-9 bg-[var(--color-bg-secondary)] rounded-lg">
      {/* Region Selection Filter */}
      <div className="filter-section">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsRegionOpen(!isRegionOpen)}
        >
          <h5 className="filter-heading">Region</h5>
          <ChevronDown
            className={`w-5 h-5 transition-transform ${isRegionOpen ? "transform rotate-180" : ""}`}
          />
        </div>

        {isRegionOpen && (
          <div>
            {uniqueRegions.map((region) => (
              <label key={region} className="filter-option">
                <input
                  type="checkbox"
                  className="filter-checkbox"
                  checked={filters.region.includes(region)}
                  onChange={(e) => {
                    const newRegions = e.target.checked
                      ? [...filters.region, region]
                      : filters.region.filter((r) => r !== region);
                    updateFilters("region", newRegions);
                    // Don't call handleRegionClick or onRegionChange here
                  }}
                />
                {region}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Difficulty Level Filter */}
      <div className="filter-section">
        <h5 className="filter-heading">Difficulty</h5>
        {["Beginner", "Intermediate", "Advanced"].map((level) => (
          <label key={level} className="filter-option">
            <input
              type="checkbox"
              className="filter-checkbox"
              checked={filters.difficulty.includes(level as Difficulty)}
              onChange={(e) => {
                const newDifficulty = e.target.checked
                  ? [...filters.difficulty, level as Difficulty]
                  : filters.difficulty.filter(
                      (d) => d !== (level as Difficulty)
                    );
                updateFilters("difficulty", newDifficulty);
              }}
            />
            {level}
          </label>
        ))}
      </div>

      {/* Crime Level Filter */}
      <div className="filter-section">
        <h5 className="filter-heading">Crime Level</h5>
        {["Low", "Medium", "High"].map((level) => (
          <label key={level} className="filter-option">
            <input
              type="checkbox"
              className="filter-checkbox"
              checked={filters.crimeLevel.includes(level as CrimeLevel)}
              onChange={(e) => {
                const newCrimeLevels = e.target.checked
                  ? [...filters.crimeLevel, level as CrimeLevel]
                  : filters.crimeLevel.filter(
                      (l) => l !== (level as CrimeLevel)
                    );
                updateFilters("crimeLevel", newCrimeLevels);
              }}
            />
            {level}
          </label>
        ))}
      </div>

      {/* Shark Attack History Filter */}
      <div className="filter-section">
        <h5 className="filter-heading">Shark Attacks</h5>
        <label className="filter-option">
          <input
            type="checkbox"
            className="filter-checkbox"
            checked={filters.sharkAttack.includes("true")}
            onChange={(e) => {
              const newSharkAttacks = e.target.checked ? ["true"] : [];
              updateFilters("sharkAttack", newSharkAttacks);
            }}
          />
          Reported Attacks
        </label>
      </div>

      {/* Wave Type Filter */}
      <div className="filter-section">
        <h5 className="filter-heading">Wave Type</h5>
        <div className="flex flex-wrap gap-3">
          {waveTypes.map((waveType) => (
            <button
              key={waveType}
              onClick={() => {
                const newWaveTypes = filters.waveType.includes(waveType)
                  ? filters.waveType.filter((t) => t !== waveType)
                  : [...filters.waveType, waveType];
                updateFilters("waveType", newWaveTypes);
              }}
              className={`
                relative aspect-square w-[54px] rounded-lg overflow-hidden cursor-pointer
                hover:opacity-90 transition-opacity duration-300
                ${
                  filters.waveType.includes(waveType)
                    ? "ring-2 ring-[var(--color-bg-tertiary)]"
                    : "border border-gray-200"
                }
              `}
            >
              <Image
                src={
                  WAVE_TYPE_ICONS[waveType as WaveType] ?? DEFAULT_PROFILE_IMAGE
                }
                alt={`${waveType} icon`}
                fill
                className="object-cover"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdwI2QOQvhwAAAABJRU5ErkJggg=="
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                {/* Black base overlay */}
                <div className="absolute inset-0 bg-black opacity-30"></div>
                {/* Blue brand overlay */}
                <div className="absolute inset-0 bg-black opacity-30"></div>
                {/* Text */}
                <span className="relative z-10 text-white text-sm font-medium px-2 text-center">
                  {waveType}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Add Save as Default button */}
      <div className="mt-6">
        <Button
          onClick={handleSaveDefault}
          disabled={isSaving}
          variant="default"
          className="w-full bg-[var(--color-bg-tertiary)] text-white hover:bg-[var(--color-bg-tertiary)]/90 transition-colors"
        >
          {isSaving ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving...</span>
            </div>
          ) : (
            "Save as Default"
          )}
        </Button>
      </div>
    </div>
  );
}
