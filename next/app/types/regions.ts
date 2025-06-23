// app/types/regions.ts
import type { Country } from "@prisma/client";

// Match your Prisma schema but only include what UI needs
export interface Region {
  id: string;
  name: string;
  countryId: string;
  continent: string | null;
  country: {
    id: string;
    name: string;
  } | null;
  beaches: Array<{
    id: string;
    name: string;
    waveType: string;
    difficulty: string;
  }>;
}
