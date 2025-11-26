"use client";

import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Beach } from "@/app/types/beaches";

interface HiddenGemsMapProps {
  beaches: Beach[];
  selectedBeach: Beach | null;
  onBeachSelect: (beach: Beach | null) => void;
}

export default function HiddenGemsMap({
  beaches,
  selectedBeach,
  onBeachSelect,
}: HiddenGemsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || isLoaded) return;

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      version: "weekly",
    });

    loader.load().then((google) => {
      // Default center (will be adjusted based on beaches)
      const defaultCenter = { lat: -33.9249, lng: 18.4241 }; // Cape Town

      const map = new google.maps.Map(mapRef.current!, {
        center: defaultCenter,
        zoom: 8,
        mapTypeId: "terrain",
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      googleMapRef.current = map;
      setIsLoaded(true);
    });
  }, [isLoaded]);

  // Update markers when beaches change
  useEffect(() => {
    if (!googleMapRef.current || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (beaches.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    // Create markers for each beach
    beaches.forEach((beach) => {
      if (!beach.coordinates?.lat || !beach.coordinates?.lng) return;

      const position = {
        lat: beach.coordinates.lat,
        lng: beach.coordinates.lng,
      };

      // Custom marker icon with sparkle effect for hidden gems
      const marker = new google.maps.Marker({
        position,
        map: googleMapRef.current!,
        title: beach.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: selectedBeach?.id === beach.id ? 12 : 8,
          fillColor: selectedBeach?.id === beach.id ? "#a855f7" : "#ec4899",
          fillOpacity: 0.9,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        animation:
          selectedBeach?.id === beach.id
            ? google.maps.Animation.BOUNCE
            : undefined,
      });

      // Add click listener
      marker.addListener("click", () => {
        onBeachSelect(beach);
      });

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="font-weight: 600; margin-bottom: 4px; color: #1f2937;">${beach.name}</h3>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">${beach.location}</p>
            <p style="font-size: 12px; color: #9ca3af;">
              ${beach.waveType.replace(/_/g, " ")} • ${beach.difficulty}
            </p>
          </div>
        `,
      });

      marker.addListener("mouseover", () => {
        infoWindow.open(googleMapRef.current!, marker);
      });

      marker.addListener("mouseout", () => {
        infoWindow.close();
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // Fit map to show all markers
    if (beaches.length > 0) {
      googleMapRef.current.fitBounds(bounds);
      
      // Adjust zoom if only one beach
      if (beaches.length === 1) {
        googleMapRef.current.setZoom(12);
      }
    }
  }, [beaches, selectedBeach, onBeachSelect, isLoaded]);

  // Pan to selected beach
  useEffect(() => {
    if (!googleMapRef.current || !selectedBeach) return;

    if (selectedBeach.coordinates?.lat && selectedBeach.coordinates?.lng) {
      googleMapRef.current.panTo({
        lat: selectedBeach.coordinates.lat,
        lng: selectedBeach.coordinates.lng,
      });
      googleMapRef.current.setZoom(13);
    }
  }, [selectedBeach]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading map...</p>
          </div>
        </div>
      )}

      {/* Beach count badge */}
      <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-4 py-2 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-purple-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
        <span className="font-semibold text-gray-900 dark:text-white">
          {beaches.length} Hidden {beaches.length === 1 ? "Gem" : "Gems"}
        </span>
      </div>
    </div>
  );
}
