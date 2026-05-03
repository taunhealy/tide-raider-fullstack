"use client";

import { useQuery } from "@tanstack/react-query";
import { useBeachData } from "@/app/hooks/useBeachData";

export function useRegionCounts(date?: string | null, timeSlot?: string | null) {
  return useQuery({
    queryKey: ["region-counts", date, timeSlot],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const targetDate = date || today;
      let url = `/api/beach-ratings/region-counts?date=${targetDate}`;
      if (timeSlot) {
        url += `&timeSlot=${timeSlot}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch region counts");
      const json = await response.json();
      return json.counts;
    },
    staleTime: 1000 * 60 * 5,
  });
}
