import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { Beach } from "@/app/types/beaches";
import type { BaseForecastData, ForecastData } from "@/app/types/forecast";
import { calculateBeachScore } from "@/app/lib/surfUtils";
import { RootState } from "@/app/redux/store";
import { BeachScoreMap } from "@/app/types/scores";

interface BeachState {
  allBeaches: Beach[];
  filteredBeaches: Beach[];
  visibleBeaches: Beach[];
  regionCounts: Record<string, number>;
  beachScores: BeachScoreMap;
  sortedBeaches: Beach[];
  lastCalculated: number | null;
  isCalculating: boolean;
  error: string | null;
}

const initialState: BeachState = {
  allBeaches: [],
  filteredBeaches: [],
  visibleBeaches: [],
  regionCounts: {},
  beachScores: {},
  sortedBeaches: [],
  lastCalculated: null,
  isCalculating: false,
  error: null,
};

// Add a thunk to calculate scores
export const calculateBeachScores = createAsyncThunk(
  "beaches/calculateBeachScores",
  async (_, { getState }) => {
    const state = getState() as RootState;
    const beaches = state.beaches.allBeaches;
    const forecastData = state.forecast.data as ForecastData;
    const selectedRegion = state.filters.selectedRegion;

    // Add more detailed validation
    if (!forecastData) throw new Error("No forecast data available");
    if (!beaches.length) throw new Error("No beaches available");
    if (!selectedRegion) throw new Error("No region selected");

    // Format the forecast data correctly
    const formattedForecastData: BaseForecastData = {
      id: forecastData.id,
      date: new Date(forecastData.date),
      region: forecastData.region,
      windSpeed: forecastData.windSpeed,
      windDirection: forecastData.windDirection,
      swellHeight: forecastData.swellHeight,
      swellDirection: forecastData.swellDirection,
      swellPeriod: forecastData.swellPeriod,
      createdAt: forecastData.createdAt,
      updatedAt: forecastData.updatedAt,
    };

    const scoreMap: BeachScoreMap = {};

    beaches
      .filter((beach) => beach.region === selectedRegion)
      .forEach((beach) => {
        const result = calculateBeachScore(beach, formattedForecastData);
        scoreMap[beach.id] = {
          score: result.score,
          suitable: result.suitable,
        };
      });

    return scoreMap;
  }
);

export const beachSlice = createSlice({
  name: "beaches",
  initialState,
  reducers: {
    setAllBeaches: (state, action: PayloadAction<Beach[]>) => {
      state.allBeaches = action.payload;
    },
    setFilteredBeaches: (state, action: PayloadAction<Beach[]>) => {
      state.filteredBeaches = action.payload;
    },
    setVisibleBeaches: (state, action: PayloadAction<Beach[]>) => {
      state.visibleBeaches = action.payload;
    },
    setRegionCounts: (state, action: PayloadAction<Record<string, number>>) => {
      state.regionCounts = action.payload;
    },
    setBeachScores: (state, action: PayloadAction<BeachScoreMap>) => {
      state.beachScores = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(calculateBeachScores.pending, (state) => {
        state.isCalculating = true;
        state.error = null;
      })
      .addCase(calculateBeachScores.fulfilled, (state, action) => {
        state.beachScores = action.payload;
        state.lastCalculated = Date.now();
        state.isCalculating = false;
        state.error = null;
      })
      .addCase(calculateBeachScores.rejected, (state, action) => {
        state.isCalculating = false;
        state.error = action.error.message || "Failed to calculate scores";
      });
  },
});

export const {
  setAllBeaches,
  setFilteredBeaches,
  setVisibleBeaches,
  setRegionCounts,
  setBeachScores,
} = beachSlice.actions;

export default beachSlice.reducer;
