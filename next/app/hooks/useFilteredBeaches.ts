import { useQuery } from "@tanstack/react-query";
import { BeachInitialData } from "../types/beaches";
import { useBeachFilters } from "./useBeachFilters";
import { CoreForecastData } from "../types/forecast";

interface UseFilteredBeachesProps {
  initialData: BeachInitialData | null;
  enabled?: boolean;
}

// Update the response type to match BeachInitialData
interface UseFilteredBeachesResponse extends BeachInitialData {}

export function useFilteredBeaches({
  initialData,
  enabled = true,
}: UseFilteredBeachesProps) {
  const { filters } = useBeachFilters();

  return useQuery<UseFilteredBeachesResponse>({
    queryKey: ["filteredBeaches", filters], // React to filter changes
    queryFn: async () => {
      // Convert filters to URLSearchParams
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          if (Array.isArray(value)) {
            if (value.length) params.set(key, value.join(","));
          } else {
            params.set(key, String(value));
          }
        }
      });

      const response = await fetch(
        `/api/filtered-beaches?${params.toString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch filtered beaches");
      return response.json(); // This needs to return BeachInitialData structure
    },
    initialData: initialData || undefined,
    enabled: enabled && !!filters.regionId,
    staleTime: 0, // Always refetch when query key changes (region change)
    gcTime: 1000 * 60 * 5, // Keep cache for 5 minutes but always refetch
  });
}
