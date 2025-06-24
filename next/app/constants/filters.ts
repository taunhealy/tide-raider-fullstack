import { RaidFilters } from "../types/filters";

export const DEFAULT_RAID_FILTERS: RaidFilters = {
  location: {
    region: "",
    regionId: "",
    country: "",
    continent: "",
  },
  waveType: [],
  difficulty: [],
  minPoints: 0,
  crimeLevel: [],
  sharkAttack: [],
  searchQuery: "",
  hasAttack: false,
};
