import { useEffect } from "react";

export function useBeachDataInitialization(
  windData: any,
  selectedRegion: string
) {
  useEffect(() => {
    async function initializeBeachData() {
      if (windData) {
        const today = new Date().toISOString().split("T")[0];
        const res = await fetch(
          `/api/beach-ratings/region-counts?region=${encodeURIComponent(selectedRegion)}&date=${today}`
        );
        const data = await res.json();
        // The API endpoint handles checking/storing ratings
      }
    }

    initializeBeachData();
  }, [windData, selectedRegion]);
}
