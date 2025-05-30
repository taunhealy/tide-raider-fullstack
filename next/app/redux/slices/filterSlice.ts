import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import type { Region, Difficulty, CrimeLevel } from "@/app/types/beaches";
import { fetchForecast } from "./forecastSlice";
import { setBeachScores, setRegionCounts } from "./beachSlice";
import {
  calculateRegionScores,
  calculateRegionCounts,
} from "@/app/lib/surfUtils";
import { RootState } from "../store";

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
  selectedRegion: Region | null;
}

const initialState: FilterState = {
  continent: [],
  country: [],
  waveType: [],
  difficulty: [],
  region: [],
  crimeLevel: [],
  minPoints: 0,
  sharkAttack: [],
  minDistance: undefined,
  searchQuery: "",
  selectedRegion: null,
};

export const filterSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<FilterState>>) => {
      return { ...state, ...action.payload };
    },
    updateFilter: (
      state,
      action: PayloadAction<{ key: keyof FilterState; value: any }>
    ) => {
      const { key, value } = action.payload;
      (state as any)[key] = value;
    },
    setSelectedRegion: (state, action: PayloadAction<Region | null>) => {
      state.selectedRegion = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setMinPoints: (state, action: PayloadAction<number>) => {
      state.minPoints = action.payload;
    },
    saveDefaultFilters: (state) => {
      // Save current filters to localStorage
      localStorage.setItem("defaultFilters", JSON.stringify(state));
    },
    loadDefaultFilters: (state) => {
      const savedFilters = localStorage.getItem("defaultFilters");
      if (savedFilters) {
        return { ...state, ...JSON.parse(savedFilters) };
      }
    },
  },
});

export const {
  setFilters,
  updateFilter,
  setSelectedRegion,
  setSearchQuery,
  setMinPoints,
  saveDefaultFilters,
  loadDefaultFilters,
} = filterSlice.actions;

export default filterSlice.reducer;

// Selectors
const selectBeaches = (state: RootState) => state.beaches.allBeaches;
const selectForecastData = (state: RootState) => state.forecast.data;

export const changeRegion = createAsyncThunk(
  "filters/changeRegion",
  async (region: Region | null, { dispatch, getState }) => {
    console.log("DEBUG changeRegion - Starting with region:", region);

    // First update the region
    dispatch(setSelectedRegion(region));

    // Update the region filter array
    dispatch(updateFilter({ key: "region", value: region ? [region] : [] }));

    // Only fetch conditions if we have a valid region
    if (region) {
      console.log(
        "DEBUG changeRegion - Fetching conditions for region:",
        region
      );
      await dispatch(fetchForecast(region));

      // Get state in a type-safe way
      const state = getState() as RootState;
      console.log(
        "DEBUG changeRegion - Forecast data after fetch:",
        state.forecast
      );
    }

    // Get state in a type-safe way
    const state = getState() as RootState;
    const allBeaches = selectBeaches(state);
    const forecastData = selectForecastData(state);

    console.log("DEBUG changeRegion - Before score calculation:", {
      hasBeaches: !!allBeaches?.length,
      beachCount: allBeaches?.length,
      hasForecastData: !!forecastData,
      forecastData,
    });

    // Only calculate scores if we have both beaches and forecast data
    if (allBeaches?.length && forecastData) {
      const regionScores = calculateRegionScores(
        allBeaches,
        region || "Global",
        forecastData
      );
      console.log("DEBUG changeRegion - Calculated scores:", regionScores);

      const regionCounts = calculateRegionCounts(regionScores);

      dispatch(setBeachScores(regionScores));
      dispatch(setRegionCounts(regionCounts));
    }
  }
);
