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
import type { ForecastData } from "@/app/types/forecast";
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
  // Core state
  beaches: Beach[];
  setBeaches: (beaches: Beach[]) => void;

  // Filter state
  filters: FilterType;
  setFilters: (filters: FilterType) => void;

  // Forecast state
  forecastData: ForecastData | null;
  setForecastData: (data: ForecastData | null) => void;

  // UI state
  currentPage: number;
  setCurrentPage: (page: number) => void;
  sort: BeachSort;
  setSort: (sort: BeachSort) => void;
  selectedRegion: string;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;

  // Status flags
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Separate loading states for different data types
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

  // Add beach counts
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

  // Add URL sync functionality
  updateFilters: (newFilters: FilterType) => void;
}

const BeachContext = createContext<BeachContextType | undefined>(undefined);

function getInitialFilters({ regionId }: { regionId: string }): FilterType {
  return {
    location: {
      region: "",
      regionId: regionId,
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
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
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
  const [selectedRegion, setSelectedRegion] = useState("");

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
        // Fetch initial scores from API
        const response = await fetch("/api/surf-conditions");
        const data = await response.json();

        console.log("Fetched initial beach scores:", data);

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
  }, [beaches]);

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
  const [filters, setFilters] = useState<FilterType>(() => {
    const regionId = searchParams.get("regionId");
    return {
      ...getInitialFilters({ regionId: regionId || "" }),
      location: {
        regionId: regionId || "",
        region: "",
        country: "",
        continent: "",
      },
    };
  });

  // Modify the effect to include proper dependencies
  useEffect(() => {
    const loadInitialData = async () => {
      const regionId = searchParams.get("regionId");
      if (regionId && beaches.length === 0) {
        // Add check for empty beaches
        setLoadingState("forecast", true);
        try {
          const response = await fetch(
            `/api/surf-conditions?regionId=${regionId.toLowerCase()}`
          );
          const data = await response.json();

          if (data) {
            setForecastData({
              windSpeed: data.windSpeed,
              windDirection: data.windDirection,
              swellHeight: data.swellHeight,
              swellPeriod: data.swellPeriod,
              swellDirection: data.swellDirection,
              id: data.id,
              date: new Date(data.date),
              regionId: data.regionId,
              region: data.regionId,
              createdAt: new Date(data.date),
              updatedAt: new Date(data.date),
            });

            if (data.scores) setBeachScores(data.scores);
            if (data.beaches) setBeaches(data.beaches);
          }
        } catch (error) {
          console.error("Error loading initial data:", error);
        } finally {
          setLoadingState("forecast", false);
        }
      }
    };

    loadInitialData();
  }, [
    searchParams,
    beaches.length,
    setBeachScores,
    setBeaches,
    setForecastData,
    setLoadingState,
  ]); // Add proper dependencies

  // Debug log the initial filter state
  useEffect(() => {
    console.log("Initial filter state:", {
      filters,
      urlParams: Object.fromEntries(searchParams.entries()),
    });
  }, []);

  // Create a function to read filters from URL
  const getFiltersFromUrl = useCallback((): Partial<FilterType> => {
    // Get wave types and validate them against allowed values
    const waveTypeParam = searchParams.get("waveType")?.split(",") || [];
    const validWaveTypes = waveTypeParam.filter((type): type is WaveType =>
      WAVE_TYPES.includes(type as WaveType)
    );

    return {
      location: {
        region: searchParams.get("region") || "",
        regionId: searchParams.get("regionId") || "",
        country: searchParams.get("country") || "",
        continent: searchParams.get("continent") || "",
      },
      waveType: validWaveTypes,
      difficulty: (searchParams.get("difficulty")?.split(",") ||
        []) as Difficulty[],
      minPoints: Number(searchParams.get("minPoints")) || 0,
      crimeLevel: (searchParams.get("crimeLevel")?.split(",") ||
        []) as CrimeLevel[],
      sharkAttack: searchParams.get("sharkAttack")?.split(",") || [],
      searchQuery: searchParams.get("search") || "",
      hasAttack: searchParams.get("hasAttack") === "true",
    };
  }, [searchParams]);

  // Sync URL changes to state
  useEffect(() => {
    const urlFilters = getFiltersFromUrl();

    // Only update if there are actual changes
    if (
      urlFilters.location?.regionId &&
      urlFilters.location.regionId !== filters.location.regionId
    ) {
      console.log("Updating filters from URL:", {
        current: filters,
        new: urlFilters,
      });

      setFilters((prev) => ({
        ...prev,
        ...urlFilters,
        location: {
          ...prev.location,
          ...urlFilters.location,
        },
      }));
    }
  }, [searchParams, getFiltersFromUrl]);

  // Enhanced filter update function
  const handleSetFilters = useCallback(
    (newFilters: FilterType) => {
      console.log("Setting filters:", {
        current: filters,
        new: newFilters,
        regionId: newFilters.location?.regionId,
      });

      // Update state first
      setFilters(newFilters);

      // Then update URL and localStorage
      const params = new URLSearchParams();

      // Only add essential parameters that should be reflected in URL
      if (newFilters.location.regionId) {
        params.set("regionId", newFilters.location.regionId.toLowerCase());
      }

      // Add search query if present
      if (newFilters.searchQuery) {
        params.set("search", newFilters.searchQuery);
      }

      // Add wave type filters if present
      if (newFilters.waveType.length > 0) {
        params.set("waveType", newFilters.waveType.join(","));
      }

      // Add difficulty filters if present
      if (newFilters.difficulty.length > 0) {
        params.set("difficulty", newFilters.difficulty.join(","));
      }

      // Update URL without scroll
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });

      // Reset page when filters change
      setCurrentPage(1);
    },
    [router, pathname, filters]
  );

  // Memoize the filtered beaches based on URL params
  const filteredBeaches = useMemo(() => {
    const currentFilters = getFiltersFromUrl();

    console.log("Filtering beaches:", {
      totalBeaches: beaches.length,
      regionFilter: currentFilters.location?.regionId,
      sampleBeach:
        beaches.length > 0
          ? {
              id: beaches[0].id,
              name: beaches[0].name,
              regionId: beaches[0].regionId,
            }
          : null,
    });

    const filtered = beaches.filter((beach) => {
      // Region filter
      if (
        currentFilters.location?.regionId &&
        beach.regionId !== currentFilters.location.regionId
      ) {
        return false;
      }

      // Wave type filter
      const waveTypes = currentFilters.waveType || [];
      if (waveTypes.length > 0 && !waveTypes.includes(beach.waveType)) {
        return false;
      }

      // Difficulty filter
      const difficulties = currentFilters.difficulty || [];
      if (difficulties.length > 0 && !difficulties.includes(beach.difficulty)) {
        return false;
      }

      // Search query
      if (
        currentFilters.searchQuery &&
        !beach.name
          .toLowerCase()
          .includes(currentFilters.searchQuery.toLowerCase())
      ) {
        return false;
      }

      return true;
    });

    console.log(`Found ${filtered.length} beaches after filtering`);
    return filtered;
  }, [beaches, searchParams, getFiltersFromUrl]);

  // Add URL sync functionality
  const updateFilters = useCallback(
    (newFilters: FilterType) => {
      console.log("[BEACH_CONTEXT] Updating filters:", {
        old: filters,
        new: newFilters,
      });

      setFilters(newFilters);

      // Update URL params
      const params = new URLSearchParams(searchParams.toString());
      params.set("regionId", newFilters.location.regionId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // Context value (just state and setters)
  const value = useMemo<BeachContextType>(
    () => ({
      // Data
      beaches,
      setBeaches,
      forecastData,
      setForecastData,
      beachScores,
      setBeachScores: memoizedSetBeachScores,
      todayGoodBeaches,
      setTodayGoodBeaches,

      // Filters and UI
      filters,
      setFilters: handleSetFilters,
      sort,
      setSort,
      currentPage,
      setCurrentPage,
      isSidebarOpen,
      selectedRegion,

      // Status
      isLoading,
      setIsLoading,

      // Loading states
      loadingStates,
      setLoadingState,

      // Add beach counts
      beachCounts,
      setBeachCounts: memoizedSetBeachCounts,

      // UI State Setters
      setSidebarOpen,
      setSelectedRegion,

      filteredBeaches,

      // Add URL sync functionality
      updateFilters,
    }),
    [
      beaches,
      forecastData,
      beachScores,
      todayGoodBeaches,
      filters,
      sort,
      currentPage,
      isLoading,
      loadingStates,
      handleSetFilters,
      setLoadingState,
      memoizedSetBeachScores,
      beachCounts,
      memoizedSetBeachCounts,
      isSidebarOpen,
      selectedRegion,
      setSidebarOpen,
      setSelectedRegion,
      filteredBeaches,
      updateFilters,
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
