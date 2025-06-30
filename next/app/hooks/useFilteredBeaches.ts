import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Beach } from "../types/beaches";
import { BeachScoreMap } from "../types/scores";

interface FilteredBeachesResponse {
  beaches: any[];
  scores: BeachScoreMap;
  pagination: {
    hasMore: boolean;
    page: number;
  };
}

export function useFilteredBeaches() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("searchQuery") || "";
  const regionId = searchParams.get("regionId") || "";

  // Create a query string from all search params except page
  const baseParams = new URLSearchParams(searchParams);
  baseParams.delete("page"); // Remove page parameter if present
  const baseQueryString = baseParams.toString();

  const { data, isLoading, error, fetchNextPage, hasNextPage } =
    useInfiniteQuery<
      FilteredBeachesResponse,
      Error,
      { pages: FilteredBeachesResponse[]; pageParams: number[] }
    >({
      queryKey: ["filtered-beaches", regionId, searchQuery],
      queryFn: async ({ pageParam = 1 }) => {
        const queryString = `${baseQueryString}&page=${pageParam}`;
        const response = await fetch(
          `/api/surf-conditions?regionId=${regionId}&searchQuery=${searchQuery}`
        );
        if (!response.ok) throw new Error("Failed to fetch beaches");
        return response.json();
      },
      getNextPageParam: (lastPage) =>
        lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
      initialPageParam: 1,
      enabled: !!regionId,
      staleTime: 60000, // 1 minute
    });

  // Combine all pages of data
  const allBeaches = data?.pages.flatMap((page) => page.beaches) || [];

  // Combine all score maps
  const allScores: BeachScoreMap =
    data?.pages.reduce((acc, page) => ({ ...acc, ...page.scores }), {}) || {};

  // Transform beaches to match the Beach type
  const beaches = allBeaches.map(
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
    beaches,
    beachScores: allScores,
    isLoading,
    error,
    hasNextPage,
    loadMore: fetchNextPage,
  };
}
