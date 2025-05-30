// hooks/useBeachFilters.ts
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { INITIAL_FILTERS, REGIONS } from "@/app/lib/constants";
import type {
  FilterType,
  Difficulty,
  Region,
  CrimeLevel,
} from "@/app/types/beaches";
import { toast } from "sonner";

export function useBeachFilters() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);

  // Fetch default filters
  const { data: defaultFilters, isLoading: isLoadingDefaults } = useQuery({
    queryKey: ["userDefaultFilters"],
    queryFn: async () => {
      const response = await fetch("/api/user/filters");
      if (!response.ok) return null;
      return response.json();
    },
  });

  // Initialize filters state from URL params or defaults
  const [filters, setFilters] = useState<FilterType>(() => {
    if (searchParams.toString()) {
      return {
        continent: [searchParams.get("continent")].filter(Boolean) as string[],
        country: [searchParams.get("country")].filter(Boolean) as string[],
        waveType:
          searchParams.get("waveType")?.split(",").filter(Boolean) || [],
        difficulty: (searchParams
          .get("difficulty")
          ?.split(",")
          .filter(Boolean) || []) as Difficulty[],
        region: (searchParams
          .get("region")
          ?.split(",")
          .filter((val) => REGIONS.includes(val)) || []) as Region[],
        crimeLevel: (searchParams
          .get("crimeLevel")
          ?.split(",")
          .filter(Boolean) || []) as CrimeLevel[],
        minPoints: parseInt(searchParams.get("minPoints") || "0"),
        sharkAttack:
          searchParams.get("sharkAttack")?.split(",").filter(Boolean) || [],
        minDistance: 0,
      };
    }
    return INITIAL_FILTERS;
  });

  // Load default filters when available
  useEffect(() => {
    if (defaultFilters && !searchParams.toString()) {
      console.log("Loading default filters:", defaultFilters);

      // Update filters state
      setFilters((prevFilters) => ({
        continent: defaultFilters.continent || prevFilters.continent,
        country: defaultFilters.country || prevFilters.country,
        region: defaultFilters.region || [],
        waveType: defaultFilters.waveType || [],
        difficulty: defaultFilters.difficulty || [],
        crimeLevel: defaultFilters.crimeLevel || [],
        sharkAttack: defaultFilters.sharkAttack || [],
        minPoints: defaultFilters.minPoints || 0,
        minDistance: defaultFilters.minDistance || 0,
      }));

      // Update URL with default filters
      updateUrlWithFilters(defaultFilters);
    }
  }, [defaultFilters, searchParams]);

  // Function to update URL with filters
  const updateUrlWithFilters = (filtersToApply: Partial<FilterType>) => {
    const params = new URLSearchParams();

    if (filtersToApply.continent?.length)
      params.set("continent", filtersToApply.continent.join(","));
    if (filtersToApply.country?.length)
      params.set("country", filtersToApply.country.join(","));
    if (filtersToApply.region?.length)
      params.set("region", filtersToApply.region.join(","));
    if (filtersToApply.waveType?.length)
      params.set("waveType", filtersToApply.waveType.join(","));
    if (filtersToApply.difficulty?.length)
      params.set("difficulty", filtersToApply.difficulty.join(","));
    if (filtersToApply.crimeLevel?.length)
      params.set("crimeLevel", filtersToApply.crimeLevel.join(","));
    if (filtersToApply.sharkAttack?.length)
      params.set("sharkAttack", filtersToApply.sharkAttack.join(","));
    if (filtersToApply.minPoints)
      params.set("minPoints", filtersToApply.minPoints.toString());

    // Update URL without causing navigation
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${params.toString()}`
    );
  };

  // Function to save default filters
  const saveDefaultFilters = async () => {
    setIsSavingDefaults(true);
    try {
      // Save the exact URL parameters
      const params = new URLSearchParams(window.location.search);
      const currentParams = Object.fromEntries(params.entries());

      const response = await fetch("/api/user/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urlParams: currentParams,
          ...filters,
        }),
      });

      if (!response.ok) throw new Error("Failed to save filters");
      await queryClient.invalidateQueries({ queryKey: ["userDefaultFilters"] });
      toast.success("Default filters saved successfully!");
      return true;
    } catch (error) {
      console.error("Error saving filters:", error);
      toast.error("Failed to save default filters");
      throw error;
    } finally {
      setIsSavingDefaults(false);
    }
  };

  // Add this function to the hook
  const updateFilters = useCallback(
    (key: FilterKeys, value: any) => {
      const newFilters = { ...filters };

      // Handle single-select for continent and country
      if (key === "continent" || key === "country") {
        newFilters[key] = [value]; // Ensure it's an array with single value
      } else if (key === "region") {
        newFilters.region = Array.isArray(value) ? value : [value];
      } else {
        newFilters[key] = value; // Keep array behavior for other filters
      }

      setFilters(newFilters);
      updateUrlWithFilters(newFilters);
    },
    [filters, setFilters, updateUrlWithFilters]
  );

  return {
    filters,
    setFilters,
    updateUrlWithFilters,
    saveDefaultFilters,
    defaultFilters,
    isLoadingDefaults,
    isSavingDefaults,
    updateFilters,
  };
}
