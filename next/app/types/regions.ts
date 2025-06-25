// app/types/regions.ts
import type { Country } from "@prisma/client";

// Match your Prisma schema but only include what UI needs
export interface Region {
  id: string;
  name: string;
  country: string;
  continent: string;
}

export interface UserSearch {
  id: string;
  region: Region;
}
