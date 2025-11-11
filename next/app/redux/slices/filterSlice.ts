import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import type { Region } from "@/app/types/beaches";
import { fetchForecast } from "./forecastSlice";
import { fetchBeachesByRegion } from "./beachSlice";
import type { FilterState } from "@/app/lib/filterUtils";

import { RootState } from "../store";

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
    setSelectedRegion: (state, action: PayloadAction<string | null>) => {
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

export const changeRegion = createAsyncThunk(
  "filters/changeRegion",
  async (regionName: string | null, { dispatch }) => {
    // First, update the selected region immediately
    dispatch(setSelectedRegion(regionName));

    // Also update the region filter array to match
    if (regionName) {
      dispatch(updateFilter({ key: "region", value: [regionName] }));
      // Then fetch the data
      await dispatch(fetchBeachesByRegion(regionName)).unwrap();
      await dispatch(fetchForecast(regionName)).unwrap();
    } else {
      dispatch(updateFilter({ key: "region", value: [] }));
    }
  }
);
