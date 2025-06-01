import { configureStore, Middleware } from "@reduxjs/toolkit";
import filterReducer from "./slices/filterSlice";
import beachReducer from "./slices/beachSlice";
import forecastReducer from "./slices/forecastSlice";
import uiReducer from "./slices/uiSlice";
import userReducer from "./slices/userSlice";
import geoReducer from "./slices/geoSlice";

const loggerMiddleware: Middleware = (store) => (next) => (action: any) => {
  console.log("🔄 Redux Action:", action.type, action);
  return next(action);
};

export const store = configureStore({
  reducer: {
    filters: filterReducer,
    beaches: beachReducer,
    forecast: forecastReducer,
    ui: uiReducer,
    user: userReducer,
    geo: geoReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(loggerMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
