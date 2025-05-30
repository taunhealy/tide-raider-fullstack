"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/app/redux/hooks";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { selectBeachAttributes } from "../../redux/selectors";

// Optional: Use react-leaflet if you have it installed
// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// import "leaflet/dist/leaflet.css";

export default function MapView() {
  const { uniqueRegions } = useAppSelector(selectBeachAttributes);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Get data from Redux store
  const { filteredBeaches, beachScores } = useAppSelector(
    (state) => state.beaches
  );

  const { data: windData } = useAppSelector((state) => state.forecast);

  // Client-side only
  useEffect(() => {
    // Initialize map here if using a map library
    const timer = setTimeout(() => {
      setIsMapLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!isMapLoaded) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-white rounded-lg border border-gray-200">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // For demo/placeholder purposes
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800 font-primary mb-2">
          Map View
        </h3>
        <p className="text-sm text-gray-600 font-primary">
          Interactive map showing {filteredBeaches.length} surf spots
        </p>
      </div>

      {/* Map placeholder - replace with actual map implementation */}
      <div className="h-[500px] bg-gray-100 rounded relative overflow-hidden">
        {/* Map placeholder */}
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <p className="text-gray-500 font-primary mb-2">
            Map View Coming Soon
          </p>
          <div className="grid grid-cols-2 gap-2 p-4">
            {(uniqueRegions as string[]).slice(0, 6).map((region) => (
              <div
                key={region}
                className="bg-white p-3 rounded-md shadow-sm text-center font-primary text-sm border border-gray-200"
              >
                {region}
                <div className="text-xs text-gray-500 mt-1">
                  {filteredBeaches.filter((b) => b.region === region).length}{" "}
                  spots
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <div className="text-sm text-gray-600 font-primary">
          Showing: All beaches
        </div>
        <div className="text-sm text-gray-600 font-primary">
          Data updated:{" "}
          {windData?.timestamp
            ? new Date(windData.timestamp).toLocaleString()
            : "N/A"}
        </div>
      </div>
    </div>
  );
}
