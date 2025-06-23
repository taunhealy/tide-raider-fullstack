import { useQuery } from "@tanstack/react-query";
import type { Beach } from "@/app/types/beaches";

export function useBeaches() {
  return useQuery<Beach[]>({
    queryKey: ["beaches"],
    queryFn: async () => {
      const response = await fetch("/api/beaches");
      if (!response.ok) {
        throw new Error("Failed to fetch beaches");
      }
      return response.json();
    },
  });
}
