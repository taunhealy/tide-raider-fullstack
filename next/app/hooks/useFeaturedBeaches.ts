"use client";

import { useQuery } from "@tanstack/react-query";
import { Beach } from "@/app/types/beaches";

const FEATURED_BEACHES = [
  "jeffreys-bay",
  "muizenberg",
  "ponta-do-ouro",
  // ... other beaches
];

export function useFeaturedBeaches() {
  return useQuery({
    queryKey: ["featured-beaches"],
    queryFn: async () => {
      const res = await fetch(`/api/beaches?ids=${FEATURED_BEACHES.join(",")}`);
      if (!res.ok) throw new Error("Failed to fetch beaches");
      return res.json() as Promise<Beach[]>;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
