// hooks/useBeachData.ts
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Beach as PrismaBeach } from "@prisma/client";
import { CoreForecastData } from "../types/forecast";
import { BeachScoreMap } from "../types/scores";

interface SurfConditionsResponse {
  beaches: PrismaBeach[];
  scores: BeachScoreMap;
  forecast: CoreForecastData | null;
}

export function useBeachData(options?: { requireRegion?: boolean }) {
  const searchParams = useSearchParams();
  const regionId = searchParams.get("regionId") || "";
  const searchQuery = searchParams.get("searchQuery") || "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["beaches", regionId, searchQuery],
    queryFn: async () => {
      const response = await fetch(
        `/api/surf-conditions?regionId=${regionId}&searchQuery=${searchQuery || ""}`
      );
      if (!response.ok) throw new Error("Failed to fetch beaches");
      return response.json();
    },
    enabled: options?.requireRegion ? !!regionId : true,
  });

  return {
    beaches: data?.beaches || [],
    beachScores: data?.scores || {},
    forecastData: data?.forecast,
    isLoading,
    error,
  };
}
