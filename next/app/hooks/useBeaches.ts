import { useQuery } from "@tanstack/react-query";
import type { Beach } from "@/app/types/beaches";

export function useBeaches() {
  return useQuery({
    queryKey: ["beaches"],
    queryFn: async () => {
      const response = await fetch("/api/beaches");
      if (!response.ok) {
        throw new Error("Failed to fetch beaches");
      }
      return response.json() as Promise<Beach[]>;
    },
    // Since beach data is relatively static, we can cache it for longer
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
