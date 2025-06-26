"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import type { Beach } from "@/app/types/beaches";
import type { CoreForecastData } from "@/app/types/forecast";
import type { BeachScoreMap } from "@/app/types/scores";
import {
  FilterType,
  WaveType,
  Difficulty,
  CrimeLevel,
} from "@/app/types/beaches";
import { WAVE_TYPES } from "@/app/types/beaches";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface BeachSort {
  field: string;
  direction: "asc" | "desc";
}

interface BeachContextType {
  beaches: Beach[];
  setBeaches: (beaches: Beach[]) => void;
  forecastData: CoreForecastData | null;
  setForecastData: (data: CoreForecastData | null) => void;
  filters: FilterType;
  updateFilters: (filters: FilterType) => void;

  sort: BeachSort;
  setSort: (sort: BeachSort) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  loadingStates: {
    forecast: boolean;
    beaches: boolean;
    scores: boolean;
  };
  setLoadingState: (
    type: "forecast" | "beaches" | "scores",
    isLoading: boolean
  ) => void;
  beachScores: BeachScoreMap;
  setBeachScores: (scores: BeachScoreMap) => void;
  beachCounts: {
    regions: Record<string, number>;
    countries: Record<string, number>;
    continents: Record<string, number>;
  } | null;
  setBeachCounts: (
    counts: {
      regions: Record<string, number>;
      countries: Record<string, number>;
      continents: Record<string, number>;
    } | null
  ) => void;
  filteredBeaches: Beach[];
}

const BeachContext = createContext<BeachContextType | undefined>(undefined);

function getInitialFilters(): FilterType {
  return {
    regionId: "",
    region: "",
    country: "",
    continent: "",
    waveType: [],
    difficulty: [],
    minPoints: 0,
    crimeLevel: [],
    sharkAttack: [],
    searchQuery: "",
    hasAttack: false,
  };
}

export function BeachProvider({
  children,
  initialBeaches,
  initialFilters,
}: {
  children: ReactNode;
  initialBeaches: Beach[];
  initialFilters?: FilterType;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Add debug logging for initialization
  console.log("BeachProvider initialization:", {
    initialBeachesCount: initialBeaches.length,
    initialFilters,
    searchParams: Object.fromEntries(searchParams.entries()),
  });

  const [beaches, setBeaches] = useState<Beach[]>(initialBeaches);
  const [forecastData, setForecastData] = useState<CoreForecastData | null>(
    null
  );
  const [beachScores, setBeachScores] = useState<BeachScoreMap>({});

  // Memoize todayGoodBeaches to prevent unnecessary rerenders
  const [todayGoodBeaches, setTodayGoodBeaches] = useState<
    { beachId: string; region: string; score: number }[]
  >([]);

  // Filters and sorting
  const [sort, setSort] = useState<BeachSort>({
    field: "score",
    direction: "desc",
  });

  // UI state
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Add loading states
  const [loadingStates, setLoadingStates] = useState({
    forecast: false,
    beaches: false,
    scores: false,
  });

  const setLoadingState = useCallback(
    (type: "forecast" | "beaches" | "scores", isLoading: boolean) => {
      setLoadingStates((prev) => ({
        ...prev,
        [type]: isLoading,
      }));
    },
    []
  );

  // Add effect to handle beach scores initialization
  useEffect(() => {
    const initializeBeachScores = async () => {
      try {
        const response = await fetch("/api/surf-conditions");
        const data = await response.json();
        if (data && data.scores) {
          setBeachScores(data.scores);
        }
      } catch (error) {
        console.error("Failed to fetch initial beach scores:", error);
      }
    };

    if (Object.keys(beachScores).length === 0 && beaches.length > 0) {
      initializeBeachScores();
    }
  }, [beaches, beachScores]);

  // Memoize the setBeachScores callback
  const memoizedSetBeachScores = useCallback(
    (scores: BeachScoreMap) => {
      console.log("Setting beach scores:", {
        previousScores: beachScores,
        newScores: scores,
        beachesCount: beaches.length,
      });
      setBeachScores((prevScores) => ({
        ...prevScores,
        ...scores,
      }));
    },
    [beaches]
  );

  // Add beach counts state
  const [beachCounts, setBeachCounts] = useState<{
    regions: Record<string, number>;
    countries: Record<string, number>;
    continents: Record<string, number>;
  } | null>(null);

  // Memoize the setBeachCounts callback
  const memoizedSetBeachCounts = useCallback((counts: typeof beachCounts) => {
    setBeachCounts(counts);
  }, []);

  // Initialize filters with URL params
  const [filters, setFilters] = useState<FilterType>(
    () => initialFilters || getInitialFilters()
  );

  // Simplified updateFilters function - no URL sync
  const updateFilters = useCallback((newFilters: FilterType) => {
    console.log("[DEBUG] updateFilters called with:", newFilters);
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  // Simplified filteredBeaches computation
  const filteredBeaches = useMemo(() => {
    console.log("Filtering beaches:", {
      totalBeaches: beaches.length,
      regionFilter: filters.regionId,
    });

    return beaches.filter((beach) => {
      // Region filter
      if (filters.regionId && beach.regionId !== filters.regionId) {
        return false;
      }

      // Wave type filter
      if (
        filters.waveType.length > 0 &&
        !filters.waveType.includes(beach.waveType)
      ) {
        return false;
      }

      // Difficulty filter
      if (
        filters.difficulty.length > 0 &&
        !filters.difficulty.includes(beach.difficulty)
      ) {
        return false;
      }

      // Search query
      if (
        filters.searchQuery &&
        !beach.name.toLowerCase().includes(filters.searchQuery.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [beaches, filters]);

  // In BeachContext.tsx, add this effect after the filters state initialization
  useEffect(() => {
    const regionId = searchParams.get("regionId");
    if (regionId && filters.regionId !== regionId) {
      console.log("Updating filters from URL params:", { regionId });
      updateFilters({
        ...filters,
        regionId: regionId.toLowerCase(),
      });
    }
  }, [searchParams, filters.regionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Context value (just state and setters)
  const value = useMemo<BeachContextType>(
    () => ({
      beaches,
      setBeaches,
      forecastData,
      setForecastData,
      beachScores,
      setBeachScores: memoizedSetBeachScores,
      filters,
      updateFilters,
      sort,
      setSort,
      currentPage,
      setCurrentPage,
      isSidebarOpen,
      setSidebarOpen,
      isLoading,
      setIsLoading,
      loadingStates,
      setLoadingState,
      beachCounts,
      setBeachCounts: memoizedSetBeachCounts,
      filteredBeaches,
    }),
    [
      beaches,
      forecastData,
      beachScores,
      filters,
      sort,
      currentPage,
      isLoading,
      loadingStates,
      beachCounts,
      isSidebarOpen,
      filteredBeaches,
      updateFilters,
      memoizedSetBeachScores,
      memoizedSetBeachCounts,
    ]
  );

  return (
    <BeachContext.Provider value={value}>{children}</BeachContext.Provider>
  );
}

export function useBeachContext() {
  const context = useContext(BeachContext);
  if (context === undefined) {
    throw new Error("useBeachContext must be used within a BeachProvider");
  }
  return context;
}
