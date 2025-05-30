// next/app/hooks/useForecastData.ts
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux/hooks";
import { fetchForecast } from "@/app/redux/slices/forecastSlice";
import { ForecastData } from "@/app/types/forecast";

export function useForecastData(region: string | null) {
  const dispatch = useAppDispatch();
  const { data, loading, error, lastUpdated } = useAppSelector(
    (state) => state.forecast
  );

  useEffect(() => {
    if (region) {
      dispatch(fetchForecast(region));
    }
  }, [region, dispatch]);

  return {
    forecastData: data as ForecastData | null,
    isLoading: loading,
    error,
    lastUpdated,
  };
}
