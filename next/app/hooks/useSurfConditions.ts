"use client";

import { useQuery } from "@tanstack/react-query";
import { BaseForecastData } from "@/app/types/forecast";

export function useSurfConditions(region: string | undefined) {
  return useQuery({
    queryKey: ["surf-conditions", region],
    queryFn: async () => {
      if (!region) return null;
      const res = await fetch(
        `/api/surf-conditions?region=${encodeURIComponent(region)}`
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json() as Promise<BaseForecastData>;
    },
    enabled: !!region,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
