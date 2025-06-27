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
import type { BeachScoreMap } from "@/app/types/scores";
import {
  FilterType,
  WaveType,
  Difficulty,
  CrimeLevel,
} from "@/app/types/beaches";

interface BeachSort {
  field: string;
  direction: "asc" | "desc";
}

interface BeachContextType {
  // Only keep loading states if they're needed across components
  setLoadingState: (
    type: "forecast" | "beaches" | "scores",
    isLoading: boolean
  ) => void;
}

const BeachContext = createContext<BeachContextType | undefined>(undefined);

const DIFFICULTY_VALUES = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
] as const;

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
    optimalTide: [],
    bestSeasons: [],
    hasSharkAlert: false,
    hasCoffeeShop: false,
  };
}

// Type guard function to check if key is valid FilterType key
const isFilterKey = (key: string): key is keyof FilterType => {
  return key in getInitialFilters();
};

export function BeachProvider({
  children,
  initialBeaches,
}: {
  children: ReactNode;
  initialBeaches: Beach[];
}) {
  const [beaches] = useState<Beach[]>(initialBeaches);
  const [beachScores, setBeachScores] = useState<BeachScoreMap>({});
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

  // Beach scores initialization
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

  const value = useMemo(
    () => ({
      beaches,
      beachScores,
      setLoadingState,
    }),
    [beaches, beachScores, setLoadingState]
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
