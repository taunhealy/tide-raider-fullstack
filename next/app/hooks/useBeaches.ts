// app/hooks/useBeaches.ts
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
      const data = await response.json();
      return data.beaches;
    },
  });
}
