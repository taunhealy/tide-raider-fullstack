// Create a new utility file for filter-related functions
import { Beach, FilterType } from "@/app/types/beaches";

export function filterBeaches(beaches: Beach[], filters: FilterType): Beach[] {
  if (!beaches?.length) return [];

  return beaches.filter((beach) => {
    if (
      filters.continent.length > 0 &&
      !filters.continent.includes(beach.continent)
    )
      return false;
    if (filters.country.length > 0 && !filters.country.includes(beach.country))
      return false;
    if (filters.region.length > 0 && !filters.region.includes(beach.region))
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
}
