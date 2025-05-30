import { useQuery } from "@tanstack/react-query";

export function useAllSurfConditions(enabled = true) {
  return useQuery({
    queryKey: ["surfConditions", "all"],
    queryFn: async () => {
      const response = await fetch(`/api/surf-conditions`);
      if (!response.ok) throw new Error("Failed to fetch conditions");
      const data = await response.json();
      return data;
    },
    enabled,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });
}
