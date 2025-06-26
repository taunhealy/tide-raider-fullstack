// hooks/useBeachData.ts
import { useInfiniteQuery } from "@tanstack/react-query";
import { useBeachContext } from "@/app/context/BeachContext";
import type { BeachScoreMap } from "@/app/types/scores";
import type { CoreForecastData } from "@/app/types/forecast";
import type { Beach } from "@/app/types/beaches";
import { useState } from "react";
import { InfiniteData } from "@tanstack/react-query";

interface BeachScore {
  score: number;
  region: string;
  conditions: {
    windSpeed: number;
    windDirection: number;
    swellHeight: number;
    swellDirection: number;
    swellPeriod: number;
  };
}

interface SurfConditionsResponse {
  beaches: Beach[];
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

export function useBeachData() {
  const { filters } = useBeachContext();
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isFetching, error, hasNextPage, fetchNextPage } =
    useInfiniteQuery<
      SurfConditionsResponse,
      Error,
      InfiniteData<SurfConditionsResponse>,
      string[],
      number
    >({
      queryKey: ["beaches", filters.regionId, filters.searchQuery],
      queryFn: (context) =>
        fetchBeaches({
          regionId: filters.regionId,
          page: context.pageParam,
          searchQuery: filters.searchQuery,
        }),
      getNextPageParam: (lastPage) =>
        lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
      initialPageParam: 1,
      enabled: !!filters.regionId,
    });

  // Combine all pages of data
  const allBeaches = data?.pages.flatMap((page) => page.beaches) ?? [];
  const allScores = data?.pages.reduce(
    (acc, page) => ({ ...acc, ...page.scores }),
    {}
  );
  const forecast = data?.pages[0]?.forecast;

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
