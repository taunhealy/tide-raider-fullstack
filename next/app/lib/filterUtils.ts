import type { Beach } from "@/app/types/beaches";
import type { Difficulty, CrimeLevel, SharkRisk } from "@prisma/client";
import type { Region } from "@/app/types/beaches";

export interface FilterState {
  continent: string[];
  country: string[];
  waveType: string[];
  difficulty: Difficulty[];
  region: Region[];
  crimeLevel: CrimeLevel[];
  minPoints: number;
  sharkAttack: string[];
  minDistance?: number;
  searchQuery: string;
  selectedRegion: string | null;
}

/**
 * Filter beaches based on filter criteria
 */
export function filterBeaches(
  beaches: Beach[],
  filters: Partial<FilterState>
): Beach[] {
  return beaches.filter((beach) => {
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesSearch =
        beach.name.toLowerCase().includes(query) ||
        beach.location?.toLowerCase().includes(query) ||
        beach.description?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Continent filter
    if (filters.continent && filters.continent.length > 0) {
      if (!filters.continent.includes(beach.continent)) return false;
    }

    // Country filter
    if (filters.country && filters.country.length > 0) {
      const beachCountry =
        typeof beach.country === "string"
          ? beach.country
          : beach.country?.name || beach.countryId;
      if (beachCountry && !filters.country.includes(beachCountry)) return false;
    }

    // Region filter
    if (filters.region && filters.region.length > 0) {
      const regionNames = filters.region.map((r) =>
        typeof r === "string" ? r : r.name
      );
      const beachRegion =
        typeof beach.region === "string"
          ? beach.region
          : beach.region?.name || beach.regionId;
      if (beachRegion && !regionNames.includes(beachRegion)) return false;
    }

    // Wave type filter
    if (filters.waveType && filters.waveType.length > 0) {
      if (!filters.waveType.includes(beach.waveType)) return false;
    }

    // Difficulty filter
    if (filters.difficulty && filters.difficulty.length > 0) {
      if (!filters.difficulty.includes(beach.difficulty as Difficulty))
        return false;
    }

    // Crime level filter
    if (filters.crimeLevel && filters.crimeLevel.length > 0) {
      if (!filters.crimeLevel.includes(beach.crimeLevel as CrimeLevel))
        return false;
    }

    // Shark attack filter
    if (filters.sharkAttack && filters.sharkAttack.length > 0) {
      if (!filters.sharkAttack.includes(beach.sharkAttack.risk as SharkRisk))
        return false;
    }

    // Distance filter
    if (
      filters.minDistance !== undefined &&
      beach.distanceFromCT < filters.minDistance
    ) {
      return false;
    }

    return true;
  });
}
