import { configureStore } from "@reduxjs/toolkit";
import filterReducer from "./slices/filterSlice";
import beachReducer from "./slices/beachSlice";
import forecastReducer from "./slices/forecastSlice";
import uiReducer from "./slices/uiSlice";
import userReducer from "./slices/userSlice";

export const store = configureStore({
  reducer: {
    filters: filterReducer,
    beaches: beachReducer,
    forecast: forecastReducer,
    ui: uiReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
