// hooks/useBeachData.ts
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { InfiniteData } from "@tanstack/react-query";
import { Beach as PrismaBeach } from "@prisma/client";
import { CoreForecastData } from "../types/forecast";
import { BeachScoreMap } from "../types/scores";
import { Beach } from "../types/beaches";

interface BeachScore {
  score: number;
  beach: {
    id: string;
    // other beach properties
    beachDailyScores: Array<{
      conditions: {
        windSpeed: number;
        windDirection: number;
        swellHeight: number;
        swellDirection: number;
        swellPeriod: number;
      };
      date: string;
      // other properties
    }>;
  };
}

interface SurfConditionsResponse {
  beaches: PrismaBeach[];
  scores: BeachScoreMap;
  forecast: CoreForecastData | null;
  pagination: {
    hasMore: boolean;
    page: number;
  };
}

async function fetchBeaches({
  regionId,
  page,
  searchQuery,
}: {
  regionId: string;
  page: number;
  searchQuery?: string;
}) {
  const response = await fetch(
    `/api/surf-conditions?regionId=${regionId}&page=${page}&searchQuery=${searchQuery || ""}`
  );
  if (!response.ok) throw new Error("Failed to fetch beaches");
  return response.json();
}

export function useBeachData(options?: { requireRegion?: boolean }) {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const limit = 10;

  const regionId = searchParams.get("regionId") || "";
  const searchQuery = searchParams.get("searchQuery") || "";

  const { data, isLoading, isFetching, error, hasNextPage, fetchNextPage } =
    useInfiniteQuery<
      SurfConditionsResponse,
      Error,
      InfiniteData<SurfConditionsResponse>,
      string[],
      number
    >({
      queryKey: ["beaches", regionId, searchQuery],
      queryFn: (context) =>
        fetchBeaches({
          regionId,
          page: context.pageParam,
          searchQuery,
        }),
      getNextPageParam: (lastPage) =>
        lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
      initialPageParam: 1,
      enabled: options?.requireRegion ? !!regionId : true,
      retry: 3,
      retryDelay: 1000,
      staleTime: 60000,
    });

  // Combine all pages of data
  const rawBeaches = data?.pages.flatMap((page) => page.beaches) ?? [];
  const allScores: BeachScoreMap =
    data?.pages.reduce((acc, page) => ({ ...acc, ...page.scores }), {}) ?? {};
  const forecast = data?.pages[0]?.forecast;

  // Transform beaches to match the Beach type
  const allBeaches = rawBeaches.map(
    (beach: any): Beach => ({
      ...beach,
      optimalSwellDirections:
        typeof beach.optimalSwellDirections === "string"
          ? JSON.parse(beach.optimalSwellDirections)
          : beach.optimalSwellDirections || { min: 0, max: 0, cardinal: "N" },
      swellSize:
        typeof beach.swellSize === "string"
          ? JSON.parse(beach.swellSize)
          : beach.swellSize,
      idealSwellPeriod:
        typeof beach.idealSwellPeriod === "string"
          ? JSON.parse(beach.idealSwellPeriod)
          : beach.idealSwellPeriod,
      waterTemp:
        typeof beach.waterTemp === "string"
          ? JSON.parse(beach.waterTemp)
          : beach.waterTemp,
      coordinates:
        typeof beach.coordinates === "string"
          ? JSON.parse(beach.coordinates)
          : beach.coordinates,
      sharkAttack:
        typeof beach.sharkAttack === "string"
          ? JSON.parse(beach.sharkAttack)
          : beach.sharkAttack,
    })
  );

  return {
    beaches: allBeaches,
    beachScores: allScores,
    forecastData: forecast,
    isLoading: isLoading || isFetching,
    error,
    hasNextPage,
    loadMore: fetchNextPage,
  };
}
