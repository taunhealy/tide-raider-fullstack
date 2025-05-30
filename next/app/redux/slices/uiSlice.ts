import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  isSidebarOpen: boolean;
  currentPage: number;
  viewMode: 'list' | 'map';
  isModalOpen: boolean;
  selectedBeachId: string | null;
  isMounted: boolean;
  forecastSource: 'A' | 'B';
}

const initialState: UIState = {
  isSidebarOpen: false,
  currentPage: 1,
  viewMode: 'list',
  isModalOpen: false,
  selectedBeachId: null,
  isMounted: false,
  forecastSource: 'A',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setViewMode: (state, action: PayloadAction<'list' | 'map'>) => {
      state.viewMode = action.payload;
    },
    openBeachModal: (state, action: PayloadAction<string>) => {
      state.isModalOpen = true;
      state.selectedBeachId = action.payload;
    },
    closeBeachModal: (state) => {
      state.isModalOpen = false;
      state.selectedBeachId = null;
    },
    setIsMounted: (state, action: PayloadAction<boolean>) => {
      state.isMounted = action.payload;
    },
    setForecastSource: (state, action: PayloadAction<'A' | 'B'>) => {
      state.forecastSource = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setCurrentPage,
  setViewMode,
  openBeachModal,
  closeBeachModal,
  setIsMounted,
  setForecastSource,
} = uiSlice.actions;

export default uiSlice.reducer;