import { useQuery } from "@tanstack/react-query";
import { FilterConfig } from "@/app/types/raidlogs";

export function useRaidLogsData(
  filters: FilterConfig,
  isPrivate: boolean,
  userId?: string
) {
  return useQuery({
    queryKey: ["raidLogs", filters, isPrivate, userId],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (userId) params.set("userId", userId);
      if (filters.beaches?.length)
        params.set("beaches", filters.beaches.join(","));
      if (filters.regions?.length)
        params.set("regions", filters.regions.join(","));
      if (filters.countries?.length)
        params.set("countries", filters.countries.join(","));
      if (filters.minRating)
        params.set("minRating", filters.minRating.toString());
      if (isPrivate) params.set("isPrivate", "true");

      const res = await fetch(`/api/raid-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch logs");

      return res.json();
    },
  });
}
