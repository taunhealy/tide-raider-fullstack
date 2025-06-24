import { useCallback } from "react";
import { DEFAULT_RAID_FILTERS } from "@/app/constants/filters";
import { RaidFilters } from "@/app/types/filters";
import { beachData } from "@/app/types/beaches";
import { Region } from "@/app/types/regions";

export function useRaidFilters() {
  const getInitialFilters = useCallback(
    (
      params: {
        regionId?: string;
      } = {}
    ): RaidFilters => {
      const regionId = params.regionId || "";

      return {
        ...DEFAULT_RAID_FILTERS,
        location: {
          ...DEFAULT_RAID_FILTERS.location,
          regionId,
        },
      };
    },
    []
  );

  return { getInitialFilters };
}
