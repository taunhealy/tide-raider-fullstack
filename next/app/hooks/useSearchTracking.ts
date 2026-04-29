import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useSearchTracking() {
  const queryClient = useQueryClient();

  const trackRegion = useMutation({
    mutationFn: async (regionId: string) => {
      const res = await fetch("/api/user-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regionId }),
      });
      if (!res.ok) throw new Error("Failed to track region search");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recentSearches"] });
    },
  });

  const trackBeach = useMutation({
    mutationFn: async (beachId: string) => {
      const res = await fetch("/api/user-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beachId }),
      });
      if (!res.ok) throw new Error("Failed to track beach search");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recentBeachSearches"] });
    },
  });

  return {
    trackRegion: trackRegion.mutate,
    trackBeach: trackBeach.mutate,
    isTrackingRegion: trackRegion.isPending,
    isTrackingBeach: trackBeach.isPending,
  };
}
