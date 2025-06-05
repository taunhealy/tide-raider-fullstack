// Create a new utility file for filter-related functions
import { Beach, FilterType } from "@/app/types/beaches";

export function filterBeaches(beaches: Beach[], filters: FilterType): Beach[] {
  console.log("🎯 filterBeaches called with:", {
    beachCount: beaches?.length,
    filters,
    sampleBeach: beaches?.[0],
  });

  if (!beaches?.length) return [];

  const filtered = beaches.filter((beach) => {
    // Only filter by region for beach cards display
    if (
      filters.location.region &&
      beach.region.name !== filters.location.region
    ) {
      return false;
    }

    // Apply other non-location filters
    if (
      filters.waveType.length > 0 &&
      !filters.waveType.includes(beach.waveType)
    )
      return false;
    if (
      filters.difficulty.length > 0 &&
      !filters.difficulty.includes(beach.difficulty)
    )
      return false;
    if (
      filters.crimeLevel.length > 0 &&
      !filters.crimeLevel.includes(beach.crimeLevel)
    )
      return false;
    if (
      filters.sharkAttack.length > 0 &&
      beach.sharkAttack &&
      !filters.sharkAttack.includes(beach.sharkAttack.hasAttack ? "yes" : "no")
    )
      return false;

    return true;
  });

  console.log("🎯 filterBeaches result:", {
    filteredCount: filtered.length,
    sampleFilteredBeach: filtered[0],
    region: filters.location.region,
  });

  return filtered;
}
