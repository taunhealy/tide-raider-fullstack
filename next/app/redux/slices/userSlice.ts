import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  isSubscribed: boolean;
  hasActiveTrial: boolean;
  isBetaMode: boolean;
  profile: any | null;
}

const initialState: UserState = {
  isSubscribed: false,
  hasActiveTrial: false,
  isBetaMode: false,
  profile: null,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserStatus: (state, action: PayloadAction<Partial<UserState>>) => {
      return { ...state, ...action.payload };
    },
    setIsSubscribed: (state, action: PayloadAction<boolean>) => {
      state.isSubscribed = action.payload;
    },
    setHasActiveTrial: (state, action: PayloadAction<boolean>) => {
      state.hasActiveTrial = action.payload;
    },
    setIsBetaMode: (state, action: PayloadAction<boolean>) => {
      state.isBetaMode = action.payload;
    },
    setUserProfile: (state, action: PayloadAction<any>) => {
      state.profile = action.payload;
    },
  },
});

export const {
  setUserStatus,
  setIsSubscribed,
  setHasActiveTrial,
  setIsBetaMode,
  setUserProfile,
} = userSlice.actions;

export default userSlice.reducer;
