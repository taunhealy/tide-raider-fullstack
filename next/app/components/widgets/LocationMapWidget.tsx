"use client";

import { useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";

interface LocationMapWidgetProps {
  title?: string;
  location: {
    beachName: string;
    region: string;
    country: string;
    continent: string;
    weatherCity?: string;
  };
  config?: {
    mapStyle: "standard" | "satellite" | "terrain";
    showNearbyBeaches: boolean;
  };
}

export default function LocationMapWidget({
  title = "Location",
  location,
  config,
}: LocationMapWidgetProps) {
  const { beachName, region, country } = location;
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      version: "weekly",
    });

    loader.load().then((google) => {
      const geocoder = new google.maps.Geocoder();
      const locationString = `${beachName}, ${region}, ${country}`;

      geocoder.geocode({ address: locationString }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const map = new google.maps.Map(mapRef.current!, {
            center: results[0].geometry.location,
            zoom: 12,
            mapTypeId: config?.mapStyle || "standard",
          });

          new google.maps.Marker({
            map,
            position: results[0].geometry.location,
            title: beachName,
          });
        }
      });
    });
  }, [location, config]);

  const handleOpenGoogleMaps = (e: React.MouseEvent) => {
    e.preventDefault();
    const searchQuery = encodeURIComponent(
      `${beachName}, ${region}, ${country}`
    );
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>

      {/* Location Info */}
      <div className="mb-4">
        <p className="font-medium">{beachName}</p>
        <p className="text-gray-600">
          {region}, {country}
        </p>
      </div>

      {/* Map Component */}
      <div className="aspect-video relative mb-4 rounded-lg overflow-hidden">
        <div ref={mapRef} className="w-full h-full" />
      </div>

      <button
        onClick={handleOpenGoogleMaps}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
        View on Google Maps
      </button>
    </div>
  );
}
