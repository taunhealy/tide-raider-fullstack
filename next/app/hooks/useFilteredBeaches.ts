import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Beach, BeachInitialData } from "../types/beaches";
import { BeachScoreMap } from "../types/scores";
import { useMemo } from "react";
import { transformBeachScores } from "@/app/lib/transforms/beachTransforms";

interface FilteredBeachesResponse {
  beaches: any[];
  scores: BeachScoreMap;
  pagination: {
    hasMore: boolean;
    page: number;
  };
}

interface UseFilteredBeachesProps {
  initialData: BeachInitialData | null;
  enabled?: boolean;
}

// Move the JSON parsing logic to a separate utility function
const parseJsonField = <T>(field: string | T): T => {
  if (typeof field === "string") {
    try {
      return JSON.parse(field);
    } catch {
      return field as T;
    }
  }
  return field;
};

// Define which fields need JSON parsing
const jsonFields = [
  "optimalSwellDirections",
  "swellSize",
  "idealSwellPeriod",
  "waterTemp",
  "coordinates",
  "sharkAttack",
] as const;

// Transform function is now more maintainable
const transformBeach = (beach: any): Beach => {
  const transformed = { ...beach };

  // Parse JSON fields
  jsonFields.forEach((field) => {
    transformed[field] = parseJsonField(beach[field]);
  });

  // Set default for optimalSwellDirections if needed
  if (!transformed.optimalSwellDirections) {
    transformed.optimalSwellDirections = { min: 0, max: 0, cardinal: "N" };
  }

  return transformed as Beach;
};

export function useFilteredBeaches({
  initialData,
  enabled = true,
}: UseFilteredBeachesProps) {
  const searchParams = useSearchParams();
  const baseParams = new URLSearchParams(searchParams);
  baseParams.delete("page");
  const baseQueryString = baseParams.toString();

  const { data, isLoading, error, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["filtered-beaches", baseQueryString],
      queryFn: async ({ pageParam = 1 }) => {
        const queryString = `${baseQueryString}&page=${pageParam}`;
        const response = await fetch(`/api/surf-conditions?${queryString}`);
        if (!response.ok) throw new Error("Failed to fetch beaches");
        const json = await response.json();

        // Transform the data here before returning
        return {
          beaches: json.beaches || [],
          scores: json.scores || {},
          pagination: json.pagination,
          forecast: json.forecast,
        };
      },
      initialData: initialData
        ? {
            pages: [
              {
                beaches: initialData.beaches,
                scores: initialData.scores,
                pagination: { hasMore: true, page: 1 },
                forecast: initialData.forecast,
              },
            ],
            pageParams: [1],
          }
        : undefined,
      getNextPageParam: (lastPage) =>
        lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
      initialPageParam: 1,
      enabled: enabled && !!searchParams.get("regionId"),
    });

  // Transform and combine data from all pages
  const transformedData = useMemo(() => {
    if (!data?.pages) return { beaches: [], beachScores: {} };

    const allBeaches = data.pages.flatMap((page) => page.beaches);
    const allScores = data.pages.reduce(
      (acc, page) => ({ ...acc, ...page.scores }),
      {}
    );

    return {
      beaches: allBeaches,
      beachScores: transformBeachScores(allScores),
    };
  }, [data?.pages]);

  return {
    ...transformedData,
    isLoading,
    error,
    hasNextPage,
    loadMore: fetchNextPage,
  };
}
