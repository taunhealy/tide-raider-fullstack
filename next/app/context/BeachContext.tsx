"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import type { Beach } from "@/app/types/beaches";
import type { ForecastData } from "@/app/types/forecast";
import type { BeachWithScore, BeachScoreMap } from "@/app/types/scores";
import { usePagination } from "@/app/hooks/usePagination";
import { useBeachAttributes } from "@/app/hooks/useBeachAttributes";
import type { FilterType } from "@/app/types/beaches";
import { calculateBeachScore } from "@/app/lib/scoreUtils";
import { filterBeaches } from "@/app/lib/filterUtils";

interface BeachFilters {
  waveType: string[];
  region: string | null;
  minRating: number;
  // Add other filter criteria
}

interface BeachSort {
  field: string;
  direction: "asc" | "desc";
}

interface BeachContextType {
  beaches: Beach[];
  filteredBeaches: BeachWithScore[];
  isLoading: boolean;
  isCalculating: boolean;
  beachScores: BeachScoreMap;
  selectedRegion: string | null;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  forecastData: ForecastData | null;
  filters: FilterType;
  setFilters: (filters: FilterType) => void;
  sort: BeachSort;
  setSort: (sort: BeachSort) => void;
  calculateBeachScores: (beaches: Beach[], forecast: ForecastData) => void;
  setBeaches: (beaches: Beach[]) => void;
  setForecastData: (data: ForecastData | null) => void;
}

const BeachContext = createContext<BeachContextType | undefined>(undefined);

export function BeachProvider({
  children,
  initialBeaches,
}: {
  children: ReactNode;
  initialBeaches: Beach[];
}) {
  const [beaches, setBeaches] = useState(initialBeaches);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [filters, setFilters] = useState<FilterType>({
    location: {
      region: "",
      regionId: "",
      country: "",
      continent: "",
    },
    waveType: [],
    difficulty: [],
    minPoints: 0,
    crimeLevel: [],
    sharkAttack: [],
    searchQuery: "",
  });
  const [sort, setSort] = useState<BeachSort>({
    field: "score",
    direction: "desc",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [beachScores, setBeachScores] = useState<BeachScoreMap>({});
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Add this effect to sync filters.region with selectedRegion
  useEffect(() => {
    setSelectedRegion(filters.location.region || null);
  }, [filters.location.region]);

  // More defensive code for beaches with scores
  const beachesWithScores = useMemo(() => {
    if (!beaches || !beaches.length || !forecastData) return [];
    return beaches.map((beach) => ({
      ...beach,
      score: beachScores[beach.id]?.score || 0,
    }));
  }, [beaches, forecastData, beachScores]);

  // More defensive code for filtering
  const filteredBeaches = useMemo(() => {
    if (!beachesWithScores || !beachesWithScores.length) return [];
    try {
      return filterBeaches(beachesWithScores, filters) as BeachWithScore[];
    } catch (error) {
      console.error("Error filtering beaches:", error);
      return [];
    }
  }, [beachesWithScores, filters]);

  // Pagination on filtered results
  const { currentItems, totalPages } = usePagination(
    filteredBeaches,
    currentPage,
    18
  );

  const { fetchRegionData } = useBeachAttributes(beaches);

  const calculateBeachScores = async (
    beaches: Beach[],
    forecast: ForecastData
  ) => {
    setIsCalculating(true);
    try {
      console.log("🏊‍♂️ BeachContext - Starting score calculation:", {
        beachCount: beaches.length,
        sampleBeach: beaches[0],
        forecast,
        selectedRegion,
      });

      // Convert forecast data to the expected format
      const conditions = {
        windSpeed: forecast.windSpeed,
        windDirection: forecast.windDirection,
        swellHeight: forecast.swellHeight,
        swellDirection: forecast.swellDirection,
        swellPeriod: forecast.swellPeriod,
      };

      // Calculate scores for each beach
      const scores = beaches.reduce((acc, beach) => {
        const { score } = calculateBeachScore(beach, conditions);
        acc[beach.id] = { score };
        return acc;
      }, {} as BeachScoreMap);

      console.log("🎯 BeachContext - Scores calculated:", {
        scoreCount: Object.keys(scores).length,
        sampleScore: Object.entries(scores)[0],
        allScores: scores,
      });

      setBeachScores(scores);
    } catch (error) {
      console.error("❌ BeachContext - Error calculating scores:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  // First useEffect - more defensive
  useEffect(() => {
    if (selectedRegion) {
      setIsLoading(true);
      fetchRegionData(selectedRegion)
        .then((data) => {
          if (data) setForecastData(data);
          return fetch(`/api/beaches?regionId=${selectedRegion}`);
        })
        .then((response) => response.json())
        .then((beachData) => {
          if (Array.isArray(beachData)) {
            console.log("🏖️ BeachContext - Updating beaches:", {
              count: beachData.length,
              sampleBeach: beachData[0],
              hasRegions: beachData[0]?.region !== undefined,
            });
            setBeaches(beachData);
          }
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [selectedRegion, fetchRegionData]);

  // Second useEffect - more defensive
  useEffect(() => {
    if (forecastData && filters?.location) {
      console.log("🌊 BeachContext - Updating forecast:", {
        forecast: forecastData,
        regionId: filters.location.regionId,
      });
      // Only set forecast data if it matches the current region
      if (forecastData.region === filters.location.region) {
        setForecastData(forecastData);
      }
    }
  }, [forecastData, filters?.location?.region]);

  // Third useEffect - more defensive
  useEffect(() => {
    if (
      beaches &&
      Array.isArray(beaches) &&
      beaches.length > 0 &&
      forecastData
    ) {
      console.log("🎯 Triggering score calculation with:", {
        beachCount: beaches.length,
        forecastData,
      });
      calculateBeachScores(beaches, forecastData);
    }
  }, [beaches, forecastData]);

  const value: BeachContextType = {
    beaches,
    filteredBeaches,
    isLoading,
    isCalculating,
    beachScores,
    selectedRegion,
    currentPage,
    setCurrentPage,
    totalPages,
    forecastData,
    filters,
    setFilters,
    sort,
    setSort,
    calculateBeachScores,
    setBeaches,
    setForecastData,
  };

  return (
    <BeachContext.Provider value={value}>{children}</BeachContext.Provider>
  );
}

export function useBeach() {
  const context = useContext(BeachContext);
  if (context === undefined) {
    throw new Error("useBeach must be used within a BeachProvider");
  }
  return context;
}
