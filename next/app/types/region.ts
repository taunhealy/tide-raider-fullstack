// app/types/regions.ts
import type { Country } from "@prisma/client";

// Match your Prisma schema but only include what UI needs
export interface Region {
  id: string;
  name: string;
  countryId: string;
  continent?: string;
  country?: {
    id: string;
    name: string;
    continentId: string;
  };
}

export interface UserSearch {
  id: string;
  region: Region;
}
