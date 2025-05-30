"use client";

import { useEffect, useState, useRef } from "react";
import { Beach, Region } from "@/app/types/beaches";
import { WindData, WindDataProp } from "@/app/types/wind";
import {
  isBeachSuitable,
  getScoreDisplay,
  getGatedBeaches,
} from "@/app/lib/surfUtils";
import { Map as OLMap, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import { Feature } from "ol";
import { Point } from "ol/geom";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Style, Icon } from "ol/style";
import { cn } from "@/app/lib/utils";
import { Inter } from "next/font/google";
import { MapPin } from "lucide-react";
import "ol/ol.css";
import { useSubscription } from "../context/SubscriptionContext";
import WindCompass from "./WindCompass";
import { degreesToCardinal } from "@/app/lib/surfUtils";

const inter = Inter({ subsets: ["latin"] });

interface MapProps {
  beaches: Beach[];
  windData: WindDataProp;
  regions: string[];
  selectedRegions: string[];
  onRegionClick: any;
  filters: any;
  hasActiveTrial: boolean;
  isBetaMode: boolean;
}

export default function Map({ beaches, windData, hasActiveTrial }: MapProps) {
  const { isSubscribed } = useSubscription();
  const [selectedBeach, setSelectedBeach] = useState<
    (Beach & { score: number }) | null
  >(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<OLMap | null>(null);

  // Apply gating to beaches before processing
  const { visibleBeaches } = getGatedBeaches(
    beaches,
    windData || null,
    isSubscribed,
    hasActiveTrial
  );

  const topBeaches = windData
    ? visibleBeaches
        .map((beach) => ({
          ...beach,
          score: isBeachSuitable(beach, windData).score,
        }))
        .filter((beach) => beach.score >= 4)
        .sort((a, b) => b.score - a.score)
    : [];

  const navigateToBeach = (beach: Beach & { score: number }) => {
    if (!mapInstance.current) return;

    // Set the view to the beach location
    mapInstance.current.getView().animate({
      center: fromLonLat([beach.coordinates.lng, beach.coordinates.lat]),
      zoom: 13,
      duration: 1000,
    });

    // Set the selected beach to show its popup
    setSelectedBeach(beach);
  };

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Initialize map
    const map = new OLMap({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([18.5, -34.0]), // Cape Town coordinates
        zoom: 9,
      }),
    });

    mapInstance.current = map;

    return () => {
      map.setTarget(undefined);
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!windData || !mapInstance.current) return;

    const filtered = beaches
      .map((beach) => ({
        ...beach,
        score: isBeachSuitable(beach, windData).score,
      }))
      .filter((beach) => beach.score >= 2);

    // Create features for beaches
    const features = filtered.map((beach) => {
      const feature = new Feature({
        geometry: new Point(
          fromLonLat([beach.coordinates.lng, beach.coordinates.lat])
        ),
        properties: beach,
      });

      // Only make feature clickable if subscribed or not a premium spot
      const isPremiumSpot = beach.score >= 4;
      if (isSubscribed || !isPremiumSpot) {
        feature.setStyle(
          new Style({
            image: new Icon({
              src: "/marker.png",
              scale: 0.5,
            }),
          })
        );
      } else {
        feature.setStyle(
          new Style({
            image: new Icon({
              src: "/locked-marker.png",
              scale: 0.5,
            }),
          })
        );
      }

      return feature;
    });

    // Create vector layer for markers
    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        features,
      }),
    });

    // Clear existing layers except base layer
    const layers = mapInstance.current.getLayers();
    while (layers.getLength() > 1) {
      layers.removeAt(1);
    }

    mapInstance.current.addLayer(vectorLayer);

    // Add click handler
    mapInstance.current.on("click", (event) => {
      const feature = mapInstance.current?.forEachFeatureAtPixel(
        event.pixel,
        (feature) => feature
      );
      if (feature) {
        const properties = feature.get("properties");
        const isPremiumSpot = properties.score >= 4;
        // Only show popup if subscribed or not a premium spot
        if (isSubscribed || !isPremiumSpot) {
          setSelectedBeach(properties);
        }
      } else {
        setSelectedBeach(null);
      }
    });
  }, [beaches, windData, isSubscribed]);

  if (!windData) return <div>Loading...</div>;

  return (
    <div className="w-full min-h-[500px] h-full max-h-[500px] relative flex gap-6 rounded-lg">
      {/* Top Beaches Sidebar */}
      <div className="w-48 lg:w-56 bg-white overflow-y-auto border-r border-gray-200 z-20">
        <div className="p-4">
          <h3 className={cn("text-lg font-semibold mb-4", inter.className)}>
            Worth a look 🏄‍♂️
          </h3>
          <div className="space-y-2">
            {topBeaches.length > 0 ? (
              <>
                {topBeaches.map((beach) => (
                  <button
                    key={beach.name}
                    onClick={() => navigateToBeach(beach)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg",
                      "flex items-center gap-2",
                      "border border-gray-200",
                      selectedBeach?.name === beach.name ? "bg-gray-50" : "",
                      !isSubscribed
                        ? "opacity-75"
                        : "hover:bg-gray-50 transition-colors",
                      inter.className
                    )}
                  >
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-1">
                        {!isSubscribed && <span>🔒</span>}
                        {beach.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {beach.region}
                      </div>
                      {!isSubscribed && (
                        <div className="text-sm text-black mt-1">
                          {hasActiveTrial
                            ? "Subscribe to unlock"
                            : "Sign in to unlock"}
                        </div>
                      )}
                    </div>
                    <MapPin className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </>
            ) : (
              <p className="text-sm text-gray-500 p-3">
                Got nothing, adjust your filters.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="h-full w-full" />

        {/* Wind and Swell Compass */}
        {windData && (
          <div className="absolute top-4 right-4 scale-75 origin-top-right z-50">
            <WindCompass
              windDirection={degreesToCardinal(windData.windDirection)}
              windSpeed={windData.windSpeed}
              swellDirection={windData.swellDirection}
              swellHeight={windData.swellHeight}
            />
          </div>
        )}

        {/* Popup Overlay */}
        {selectedBeach && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-md z-20">
            <div className={cn("p-2", inter.className)}>
              <h3 className="font-semibold text-lg">{selectedBeach.name}</h3>
              <p className="text-sm text-gray-600">{selectedBeach.region}</p>
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  {getScoreDisplay(selectedBeach.score)?.emoji && (
                    <span>{getScoreDisplay(selectedBeach.score).emoji}</span>
                  )}
                  <span>{"⭐".repeat(selectedBeach.score)}</span>
                </div>
                <p>
                  Wave Height: {selectedBeach.swellSize.min}-
                  {selectedBeach.swellSize.max}m
                </p>
                <p>Wave Type: {selectedBeach.waveType}</p>
                <p>Difficulty: {selectedBeach.difficulty}</p>
              </div>
              <button
                onClick={() => setSelectedBeach(null)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
