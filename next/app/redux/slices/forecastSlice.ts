import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { ForecastData } from "@/app/types/forecast";
import {
  fetchForecastData,
  processForecastData,
} from "@/app/services/forecastService";

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

// Async thunk that uses the service
export const fetchForecast = createAsyncThunk(
  "forecast/fetchForecast",
  async (region: string, { rejectWithValue }) => {
    try {
      const response = await fetchForecastData(region);

      if (!response || !response.data) {
        return rejectWithValue("No forecast data available");
      }

      // Process data to ensure all fields exist
      return processForecastData(response.data);
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
