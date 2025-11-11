import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { ForecastData } from "@/app/types/forecast";
import { getLatestConditions } from "@/app/api/surf-conditions/route";

interface ForecastState {
  data: ForecastData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: ForecastState = {
  data: null,
  loading: false,
  error: null,
  lastUpdated: null,
};

// Async thunk that uses the API route
export const fetchForecast = createAsyncThunk(
  "forecast/fetchForecast",
  async (region: string, { rejectWithValue }) => {
    try {
      const forecast = await getLatestConditions(false, region);

      if (!forecast) {
        return rejectWithValue("No forecast data available");
      }

      return forecast as ForecastData;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch forecast");
    }
  }
);

export const forecastSlice = createSlice({
  name: "forecast",
  initialState,
  reducers: {
    clearForecast: (state) => {
      state.data = null;
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchForecast.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchForecast.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
        state.error = null;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchForecast.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearForecast } = forecastSlice.actions;

export default forecastSlice.reducer;
