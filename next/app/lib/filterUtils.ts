// Create a new utility file for filter-related functions
import { Beach, FilterType } from "@/app/types/beaches";

export function filterBeaches(beaches: Beach[], filters: FilterType): Beach[] {
  console.log("🎯 filterBeaches called with:", {
    beachCount: beaches?.length,
    filters,
    sampleBeach: beaches?.[0],
  });

  if (!beaches?.length) return [];

  // If selectedRegion is set, only show beaches from that region
  if (filters.location.region) {
    beaches = beaches.filter(
      (beach) => beach.region.name === filters.location.region
    );
  }

  const filtered = beaches.filter((beach) => {
    // Only apply other filters if they are set
    if (
      filters.location.continent &&
      !filters.location.continent.includes(beach.continent)
    )
      return false;
    if (
      filters.location.country &&
      !filters.location.country.includes(beach.country)
    )
      return false;
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
