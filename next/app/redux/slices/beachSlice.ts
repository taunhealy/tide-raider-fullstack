import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { Beach } from "@/app/types/beaches";
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
  isLoading: boolean;
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
  isLoading: false,
};

export const fetchBeachesByRegion = createAsyncThunk(
  "beaches/fetchByRegion",
  async (region: string) => {
    console.log("🎣 Starting beach fetch for region:", region);
    const response = await fetch(`/api/beaches?regionId=${region}`);
    if (!response.ok) {
      console.error("❌ Failed to fetch beaches:", response.statusText);
      throw new Error("Failed to fetch beaches");
    }
    const beaches = await response.json();
    console.log("✅ Successfully fetched beaches:", {
      count: beaches.length,
      region,
      sampleBeach: beaches[0],
      allBeachIds: beaches.map((b: any) => b.id).slice(0, 5), // First 5 beach IDs
    });
    return beaches;
  }
);

export const beachSlice = createSlice({
  name: "beaches",
  initialState,
  reducers: {
    setAllBeaches: (state, action: PayloadAction<Beach[]>) => {
      console.log("📝 Setting all beaches:", {
        count: action.payload.length,
        sampleBeach: action.payload[0],
      });
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
      .addCase(fetchBeachesByRegion.pending, (state) => {
        console.log("⏳ Fetching beaches...");
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBeachesByRegion.fulfilled, (state, action) => {
        console.log("✅ Updating Redux state with beaches:", {
          count: action.payload.length,
          sampleBeach: action.payload[0],
          currentAllBeachesCount: state.allBeaches.length,
        });
        state.allBeaches = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchBeachesByRegion.rejected, (state, action) => {
        console.log("❌ Failed to fetch beaches:", action.error);
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch beaches";
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
