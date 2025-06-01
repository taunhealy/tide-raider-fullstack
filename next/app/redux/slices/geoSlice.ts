import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchGeoData = createAsyncThunk(
  "geo/fetchData",
  async (_, { rejectWithValue }) => {
    try {
      // Single request to get all geographic data
      const response = await fetch("/api/geo?type=all");

      if (!response.ok) {
        throw new Error("Failed to fetch geographic data");
      }

      // Response includes continents, countries, and regions
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error?.message || "An unknown error occurred");
    }
  }
);

// Define more accurate types
interface Continent {
  id: string;
  name: string;
}

interface Country {
  id: string;
  name: string;
  continentId: string;
  continent: Continent;
}

interface Region {
  id: string;
  name: string;
  countryId: string;
  country: Country;
}

interface GeoData {
  continents: Continent[];
  countries: Country[];
  regions: Region[];
  isLoading: boolean;
  error: string | null;
}

const geoSlice = createSlice({
  name: "geo",
  initialState: {
    continents: [],
    countries: [],
    regions: [],
    isLoading: false,
    error: null as string | null,
  } as GeoData,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGeoData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGeoData.fulfilled, (state, action) => {
        state.continents = action.payload.continents;
        state.countries = action.payload.countries;
        state.regions = action.payload.regions;
        state.isLoading = false;
      })
      .addCase(fetchGeoData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default geoSlice.reducer;
