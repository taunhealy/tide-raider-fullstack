"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import type { Beach } from "@/app/types/beaches";
import type { ForecastData } from "@/app/types/forecast";
import type { BeachScoreMap } from "@/app/types/scores";
import type { FilterType } from "@/app/types/beaches";

interface BeachSort {
  field: string;
  direction: "asc" | "desc";
}

interface BeachContextType {
  // Core state
  beaches: Beach[];
  setBeaches: (beaches: Beach[]) => void;

  // Filter state
  filters: FilterType;
  setFilters: (filters: FilterType) => void;

  // Forecast state
  forecastData: ForecastData | null;
  setForecastData: (data: ForecastData | null) => void;

  // Scores state
  beachScores: BeachScoreMap;
  setBeachScores: (scores: BeachScoreMap) => void;

  // UI state
  currentPage: number;
  setCurrentPage: (page: number) => void;
  sort: BeachSort;
  setSort: (sort: BeachSort) => void;

  // Status flags
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const BeachContext = createContext<BeachContextType | undefined>(undefined);

export function BeachProvider({
  children,
  initialBeaches,
}: {
  children: ReactNode;
  initialBeaches: Beach[];
}) {
  // Core data
  const [beaches, setBeaches] = useState<Beach[]>(initialBeaches);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [beachScores, setBeachScores] = useState<BeachScoreMap>({});

  // Filters and sorting
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
    hasAttack: false,
  });
  const [sort, setSort] = useState<BeachSort>({
    field: "score",
    direction: "desc",
  });

  // UI state
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Context value (just state and setters)
  const value: BeachContextType = {
    // Data
    beaches,
    setBeaches,
    forecastData,
    setForecastData,
    beachScores,
    setBeachScores,

    // Filters and UI
    filters,
    setFilters,
    sort,
    setSort,
    currentPage,
    setCurrentPage,

    // Status
    isLoading,
    setIsLoading,
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
