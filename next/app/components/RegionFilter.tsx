"use client";

import { useEffect, useState, memo, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { FilterButton } from "@/app/components/ui/FilterButton";
import DataLoadingProgress from "@/app/components/DataLoadingProgress";
import { useAppDispatch, useAppSelector } from "@/app/redux/hooks";
import {
  selectBeachAttributes,
  selectVisibleFilterOptions,
} from "@/app/redux/selectors";
import { updateFilter, changeRegion } from "@/app/redux/slices/filterSlice";
import RegionFilterButton from "./RegionFilterButton";
import type { Region } from "@/app/types/beaches";

interface SavedFilters {
  continents: string[];
  countries: string[];
  regions: string[];
}

async function saveFiltersToDb(filters: SavedFilters) {
  try {
    const response = await fetch("/api/user/filters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    });

    if (!response.ok) throw new Error("Failed to save filters");
    return await response.json();
  } catch (error) {
    console.error("Error saving filters:", error);
    throw error;
  }
}

const RegionFilter = memo(function RegionFilter() {
  const dispatch = useAppDispatch();
  const { data: session } = useSession();

  // Get data from Redux using selectors
  const { uniqueRegions, uniqueContinents, uniqueCountries } = useAppSelector(
    selectBeachAttributes
  );
  const { visibleCountries, visibleRegions } = useAppSelector(
    selectVisibleFilterOptions
  ) as { visibleCountries: string[]; visibleRegions: string[] };
  const filters = useAppSelector((state) => state.filters);
  const userState = useAppSelector((state) => state.user);
  const isSubscribed = userState?.isSubscribed ?? false;

  const selectedRegion = filters.selectedRegion;
  const selectedContinents = filters.continent || [];
  const selectedCountries = filters.country || [];
  const selectedRegions = filters.region || [];

  const [isOpen, setIsOpen] = useState(true);
  const [loadingRegion, setLoadingRegion] = useState<string | null>(null);

  const handleContinentClick = (continent: string) => {
    dispatch(updateFilter({ key: "continent", value: continent }));
  };

  const handleCountryClick = (country: string) => {
    // If selecting a new country, clear existing regions
    if (!selectedCountries.includes(country)) {
      selectedRegions.forEach((region) => {
        dispatch(updateFilter({ key: "region", value: region }));
      });
    }

    dispatch(updateFilter({ key: "country", value: country }));
  };

  const handleRegionClick = (region: Region | null) => {
    // Set the loading region to trigger the loading UI
    setLoadingRegion(region || null);

    // Dispatch actions
    dispatch(changeRegion(region));

    // Reset loading state after a delay
    setTimeout(() => {
      setLoadingRegion(null);
    }, 3500);
  };

  const { data: regionCount, isLoading: isCountLoading } = useQuery({
    queryKey: ["beachCount", selectedRegion],
    queryFn: async () => {
      if (!selectedRegion) return 0;

      const today = new Date().toISOString().split("T")[0];

      try {
        const response = await fetch(
          `/api/beach-counts?region=${encodeURIComponent(selectedRegion || "")}&date=${today}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch beach count");
        }

        const data = await response.json();

        if (data.message === "No suitable beaches found") {
          return 0;
        }

        return data.count ?? 0;
      } catch (error) {
        console.error("Error fetching beach count:", error);
        return 0;
      }
    },
    staleTime: 5000,
    enabled: Boolean(selectedRegion),
  });

  const handleSaveFilters = async () => {
    if (!session?.user) return;

    try {
      await saveFiltersToDb({
        continents: selectedContinents,
        countries: selectedCountries,
        regions: selectedRegions,
      });
      toast.success("Filters saved successfully");
    } catch (error) {
      toast.error("Failed to save filters");
    }
  };

  // Filter UI elements
  const continentButtons = useMemo(() => {
    return uniqueContinents.map((continent: string) => (
      <RegionFilterButton
        key={continent as string}
        region={continent as string}
        isSelected={selectedContinents.includes(continent as string)}
        onClick={() => handleContinentClick(continent as string)}
      />
    ));
  }, [uniqueContinents, selectedContinents]);

  return (
    <div className="space-y-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h6 className="heading-6 font-primary">Regions</h6>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${isOpen ? "transform rotate-180" : ""}`}
        />
      </div>

      {isOpen && (
        <div className="space-y-4">
          {/* Top Divider */}
          <div className="h-px bg-gray-200 mb-4" />

          {/* Continents */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 flex-wrap">
            {continentButtons}
          </div>

          {/* Divider */}
          {visibleCountries.length > 0 && (
            <div className="h-px bg-gray-200 my-4" />
          )}

          {/* Countries */}
          {visibleCountries.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 flex-wrap">
              {visibleCountries.map((country: string) => (
                <FilterButton
                  key={country}
                  label={country}
                  isSelected={selectedCountries.includes(country)}
                  onClick={() => handleCountryClick(country)}
                  variant="country"
                />
              ))}
            </div>
          )}

          {/* Divider */}
          {visibleRegions.length > 0 && visibleCountries.length > 0 && (
            <div className="h-px bg-gray-200 my-4 heading-6" />
          )}

          {/* Regions */}
          {visibleRegions.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                {visibleRegions.map((region: string) => (
                  <FilterButton
                    key={region}
                    label={region}
                    isSelected={selectedRegion === region}
                    onClick={() => handleRegionClick(region)}
                    count={selectedRegion === region ? regionCount : undefined}
                    isLoading={
                      selectedRegion === region ? isCountLoading : false
                    }
                    variant="region"
                  />
                ))}
              </div>

              {/* Show loading progress when a region is being loaded */}
              {loadingRegion && (
                <DataLoadingProgress isLoading={true} className="mt-4" />
              )}
            </>
          )}

          {isSubscribed && session?.user && (
            <button
              onClick={handleSaveFilters}
              className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-900 hover:bg-gray-50 transition-colors"
            >
              Save as Default
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default memo(RegionFilter);
