"use client";

import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import { fromLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource, Cluster, XYZ } from "ol/source";
import { Style, Icon, Text, Fill, Stroke, Circle as CircleStyle } from "ol/style";
import Overlay from "ol/Overlay";

interface Beach {
  id: string;
  name: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  difficulty: string;
  rating?: number;
  region?: string;
  countryId: string;
  country: string;
  continentId: string;
  continent: string;
}

interface TideMapProps {
  beaches: Beach[];
  onBeachSelect: (beach: Beach) => void;
  onRegionSelect: (regionId: string) => void;
  selectedDayIndex?: number;
  center?: [number, number];
  zoom?: number;
}

export default function TideMap({ 
  beaches, 
  onBeachSelect, 
  onRegionSelect,
  selectedDayIndex = 0,
  center = [18.47, -34.10], 
  zoom = 10 
}: TideMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [popupBeach, setPopupBeach] = useState<Beach | null>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const popupRef = useRef<HTMLDivElement>(null);
  const selectedDayIndexRef = useRef(selectedDayIndex);
  const selectedDateStringRef = useRef("");

  useEffect(() => {
    selectedDayIndexRef.current = selectedDayIndex;
    
    // Calculate the date string for the selected index
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + selectedDayIndex);
    selectedDateStringRef.current = date.toISOString().split('T')[0];
  }, [selectedDayIndex]);

  const getBrandedColor = (r: number) => {
    if (r >= 4.5) return "#1d4ed8"; // blue-700 (Peak)
    if (r >= 3.8) return "#3b82f6"; // blue-500 (Excellent)
    if (r >= 3.0) return "#60a5fa"; // blue-400 (Target Brand Color)
    if (r >= 2.0) return "#93c5fd"; // blue-300 (Fair)
    return "#cbd5e1"; // gray-300 (Challenging/Quiet)
  };

  const [isMapReady, setIsMapReady] = useState(false);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const clusterSourceRef = useRef<Cluster<Feature> | null>(null);
  const prevBeachesCount = useRef(0);

  useEffect(() => {
    if (!mapElement.current) return;

    // Initialize Sources
    const vectorSource = new VectorSource();
    const clusterSource = new Cluster({
      distance: 25, 
      source: vectorSource,
    });
    vectorSourceRef.current = vectorSource;
    clusterSourceRef.current = clusterSource;

    // Initialize Map
    const initialMap = new Map({
      target: mapElement.current,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: 'https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            attributions: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
            crossOrigin: 'anonymous',
          }),
        }),
        new VectorLayer({
          source: clusterSource,
          style: (feature) => {
            const clusterFeatures = feature.get("features");
            const size = clusterFeatures.length;
            
            if (!clusterFeatures || size === 0) return;

            const representative = clusterFeatures[0];
            const type = representative.get("type");
            const manualLabel = representative.get("label");
            const manualCount = representative.get("count");

            const getRatingForBeach = (b: any) => {
              const dateKey = selectedDateStringRef.current;
              return b?.dailyScores?.[dateKey]?.rating ?? b?.rating ?? 3;
            };

            if (type === "continent" || type === "country") {
              const items = representative.get("allBeaches") || [];
              const ratings = items.map((b: any) => getRatingForBeach(b));
              const avgRating = ratings.length > 0 
                ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length 
                : 3;

              return new Style({
                image: new CircleStyle({
                  radius: type === "continent" ? 28 : 22,
                  stroke: new Stroke({ color: "#fff", width: 2.5 }),
                  fill: new Fill({ color: getBrandedColor(avgRating) }),
                }),
                text: new Text({
                  text: `${manualLabel}\n${manualCount}`,
                  fill: new Fill({ color: "#fff" }),
                  font: `bold ${type === "continent" ? '12px' : '10px'} Inter, sans-serif`,
                  textAlign: "center",
                  offsetY: 2,
                }),
              });
            }

            if (size > 1) {
              const ratings = clusterFeatures.map((f: any) => getRatingForBeach(f.get("beach")));
              const avgRating = ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length;

              return new Style({
                image: new CircleStyle({
                  radius: 12 + Math.min(size, 6),
                  stroke: new Stroke({ color: "#fff", width: 1.5 }),
                  fill: new Fill({ color: getBrandedColor(avgRating) }),
                }),
                text: new Text({
                  text: size.toString(),
                  fill: new Fill({ color: "#fff" }),
                  font: "bold 12px Inter, sans-serif",
                }),
              });
            }
            
            // Single Marker Style
            const beach = representative.get("beach");
            const dateKey = selectedDateStringRef.current;
            const rating = beach?.dailyScores?.[dateKey]?.rating ?? beach?.rating ?? 3;
            
            return new Style({
              image: new Icon({
                anchor: [0.5, 1],
                src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
                  <svg width="30" height="38" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 29C12 29 22 20 22 10C22 4.47715 17.5228 0 12 0C6.47715 0 2 4.47715 2 10C2 20 12 29 12 29Z" fill="${getBrandedColor(rating)}" stroke="white" stroke-width="1.5"/>
                    <circle cx="12" cy="10" r="7" fill="white"/>
                    <text x="12" y="13" font-family="Inter, sans-serif" font-size="9" font-weight="900" text-anchor="middle" fill="${getBrandedColor(rating)}">${Number(rating || 0).toFixed(0)}</text>
                  </svg>
                `)}`,
                scale: 0.8,
              }),
              text: new Text({
                text: beach?.name,
                offsetY: -35,
                font: "bold 11px Inter, sans-serif",
                fill: new Fill({ color: "#111827" }),
                stroke: new Stroke({ color: "#ffffff", width: 3 }),
              }),
            });
          },
        }),
      ],
      view: new View({
        center: fromLonLat([center[0], center[1]]),
        zoom: zoom,
      }),
      controls: [],
    });

    initialMap.getView().on("change:resolution", () => {
      const gZoom = initialMap.getView().getZoom();
      if (gZoom !== undefined) setCurrentZoom(gZoom);
    });

    const overlay = new Overlay({
      element: popupRef.current!,
      autoPan: true,
    });
    initialMap.addOverlay(overlay);

    mapRef.current = initialMap;
    setIsMapReady(true);

    initialMap.on("click", (evt) => {
      const feature = initialMap.forEachFeatureAtPixel(evt.pixel, (feat) => feat);
      if (feature) {
        const clusterFeatures = feature.get("features");
        if (!clusterFeatures) return;
        
        const representative = clusterFeatures[0];
        const type = representative.get("type");

        if (type === "continent" || type === "country") {
          const coords = (representative.getGeometry() as Point).getCoordinates();
          
          if (type === "country") {
            const countryId = representative.get("countryId") || representative.get("beach")?.countryId;
            if (countryId) onRegionSelect(countryId);
          }

          initialMap.getView().animate({
            center: coords,
            zoom: type === "continent" ? 5 : 8,
            duration: 600
          });
          return;
        }

        if (clusterFeatures.length > 1) {
          const extent = new VectorSource({ features: clusterFeatures }).getExtent();
          const firstCoord = (clusterFeatures[0].getGeometry() as Point).getCoordinates();
          const allSame = clusterFeatures.every((f: any) => {
            const coord = (f.getGeometry() as Point).getCoordinates();
            return coord[0] === firstCoord[0] && coord[1] === firstCoord[1];
          });

          if (allSame) {
            initialMap.getView().animate({
              center: firstCoord,
              zoom: initialMap.getView().getZoom()! + 2,
              duration: 500
            });
          } else {
            initialMap.getView().fit(extent, { 
              padding: [100, 100, 100, 100], 
              duration: 600,
              maxZoom: 16
            });
          }
        } else {
          const beach = representative.get("beach");
          setPopupBeach(beach);
          overlay.setPosition(evt.coordinate);
          onBeachSelect(beach);
        }
      } else {
        setPopupBeach(null);
        overlay.setPosition(undefined);
      }
    });

    // Detect visible region on pan/zoom
    let lastAutoRegion = "";
    initialMap.on("moveend", () => {
      const gZoom = initialMap.getView().getZoom();
      const center = initialMap.getView().getCenter();
      if (!center || !gZoom || gZoom < 4) return;

      const extent = initialMap.getView().calculateExtent(initialMap.getSize());
      const featuresInView = vectorSource.getFeaturesInExtent(extent);
      
      if (featuresInView.length > 0) {
        let closestFeature = null;
        let minDistance = Infinity;

        featuresInView.forEach(f => {
          const geom = f.getGeometry() as Point;
          const coord = geom.getCoordinates();
          const dx = coord[0] - center[0];
          const dy = coord[1] - center[1];
          const dist = dx*dx + dy*dy;
          if (dist < minDistance) {
            minDistance = dist;
            closestFeature = f;
          }
        });

        if (closestFeature) {
          const feature = closestFeature as Feature;
          const type = feature.get("type");
          let targetRegion = "";

          if (type === "country" || type === "continent") {
            targetRegion = feature.get("countryId") || feature.get("beach")?.countryId;
          } else if (type === "beach") {
            targetRegion = feature.get("beach")?.regionId || feature.get("beach")?.countryId;
          }

          if (targetRegion && targetRegion !== lastAutoRegion) {
            lastAutoRegion = targetRegion;
            onRegionSelect(targetRegion);
          }
        }
      }
    });

    initialMap.on("pointermove", (evt) => {
      const pixel = initialMap.getEventPixel(evt.originalEvent);
      const hit = initialMap.hasFeatureAtPixel(pixel);
      initialMap.getTargetElement().style.cursor = hit ? "pointer" : "";
    });

    return () => initialMap.setTarget(undefined);
  }, []);

  useEffect(() => {
    if (!mapRef.current || !vectorSourceRef.current) return;

    const vectorSource = vectorSourceRef.current;
    vectorSource.clear();

    if (!beaches || beaches.length === 0) return;

    let features: Feature[] = [];

    if (currentZoom < 4) {
      const continents: Record<string, Beach[]> = {};
      beaches.forEach(b => {
        const cId = b.continentId || "unknown";
        if (!continents[cId]) continents[cId] = [];
        continents[cId].push(b);
      });
      features = Object.entries(continents).map(([id, items]) => {
        const validItems = items.filter(b => b.coordinates && typeof b.coordinates.lat === 'number' && typeof b.coordinates.lng === 'number');
        if (validItems.length === 0) return null;
        const avgLat = validItems.reduce((sum, b) => sum + b.coordinates.lat, 0) / validItems.length;
        const avgLng = validItems.reduce((sum, b) => sum + b.coordinates.lng, 0) / validItems.length;
        const feature = new Feature({
          geometry: new Point(fromLonLat([avgLng, avgLat])),
        });
        feature.set("label", items[0].continent);
        feature.set("count", items.length);
        feature.set("beach", items[0]); 
        feature.set("allBeaches", items);
        feature.set("type", "continent");
        return feature;
      }).filter(Boolean);
    } else if (currentZoom < 7) {
      const countries: Record<string, Beach[]> = {};
      beaches.forEach(b => {
        const cId = b.countryId || "unknown";
        if (!countries[cId]) countries[cId] = [];
        countries[cId].push(b);
      });
      features = Object.entries(countries).map(([id, items]) => {
        const validItems = items.filter(b => b.coordinates && typeof b.coordinates.lat === 'number' && typeof b.coordinates.lng === 'number');
        if (validItems.length === 0) return null;
        const avgLat = validItems.reduce((sum, b) => sum + b.coordinates.lat, 0) / validItems.length;
        const avgLng = validItems.reduce((sum, b) => sum + b.coordinates.lng, 0) / validItems.length;
        const feature = new Feature({
          geometry: new Point(fromLonLat([avgLng, avgLat])),
        });
        feature.set("label", items[0].country);
        feature.set("count", items.length);
        feature.set("beach", items[0]);
        feature.set("allBeaches", items);
        feature.set("type", "country");
        return feature;
      }).filter(Boolean);
    } else {
      features = beaches
        .filter(beach => beach.coordinates && (beach.coordinates.lat !== 0 || beach.coordinates.lng !== 0))
        .map((beach, idx) => {
        // Add a tiny deterministic jitter to separate markers at the EXACT same point
        // Using a sunflower spiral layout based on index for neat separation at high zoom
        // Only impacts horizontal alignment at 0.00005 degrees (~5 meters offset)
        const angle = idx * 137.5 * (Math.PI / 180);
        const radius = 0.00005 * Math.sqrt(idx);
        
        const jLng = beach.coordinates.lng + (radius * Math.cos(angle));
        const jLat = beach.coordinates.lat + (radius * Math.sin(angle));

        const feature = new Feature({
          geometry: new Point(fromLonLat([jLng, jLat])),
        });
        feature.set("beach", beach);
        feature.set("type", "beach");
        return feature;
      });
    }

    if (features.length > 0) {
      vectorSource.addFeatures(features);
      if (beaches.length > prevBeachesCount.current) {
        const extent = vectorSource.getExtent();
        mapRef.current.getView().fit(extent, { padding: [100, 100, 100, 100], maxZoom: 12 });
      }
    }
    prevBeachesCount.current = beaches.length;
  }, [beaches, selectedDayIndex, currentZoom]);


  return (
    <div className="relative w-full h-full">
      <div ref={mapElement} className="w-full h-full" />
      
      {/* Popup Overlay */}
      <div ref={popupRef} className={`absolute bg-white rounded-xl shadow-2xl p-4 min-w-[200px] border border-gray-100 transition-opacity ${popupBeach ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {popupBeach && (
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Selected Break</span>
            <h4 className="text-sm font-bold text-gray-900 mb-1">{popupBeach.name}</h4>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i < (popupBeach.rating || 0) ? 'bg-amber-400' : 'bg-gray-200'}`} />
                ))}
              </div>
              <span className="text-[10px] text-gray-500 font-medium">{(popupBeach.rating || 0).toFixed(1)} Stars</span>
            </div>
            <button 
              onClick={() => (window.location.href = `/beaches/${popupBeach.id}`)}
              className="w-full py-2 bg-gray-900 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-gray-800 transition-colors"
            >
              Full Forecast →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
