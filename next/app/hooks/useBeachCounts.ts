// hooks/useBeachCounts.ts
export function useBeachCounts(selectedRegion: string, initialBeaches: Beach[]) {
    const { data: beachCounts } = useQuery({
      queryKey: ["beachCounts", selectedRegion],
      queryFn: async () => {
        if (!selectedRegion) return {};
        
        const today = new Date().toISOString().split("T")[0];
        const response = await fetch(`/api/beach-counts?region=${encodeURIComponent(selectedRegion)}&date=${today}`);
        const data = await response.json();
        
        if (data.count > 0) {
          const regionBeach = initialBeaches.find((b) => b.region === selectedRegion);
          if (regionBeach) {
            return {
              [regionBeach.region]: data.count,
              [regionBeach.country]: data.count,
              [regionBeach.continent]: data.count,
            };
          }
        }
        return {};
      },
      enabled: !!selectedRegion,
    });
    
    return beachCounts;
  }