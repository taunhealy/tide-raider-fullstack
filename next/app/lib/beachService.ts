/**
 * Beach Service
 * Central service for all beach-related database queries
 * Uses backend API instead of direct Prisma access
 */

import { backendGet } from "@/app/lib/backend-api";

// Type definitions for beach with relations
export type Beach = {
  id: string;
  name: string;
  continent?: string | null;
  countryId?: string | null;
  regionId?: string | null;
  location?: string | null;
  [key: string]: any;
};

export type Region = {
  id: string;
  name: string;
  countryId?: string | null;
  continent?: string | null;
  [key: string]: any;
};

export type Country = {
  id: string;
  name: string;
  continentId?: string | null;
  [key: string]: any;
};

// Type definitions for beach with relations
export type BeachWithRelations = Beach & {
  region?: Region | null;
  country?: Country | null;
};

// Standard beach select - kept for type compatibility, but backend handles selection
export const standardBeachSelect = {} as const;

/**
 * Get all beaches with relations
 * Use with caution - this can be a large dataset
 */
export async function getAllBeaches(): Promise<BeachWithRelations[]> {
  try {
    const result = await backendGet<{ beaches: BeachWithRelations[] }>("/api/beaches");
    return result.beaches || [];
  } catch (error) {
    console.error("Error fetching all beaches:", error);
    return [];
  }
}

/**
 * Get beaches by region ID
 * @deprecated Use backend API directly via /api/beaches?regionId=xxx
 */
export async function getBeachesByRegion(
  regionId: string
): Promise<BeachWithRelations[]> {
  try {
    const result = await backendGet<{ beaches: BeachWithRelations[] }>(`/api/beaches?regionId=${regionId}`);
    return result.beaches || [];
  } catch (error) {
    console.error(`Error fetching beaches for region ${regionId}:`, error);
    return [];
  }
}

/**
 * Get beaches by country ID
 * @deprecated Use backend API directly
 */
export async function getBeachesByCountry(
  countryId: string
): Promise<BeachWithRelations[]> {
  // Backend doesn't have country filter yet - return empty for now
  console.warn("getBeachesByCountry: Not implemented via backend API");
  return [];
}

/**
 * Get a single beach by ID or name
 */
export async function getBeachById(
  beachId: string
): Promise<BeachWithRelations | null> {
  try {
    const result = await backendGet<{ beach: BeachWithRelations }>(`/api/beaches/${encodeURIComponent(beachId)}`);
    return result.beach || null;
  } catch (error) {
    console.error(`Error fetching beach ${beachId}:`, error);
    return null;
  }
}

/**
 * Get a single beach by name
 * @deprecated Use getBeachById or backend API directly
 */
export async function getBeachByName(
  name: string
): Promise<BeachWithRelations | null> {
  // Use getBeachById which works with names too
  return getBeachById(name);
}

/**
 * Search beaches by term (name or location)
 * @deprecated Use backend API /api/beaches/search
 */
export async function searchBeaches(
  term: string,
  options?: {
    regionId?: string;
    limit?: number;
  }
): Promise<BeachWithRelations[]> {
  try {
    const { regionId } = options || {};
    const url = regionId
      ? `/api/beaches/search?term=${encodeURIComponent(term)}&regionId=${regionId}`
      : `/api/beaches/search?term=${encodeURIComponent(term)}`;
    const beaches = await backendGet<BeachWithRelations[]>(url);
    return beaches || [];
  } catch (error) {
    console.error(`Error searching beaches with term "${term}":`, error);
    return [];
  }
}

/**
 * Get beaches with filtering options
 * @deprecated Use backend API /api/filtered-beaches
 */
export async function getBeachesWithFilters(filters: {
  regionId?: string;
  countryId?: string;
  difficulty?: string[];
  waveType?: string[];
  optimalTide?: string[];
  continent?: string;
}): Promise<BeachWithRelations[]> {
  try {
    const params = new URLSearchParams();
    if (filters.regionId) params.append("regionId", filters.regionId);
    if (filters.difficulty) params.append("difficulty", filters.difficulty.join(","));
    if (filters.waveType) params.append("waveType", filters.waveType.join(","));
    // Add other filters as needed
    
    const result = await backendGet<{ beaches: BeachWithRelations[] }>(`/api/filtered-beaches?${params.toString()}`);
    return result.beaches || [];
  } catch (error) {
    console.error("Error fetching beaches with filters:", error);
    return [];
  }
}

/**
 * Get unique regions from beaches
 * @deprecated Use backend API /api/regions
 */
export async function getUniqueRegions(): Promise<Region[]> {
  try {
    const regions = await backendGet<Region[]>("/api/regions");
    return regions || [];
  } catch (error) {
    console.error("Error fetching regions:", error);
    return [];
  }
}

/**
 * Get unique countries from beaches
 * @deprecated Use backend API /api/geo
 */
export async function getUniqueCountries(): Promise<Country[]> {
  try {
    const result = await backendGet<{ countries: Country[] }>("/api/geo");
    return result.countries || [];
  } catch (error) {
    console.error("Error fetching countries:", error);
    return [];
  }
}

/**
 * Get beach count by region
 * @deprecated Not available via backend API yet
 */
export async function getBeachCountByRegion(): Promise<Record<string, number>> {
  console.warn("getBeachCountByRegion: Not implemented via backend API");
  return {};
}
