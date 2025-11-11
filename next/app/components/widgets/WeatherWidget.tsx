"use client";

import { Cloud, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useBeach } from "@/app/context/BeachContext";
import { WeatherWidgetProps } from "@/app/types/blog";

interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  location: string;
  timestamp: number;
}

export default function WeatherWidget({ title, region }: WeatherWidgetProps) {
  const { beaches } = useBeach();

  // Get coordinates for the region from database beaches
  const getRegionCoordinates = (region: string) => {
    const beach = beaches.find((beach) => beach.region?.name === region);
    return beach
      ? {
          lat: (beach.coordinates as any).lat,
          lon: (beach.coordinates as any).lng, // OpenWeather uses 'lon' not 'lng'
        }
      : null;
  };

  const {
    data: weather,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["weather", region],
    queryFn: async () => {
      const coordinates = getRegionCoordinates(region);
      if (!coordinates) throw new Error("Region not found");

      const params = new URLSearchParams({
        lat: coordinates.lat.toString(),
        lon: coordinates.lon.toString(),
      });
      const response = await fetch(`/api/weather?${params}`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    },
    enabled: !!region,
    staleTime: 1000 * 60 * 15,
    refetchInterval: 1000 * 60 * 15,
  });

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-primary text-lg font-semibold">{title}</h3>
        {weather && (
          <span className="text-xs text-gray-400">
            Updated {new Date(weather.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="text-red-500 p-4 text-sm">{error.message}</div>
      ) : weather ? (
        <div className="flex items-center gap-4">
          <img
            src={weather.icon}
            alt={weather.condition}
            className="w-16 h-16"
          />
          <div>
            <p className="font-primary text-2xl font-bold">{weather.temp}°C</p>
            <p className="font-primary text-sm text-gray-600">
              {weather.location}
            </p>
            <p className="font-primary text-sm text-gray-500">
              {weather.condition}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center p-4">
          <Cloud className="w-6 h-6 text-gray-400" />
          <p className="font-primary ml-2 text-gray-500">
            No weather data available
          </p>
        </div>
      )}
    </div>
  );
}
