import { useQuery } from "@tanstack/react-query";
import { WindData } from "@/app/types/wind";

export function useSurfConditions(region: string) {
  return useQuery({
    queryKey: ["surfConditions", region],
    queryFn: async () => {
      const response = await fetch(
        `/api/surf-conditions?region=${encodeURIComponent(region)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch conditions");
      }
      return response.json();
    },
    enabled: !!region,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
