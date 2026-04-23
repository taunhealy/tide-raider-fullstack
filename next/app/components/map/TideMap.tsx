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
import { cn } from "@/app/lib/utils";
import { Check, X, ChevronDown, ChevronUp, Wind, Waves, Clock, Info as InfoIcon, Cloud } from "lucide-react";
import { getConditionReasons } from "@/app/lib/surfUtils";
import { degreesToCardinal } from "@/app/lib/forecastUtils";

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
  regionId: string;
  region?: string;
  countryId: string;
  country: string;
  continentId: string;
  continent: string;
  optimalWindDirections: string[];
  optimalSwellDirections: { min: number; max: number };
  swellSize: { min: number; max: number };
  idealSwellPeriod: { min: number; max: number };
  dailyScores?: Record<string, any>;
}

interface TideMapProps {
  beaches: Beach[];
  onBeachSelect: (beach: Beach) => void;
  onRegionSelect: (regionId: string) => void;
  onAIReportClick: (beach: Beach) => void;
  selectedDayIndex?: number;
  center?: [number, number];
  zoom?: number;
  showWindHeatmap?: boolean;
  showSwellHeatmap?: boolean;
  variant?: "hero" | "default";
}

export default function TideMap({ 
  beaches, 
  onBeachSelect, 
  onRegionSelect,
  onAIReportClick,
  selectedDayIndex = 0,
  center = [18.4233, -33.9249], 
  zoom = 12,
  showWindHeatmap = false,
  showSwellHeatmap = false
}: TideMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [popupBeach, setPopupBeach] = useState<any | null>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [showConditions, setShowConditions] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const selectedDayIndexRef = useRef(selectedDayIndex);
  const selectedDateStringRef = useRef("");
  const beachesRef = useRef(beaches);

  // Particle System State
  const windParticles = useRef<any[]>([]);
  const swellParticles = useRef<any[]>([]);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    beachesRef.current = beaches;
  }, [beaches]);

  useEffect(() => {
    selectedDayIndexRef.current = selectedDayIndex;
    
    // Calculate the date string for the selected index
    const date = new Date();
    date.setUTCDate(new Date().getUTCDate() + selectedDayIndex);
    selectedDateStringRef.current = date.toISOString().split('T')[0];
    
    console.log(`[TideMap] 📅 Day changed to index ${selectedDayIndex}, key: ${selectedDateStringRef.current}`);
  }, [selectedDayIndex]);

  // Dynamic Center/Zoom Update
  const prevCenterRef = useRef<[number, number]>(center);
  const prevZoomRef = useRef<number>(zoom);

  useEffect(() => {
    if (!mapRef.current) return;
    
    // Only animate if values have actually changed (prevent array identity triggers)
    const centerChanged = center[0] !== prevCenterRef.current[0] || center[1] !== prevCenterRef.current[1];
    const zoomChanged = zoom !== prevZoomRef.current;
    
    if (centerChanged || zoomChanged) {
      const view = mapRef.current.getView();
      view.animate({
        center: fromLonLat(center),
        zoom: zoom,
        duration: 800
      });
      prevCenterRef.current = center;
      prevZoomRef.current = zoom;
    }
  }, [center, zoom]);

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

  // Initialize Particles (Separate for Wind and Swell)
  useEffect(() => {
    const createParticles = (count: number) => {
      const p = [];
      for (let i = 0; i < count; i++) {
        p.push({
          x: Math.random(),
          y: Math.random(),
          vx: 0,
          vy: 0,
          life: Math.random(),
          size: Math.random() * 2 + 1
        });
      }
      return p;
    };

    if (showWindHeatmap && windParticles.current.length === 0) {
      windParticles.current = createParticles(800);
    } else if (!showWindHeatmap) {
      windParticles.current = [];
    }

    if (showSwellHeatmap && swellParticles.current.length === 0) {
      swellParticles.current = createParticles(600);
    } else if (!showSwellHeatmap) {
      swellParticles.current = [];
    }
  }, [showWindHeatmap, showSwellHeatmap]);

  // Animation Loop
  useEffect(() => {
    if (!showWindHeatmap && !showSwellHeatmap) return;
    if (!canvasRef.current || !mapRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const canvas = canvasRef.current;
      const map = mapRef.current;
      if (!canvas || !map || !ctx) return;

      // Update canvas size
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { width, height } = canvas;
      const dateKey = selectedDateStringRef.current;
      const currentBeaches = beachesRef.current;

      // Draw Wind Particles
      if (showWindHeatmap) {
        const validWind = currentBeaches.filter(b => (b as any).dailyScores?.[dateKey]?.conditions?.windSpeed !== undefined);
        
        let avgSpeed = 0;
        let avgVX = 0;
        let avgVY = 0;

        if (validWind.length > 0) {
          avgSpeed = validWind.reduce((acc, b: any) => acc + b.dailyScores[dateKey].conditions.windSpeed, 0) / validWind.length;
          
          // Calculate average direction vector (Meteorological: FROM direction, so we move AWAY)
          let sumVX = 0;
          let sumVY = 0;
          validWind.forEach((b: any) => {
            const deg = b.dailyScores[dateKey].conditions.windDirection || 0;
            const rad = (deg * Math.PI) / 180;
            // Movement is AWAY from the bearing
            sumVX += -Math.sin(rad); 
            sumVY += Math.cos(rad);
          });
          
          // Normalize the direction first, then scale for consistent speed
          const mag = Math.sqrt(sumVX * sumVX + sumVY * sumVY) || 1;
          avgVX = (sumVX / mag) * 0.0006;
          avgVY = (sumVY / mag) * 0.0006;
        }

        // Only draw if we have speed
        if (avgSpeed > 0) {
          // Calculate perpendicular vector for wiggling once per frame
          const vMag = Math.sqrt(avgVX * avgVX + avgVY * avgVY) || 1;
          const perpX = (-avgVY / vMag);
          const perpY = (avgVX / vMag);

          const time = Date.now() * 0.003;
          windParticles.current.forEach((p, i) => {
            p.life -= 0.005;
            if (p.life <= 0) { 
              // Spawn on the windward edge instead of randomly
              const edge = Math.random();
              if (Math.abs(avgVX) > Math.abs(avgVY)) {
                p.x = avgVX > 0 ? 0 : 1;
                p.y = edge;
              } else {
                p.x = edge;
                p.y = avgVY > 0 ? 0 : 1;
              }
              p.life = 1.0; 
            }
            
            const speedMod = (avgSpeed / 10 + 0.3);
            
            // Move particle in a straightish direction
            p.x += avgVX * speedMod;
            p.y += avgVY * speedMod;
            
            // Loop around edges
            if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0; if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;

            // Draw a wiggly path instead of a straight segment
            const segmentCount = 10;
            const tailScale = 150; // Total length of the tail
            
            ctx.beginPath();
            ctx.strokeStyle = `rgba(96, 165, 250, ${p.life * 0.45})`; 
            ctx.lineWidth = Math.min(Math.max(1.0, avgSpeed / 8), 2.5);
            ctx.lineCap = "round";
            ctx.moveTo(p.x * width, p.y * height);
            
            for (let j = 1; j <= segmentCount; j++) {
              const t = j / segmentCount;
              // The segment follows the base velocity backwards
              const posX = p.x - (avgVX * speedMod) * t * tailScale;
              const posY = p.y - (avgVY * speedMod) * t * tailScale;
              
              // Apply a wiggle offset at each point along the tail
              const segmentWiggle = (
                Math.sin(time + i * 0.5 - t * 6) * 0.0012 +
                Math.sin(time * 0.5 + i * 0.2 - t * 3) * 0.0006
              );
              
              const wx = posX + (perpX * segmentWiggle);
              const wy = posY + (perpY * segmentWiggle);
              
              ctx.lineTo(wx * width, wy * height);
            }
            ctx.stroke();
          });
        }
      }

      // Draw Swell Particles (TINY SLOW PIPS)
      if (showSwellHeatmap) {
        const validSwell = currentBeaches.filter(b => (b as any).dailyScores?.[dateKey]?.conditions?.swellHeight !== undefined);
        
        let avgHeight = 2.0;
        let avgVX = 0.0003;
        let avgVY = -0.0001;

        if (validSwell.length > 0) {
          avgHeight = validSwell.reduce((acc, b: any) => acc + b.dailyScores[dateKey].conditions.swellHeight, 0) / validSwell.length;
          
          // Calculate average direction vector (Coming FROM angle rad, move AWAY from it)
          let sumVX = 0;
          let sumVY = 0;
          validSwell.forEach((b: any) => {
            const deg = b.dailyScores[dateKey].conditions.swellDirection || 0;
            const rad = (deg * Math.PI) / 180;
            sumVX += -Math.sin(rad);
            sumVY += Math.cos(rad);
          });
          const mag = Math.sqrt(sumVX * sumVX + sumVY * sumVY) || 1;
          avgVX = (sumVX / mag) * 0.00025;
          avgVY = (sumVY / mag) * 0.00025;
        }

        swellParticles.current.forEach(p => {
          p.life -= 0.003;
          if (p.life <= 0) { 
            p.x = Math.random(); p.y = Math.random();
            p.life = 1.0; 
          }
          
          const speedMod = (avgHeight / 2 + 0.3);
          p.vx = avgVX * speedMod; 
          p.vy = avgVY * speedMod;
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0; if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;

          ctx.beginPath();
          ctx.strokeStyle = `rgba(129, 140, 248, ${p.life * 0.4})`; // Indigo-400
          ctx.lineWidth = 2.5;
          ctx.moveTo(p.x * width, p.y * height);
          // Unified tail multiplier to prevent directional skewing
          ctx.lineTo((p.x - p.vx * 40) * width, (p.y - p.vy * 40) * height);
          ctx.stroke();
        });
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [showWindHeatmap, showSwellHeatmap, isMapReady]);

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
                  stroke: new Stroke({ color: "#fff", width: 2 }),
                  fill: new Fill({ color: getBrandedColor(avgRating) }),
                }),
                text: new Text({
                  text: `${manualLabel}\n${manualCount}`,
                  fill: new Fill({ color: "#fff" }),
                  font: `900 ${type === "continent" ? '11px' : '9px'} Inter, sans-serif`,
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
                  font: "900 11px Inter, sans-serif",
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
                    <path d="M12 29C12 29 22 20 22 10C22 4.47715 17.5228 0 12 0C6.47715 0 2 4.47715 2 10C2 20 12 29 12 29Z" fill="${getBrandedColor(rating)}" stroke="white" stroke-width="1"/>
                    <circle cx="12" cy="10" r="7" fill="white"/>
                    <text x="12" y="13" font-family="Inter, sans-serif" font-size="9" font-weight="900" text-anchor="middle" fill="${getBrandedColor(rating)}">${Number(rating || 0).toFixed(0)}</text>
                  </svg>
                `)}`,
                scale: 0.75,
              }),
              text: new Text({
                text: beach?.name,
                offsetY: -32,
                font: "900 10px Inter, sans-serif",
                fill: new Fill({ color: "#fff" }),
                stroke: new Stroke({ color: "rgba(0,0,0,0.5)", width: 2 }),
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
        setShowConditions(false);
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
      }).filter(Boolean) as Feature[];
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
      }).filter(Boolean) as Feature[];
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
      
      // Only auto-fit on first load if we don't have a manual center override, 
      // or if we're specifically looking at a region view (zoom 4-7).
      // For general app load (zoom 10), we respect the Cape Town default center.
      if (beaches.length > prevBeachesCount.current && currentZoom < 8) {
        const extent = vectorSource.getExtent();
        mapRef.current.getView().fit(extent, { padding: [100, 100, 100, 100], maxZoom: 12 });
      }
    }
    prevBeachesCount.current = beaches.length;
  }, [beaches, selectedDayIndex, currentZoom]);

  return (
    <div className="relative w-full h-full group overflow-hidden">
      <div ref={mapElement} className="w-full h-full" />
      
      {/* Particle Canvas */}
      <canvas 
        ref={canvasRef}
        className={cn(
          "absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-1000 mix-blend-screen z-[8]",
          (showWindHeatmap || showSwellHeatmap) ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Popup Overlay */}
      <div ref={popupRef} className={cn(
        "absolute bg-brand-dark rounded-xl md:rounded-2xl p-4 md:p-5 min-w-[180px] md:min-w-[220px] transition-all duration-300 shadow-2xl border border-white/10 ring-1 ring-white/5",
        popupBeach ? "opacity-100 translate-y-0 scale-90 md:scale-100" : "opacity-0 translate-y-4 scale-75 md:scale-95 pointer-events-none"
      )}>
        {popupBeach && (() => {
          const dateKey = selectedDateStringRef.current;
          const beachData = popupBeach;
          const conditions = beachData.dailyScores?.[dateKey]?.conditions || null;
          const rating = beachData.dailyScores?.[dateKey]?.rating ?? beachData.rating ?? 0;
          
          const conditionReasons = conditions ? getConditionReasons(beachData, conditions) : null;
          
          return (
            <div className="relative">
              <span className="text-[9px] font-bold text-[var(--color-tertiary)] tracking-[0.2em] mb-2 block">
                Beach Profile
              </span>
              <h4 className="text-[15px] font-bold text-white tracking-tight mb-2 leading-none">
                {popupBeach.name}
              </h4>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < rating ? 'bg-[var(--color-tertiary)]' : 'bg-white/10'}`} />
                  ))}
                </div>
                <span className="text-[9px] text-gray-500 font-bold tracking-widest">
                  {Number(rating).toFixed(1)} Rating
                </span>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => setShowConditions(!showConditions)}
                  className="w-full py-2.5 bg-white/5 border border-white/10 text-white text-[9px] font-bold tracking-widest rounded-xl hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                >
                  View conditions
                  {showConditions ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                </button>

                {showConditions && (
                  <div className="mt-4 p-3 bg-black/40 rounded-xl border border-white/5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    {conditionReasons ? (
                      <div className="space-y-2">
                        {conditionReasons.optimalConditions.map((cond: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 group">
                            {cond.isMet ? (
                              <Check className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <X className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                            )}
                            <span className="text-[9px] font-bold text-white/70 leading-tight group-hover:text-white transition-colors">
                              {cond.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[9px] text-white/30 font-bold text-center py-2 italic uppercase tracking-widest">
                        No condition data
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => (window.location.href = `/beaches/${popupBeach.id}`)}
                        className="py-2.5 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-1 group"
                      >
                        Details
                        <ChevronDown className="w-2 h-2 rotate-[-90deg] group-hover:translate-x-0.5 transition-transform" />
                      </button>
                      <button 
                        onClick={() => onAIReportClick(popupBeach)}
                        className="py-2.5 bg-brand-3 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-brand-3/20 transition-all flex items-center justify-center gap-1.5"
                      >
                        AI Report
                        <Cloud className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
