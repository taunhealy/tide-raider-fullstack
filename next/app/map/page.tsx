"use client";

import React, { useState, useEffect, useMemo } from "react";
import TideMap, { Beach } from "@/app/components/map/TideMap";
import { Search, Filter, Star, Info, List, Map as MapIcon, ChevronRight, Waves, Cloud, Loader2, X, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LoggersButton, FoilingButton, HiddenGemsButton } from "@/app/components/ui/GradientButton";
import { cn } from "@/app/lib/utils";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";
import WeatherForecastWidget from "@/app/components/sidebar/WeatherForecastWidget";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import Link from "next/link";

import AIReportModal from "@/app/components/beach/AIReportModal";


export default function GlobalMapPage() {
  const { filters, updateFilter } = useBeachFilters();
  const { data: authData } = useBackendAuth();
  const user = authData?.user;
  const isGateEnabled = process.env.NEXT_PUBLIC_GATE !== 'false';
  const isSubscribed = !isGateEnabled || (user?.isSubscribed || user?.hasActiveTrial || false);

  const [beaches, setBeaches] = useState<Beach[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase1Complete, setPhase1Complete] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"map" | "grid">("map");
  
  // Use selectedDayIndex but also sync it with filter
  // Derived day index from URL filter
  // const [selectedDayIndex, setSelectedDayIndex] = useState(0); // Removed in favor of useMemo below
  const [showWindHeatmap, setShowWindHeatmap] = useState(true);
  const [showSwellHeatmap, setShowSwellHeatmap] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Map Navigation State
  const [mapCenter, setMapCenter] = useState<[number, number]>([18.4233, -33.9249]);
  const [mapZoom, setMapZoom] = useState(12);

  // AI Report Modal State
  const [reportBeach, setReportBeach] = useState<any | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Source selection state (shared with WeatherForecastWidget)
  const [selectedSource, setSelectedSource] = useState<string>("WINDFINDER");

  // Track which beaches have full scores loaded
  const [beachesWithScores, setBeachesWithScores] = useState<Set<string>>(new Set());

  const fetchDetailedScores = async (ids: string[]) => {
    // Filter out IDs that already have scores
    const missingIds = ids.filter(id => !beachesWithScores.has(id));
    if (missingIds.length === 0) return;

    // Limit to 40 beaches per request to keep it fast
    const batch = missingIds.slice(0, 40);

    try {
      const sourceParam = selectedSource ? `&source=${selectedSource}` : "";
      const timeSlotParam = filters.timeSlot ? `&timeSlot=${filters.timeSlot}` : "&timeSlot=MORNING";
      
      const res = await fetch(`/api/map-data?ids=${batch.join(',')}${sourceParam}${timeSlotParam}`);
      if (res.ok) {
        const data = await res.json();
        if (data.beaches) {
          setBeaches(prev => {
            const newBeaches = [...prev];
            data.beaches.forEach((detailedBeach: Beach) => {
              const idx = newBeaches.findIndex(b => b?.id === detailedBeach.id);
              if (idx !== -1) {
                // Merge detailed data into existing marker data
                newBeaches[idx] = { ...newBeaches[idx], ...detailedBeach };
              }
            });
            return newBeaches;
          });
          setBeachesWithScores(prev => {
            const next = new Set(prev);
            batch.forEach(id => next.add(id));
            return next;
          });
        }
      }
    } catch (error) {
      console.error("[GlobalMap] Background sync failed:", error);
    }
  };

  const [lastMoveTime, setLastMoveTime] = useState(0);
  const moveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMapMove = (visibleIds: string[]) => {
    if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
    
    moveTimeoutRef.current = setTimeout(() => {
      fetchDetailedScores(visibleIds);
    }, 500); // 500ms debounce
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("forecastSource");
      if (stored) setSelectedSource(stored);
    }

    const handleSourceChange = (e: any) => {
      setSelectedSource(e.detail);
    };

    window.addEventListener("forecastSourceChanged", handleSourceChange as any);
    return () => window.removeEventListener("forecastSourceChanged", handleSourceChange as any);
  }, []);

  useEffect(() => {
    setMounted(true);
    const savedWind = localStorage.getItem("showWindHeatmap");
    const savedSwell = localStorage.getItem("showSwellHeatmap");
    if (savedWind !== null) setShowWindHeatmap(savedWind === "true");
    if (savedSwell !== null) setShowSwellHeatmap(savedSwell === "true");
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("showWindHeatmap", String(showWindHeatmap));
      localStorage.setItem("showSwellHeatmap", String(showSwellHeatmap));
    }
  }, [showWindHeatmap, showSwellHeatmap, mounted]);
  
  const isLoggersOnly = filters.isLongboarding || false;
  const isFoilingOnly = filters.isFoiling || false;
  const isHiddenGemsOnly = filters.isHiddenGem || false;

  const setIsLoggersOnly = (val: boolean) => updateFilter("isLongboarding", val ? "true" : "");
  const setIsFoilingOnly = (val: boolean) => updateFilter("isFoiling", val ? "true" : "");
  const setIsHiddenGemsOnly = (val: boolean) => updateFilter("isHiddenGem", val ? "true" : "");

  // Derive selectedDayIndex from URL filter
  const selectedDayIndex = useMemo(() => {
    if (!filters.forecastDate) return 0;
    
    const targetDate = new Date(filters.forecastDate);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0 && diffDays <= 6) return diffDays;
    return 0;
  }, [filters.forecastDate]);

  const weekDays = useMemo(() => {
    const days = [];
    const baselineDate = new Date();
    baselineDate.setUTCHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(baselineDate);
        d.setUTCDate(baselineDate.getUTCDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        
        const scoreCount = beaches.filter(Boolean).reduce((acc, b: any) => {
          const rating = b.dailyScores?.[dateStr]?.rating ?? b.rating;
          return rating >= 3 ? acc + 1 : acc;
        }, 0);

      days.push({
        label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        index: i,
        dateStr,
        scoreCount
      });
    }
    return days;
  }, [beaches]);

  const selectedDateString = useMemo(() => {
    return weekDays[selectedDayIndex]?.dateStr || new Date().toISOString().split('T')[0];
  }, [selectedDayIndex, weekDays]);

  const handleDaySelect = (index: number) => {
    const dateStr = weekDays[index]?.dateStr;
    if (dateStr) {
      updateFilter("forecastDate", dateStr);
    }
  };

  useEffect(() => {
    async function fetchPhase1() {
      setPhase1Complete(false);
      setLoading(true);
      try {
        const sourceParam = selectedSource ? `&source=${selectedSource}` : "";
        const timeSlotParam = filters.timeSlot ? `&timeSlot=${filters.timeSlot}` : "&timeSlot=MORNING";
        const phase1RegionParam = filters.regionId ? `&regionId=${filters.regionId}` : "";
        
        const superLiteRes = await fetch(`/api/map-data?superlite=true${sourceParam}${timeSlotParam}${phase1RegionParam}`);
        if (superLiteRes.ok) {
          const superLiteData = await superLiteRes.json();
          if (superLiteData.beaches) {
            setBeaches(superLiteData.beaches);
            setLoading(false); // Map becomes interactive NOW
            setPhase1Complete(true);
          }
        }
      } catch (error) {
        console.error("Error fetching map data (phase 1):", error);
        setLoading(false);
      }
    }
    
    // Clear score cache when source or slot changes
    setBeachesWithScores(new Set());
    fetchPhase1();
  }, [selectedSource, filters.timeSlot, filters.regionId]);

  useEffect(() => {
    if (!phase1Complete) return;

    async function fetchPhase2() {
      try {
        const sourceParam = selectedSource ? `&source=${selectedSource}` : "";
        const timeSlotParam = filters.timeSlot ? `&timeSlot=${filters.timeSlot}` : "&timeSlot=MORNING";
        const phase2RegionParam = filters.regionId ? `&regionId=${filters.regionId}` : "&regionId=western-cape";
        const dateParam = `&date=${selectedDateString}`;
        
        const liteRes = await fetch(`/api/map-data?lite=true${sourceParam}${timeSlotParam}${phase2RegionParam}${dateParam}`);
        if (liteRes.ok) {
          const liteData = await liteRes.json();
          if (liteData.beaches) {
            setBeaches(prev => {
              const updated = [...prev];
              liteData.beaches.forEach((lb: Beach) => {
                const idx = updated.findIndex(b => b.id === lb.id);
                if (idx !== -1) {
                  // Merge while prioritizing existing detailed data, but keep old dates in dailyScores
                  updated[idx] = { 
                    ...updated[idx], 
                    ...lb,
                    dailyScores: {
                      ...(updated[idx] as any).dailyScores,
                      ...lb.dailyScores
                    }
                  };
                } else {
                  updated.push(lb);
                }
              });
              return updated;
            });
          }
        }
      } catch (error) {
        console.error("Error fetching map data (phase 2):", error);
      }
    }

    fetchPhase2();
  }, [selectedSource, filters.timeSlot, filters.regionId, selectedDateString, phase1Complete]);

  const filteredBeaches = useMemo(() => {
    return beaches.filter(Boolean).filter(beach => {
      // Respect both search query and regionId filter
      const matchesSearch = !searchQuery || 
                           beach.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           beach.region.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRegion = !filters.regionId || 
                           beach.regionId?.toLowerCase() === filters.regionId.toLowerCase() ||
                           beach.region?.toLowerCase() === filters.regionId.toLowerCase().replace(/-/g, " ");

      const matchesDifficulty = selectedDifficulty.length === 0 || selectedDifficulty.includes(beach.difficulty);
      
      const currentRating = (beach as any).dailyScores?.[selectedDateString]?.rating ?? beach.rating;
      const matchesRating = currentRating >= minRating;
      
      const isLogger = (beach as any).isLongboarding || false;
      const isFoiler = (beach as any).isFoiling || false;
      const isGem = (beach as any).isHiddenGem || false;

      const matchesLoggers = !isLoggersOnly || isLogger;
      const matchesFoiling = !isFoilingOnly || isFoiler;
      const matchesHiddenGems = !isHiddenGemsOnly || isGem;
      
      return matchesSearch && matchesRegion && matchesDifficulty && matchesRating && matchesLoggers && matchesFoiling && matchesHiddenGems;
    });
  }, [beaches, searchQuery, filters.regionId, selectedDifficulty, minRating, selectedDateString, isLoggersOnly, isFoilingOnly, isHiddenGemsOnly]);

  const toggleDifficulty = (d: string) => {
    setSelectedDifficulty(prev => 
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-72px)] md:h-[calc(100vh-80px)] bg-white md:bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-900 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg">
            <MapIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">Global Intel</h1>
            <p className="hidden md:block text-[10px] text-gray-400 font-bold uppercase tracking-widest">Live Conditions & Rating Map</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg md:rounded-xl">
            <button 
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold transition-all ${viewMode === "map" ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <MapIcon className="w-3.5 h-3.5 md:w-4 md:h-4" /> Map
            </button>
            <button 
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold transition-all ${viewMode === "grid" ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-3.5 h-3.5 md:w-4 md:h-4" /> List
            </button>
          </div>
          
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden flex items-center justify-center w-9 h-9 bg-gray-900 text-white rounded-lg shadow-md active:scale-95 transition-all"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 relative overflow-hidden">
        {/* Sidebar Filters */}
        <aside className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto z-20 hidden md:block">
          <div className="space-y-8">
            {/* Search */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Search Spots</label>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onFocus={() => {
                    // Logic to show suggestions if needed
                  }}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter beach or region..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                />
                
                {/* Search Suggestions */}
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100] opacity-0 group-focus-within:opacity-100 pointer-events-none group-focus-within:pointer-events-auto transition-all duration-300 translate-y-2 group-focus-within:translate-y-0">
                  <div className="p-4 space-y-4">
                    {/* Beach Results Suggestion (New) */}
                    {searchQuery.length >= 2 && (
                      <div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Matches Found</span>
                        <div className="flex flex-col gap-1">
                          {beaches
                            .filter(Boolean)
                            .filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .slice(0, 5)
                            .map(beach => (
                              <button 
                                key={beach.id}
                                onClick={() => {
                                  setSearchQuery(beach.name);
                                  setMapCenter([beach.coordinates.lng, beach.coordinates.lat]);
                                  setMapZoom(14);
                                }}
                                className="flex items-center justify-between px-3 py-2.5 hover:bg-blue-50 rounded-xl text-[12px] font-bold text-gray-700 transition-all group/item"
                              >
                                <div className="flex flex-col">
                                  <span>{beach.name}</span>
                                  <span className="text-[9px] text-gray-400 uppercase tracking-tighter">{beach.region}</span>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover/item:text-blue-500 transition-colors" />
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Popular Regions</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {["Western Cape", "Eastern Cape", "KwaZulu-Natal"].map(region => (
                          <button 
                            key={region}
                            onClick={() => {
                              setSearchQuery(region);
                              updateFilter("regionId", region.toLowerCase().replace(/\s+/g, "-"));
                            }}
                            className="text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-[11px] font-bold text-gray-600 transition-all"
                          >
                            {region}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Tactical Categories</span>
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => { setIsHiddenGemsOnly(true); setSearchQuery(""); }}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-rose-50 rounded-lg text-[11px] font-bold text-gray-600 group/btn transition-all"
                        >
                          <div className="w-5 h-5 bg-rose-100 text-rose-600 rounded flex items-center justify-center group-hover/btn:bg-rose-600 group-hover/btn:text-white transition-colors">💎</div>
                          Hidden Gems
                        </button>
                        <button 
                          onClick={() => { setIsLoggersOnly(true); setSearchQuery(""); }}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-amber-50 rounded-lg text-[11px] font-bold text-gray-600 group/btn transition-all"
                        >
                          <div className="w-5 h-5 bg-amber-100 text-amber-600 rounded flex items-center justify-center group-hover/btn:bg-amber-600 group-hover/btn:text-white transition-colors">🏄</div>
                          Longboarding Only
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Badges */}
              {(searchQuery || minRating > 0 || selectedDifficulty.length > 0 || isLoggersOnly || isFoilingOnly || isHiddenGemsOnly) && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {searchQuery && (
                    <button 
                      onClick={() => {
                        setSearchQuery("");
                        updateFilter("regionId", "");
                      }} 
                      className="flex items-center gap-1.5 px-2 py-1 bg-gray-900 text-white text-[9px] font-black uppercase tracking-tighter rounded-md hover:bg-gray-800 transition-all"
                    >
                      {searchQuery} <X className="w-2 h-2" />
                    </button>
                  )}
                  {minRating > 0 && (
                    <button onClick={() => setMinRating(0)} className="flex items-center gap-1.5 px-2 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-tighter rounded-md hover:bg-blue-500 transition-all">
                      {minRating}+ Stars <X className="w-2 h-2" />
                    </button>
                  )}
                  {selectedDifficulty.map(d => (
                    <button key={d} onClick={() => toggleDifficulty(d)} className="flex items-center gap-1.5 px-2 py-1 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-tighter rounded-md hover:bg-emerald-500 transition-all">
                      {d} <X className="w-2 h-2" />
                    </button>
                  ))}
                  {isLoggersOnly && (
                    <button onClick={() => setIsLoggersOnly(false)} className="flex items-center gap-1.5 px-2 py-1 bg-amber-600 text-white text-[9px] font-black uppercase tracking-tighter rounded-md hover:bg-amber-500 transition-all">
                      Loggers <X className="w-2 h-2" />
                    </button>
                  )}
                  {isFoilingOnly && (
                    <button onClick={() => setIsFoilingOnly(false)} className="flex items-center gap-1.5 px-2 py-1 bg-purple-600 text-white text-[9px] font-black uppercase tracking-tighter rounded-md hover:bg-purple-500 transition-all">
                      Foiling <X className="w-2 h-2" />
                    </button>
                  )}
                  {isHiddenGemsOnly && (
                    <button onClick={() => setIsHiddenGemsOnly(false)} className="flex items-center gap-1.5 px-2 py-1 bg-rose-600 text-white text-[9px] font-black uppercase tracking-tighter rounded-md hover:bg-rose-500 transition-all">
                      Gems <X className="w-2 h-2" />
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setSearchQuery("");
                      updateFilter("regionId", "");
                      setMinRating(0);
                      setSelectedDifficulty([]);
                      setIsLoggersOnly(false);
                      setIsFoilingOnly(false);
                      setIsHiddenGemsOnly(false);
                    }}
                    className="text-[9px] font-black text-gray-400 uppercase tracking-tighter hover:text-gray-900 transition-all underline decoration-gray-200 underline-offset-4"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Rating Filter */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Condition Filter</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(r => (
                  <button 
                    key={r}
                    onClick={() => setMinRating(prev => prev === r ? 0 : r)}
                    className={`flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all ${minRating === r ? 'border-gray-900 bg-gray-900 text-white shadow-lg scale-105' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}
                  >
                    <span className="text-sm font-bold">{r}+</span>
                  </button>
                ))}
              </div>
              
              {/* Star Legend */}
              <div className="p-4 bg-gray-50 rounded-2xl space-y-3 border border-gray-100">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2">Condition Legend</span>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#1d4ed8] shadow-[0_0_8px_rgba(29,78,216,0.2)]" />
                  <span className="text-[11px] font-bold text-gray-600">Peak Performance (5.0)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.2)]" />
                  <span className="text-[11px] font-bold text-gray-600">Excellent (4.0+)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#60a5fa] shadow-[0_0_8px_rgba(96,165,250,0.2)]" />
                  <span className="text-[11px] font-bold text-gray-600">Good / Solid (3.0+)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#93c5fd] shadow-[0_0_8px_rgba(147,197,253,0.2)]" />
                  <span className="text-[11px] font-bold text-gray-600">Fair / Small (2.0+)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#cbd5e1] shadow-[0_0_8px_rgba(203,213,225,0.2)]" />
                  <span className="text-[11px] font-bold text-gray-600">Quiet / Lead (1.0+)</span>
                </div>
              </div>
            </div>

            {/* Hidden Gems Gated Filter */}
            <div className="p-4 bg-white rounded-2xl border-2 border-gray-100 space-y-3 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">Exclusive Spots</label>
                {!isSubscribed && (
                   <span className="flex items-center gap-1 text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-widest border border-amber-100">
                     <Lock className="w-2.5 h-2.5" />
                     Premium
                   </span>
                )}
              </div>
              
              <div className="flex flex-col gap-3">
                <HiddenGemsButton
                  active={isHiddenGemsOnly && isSubscribed}
                  size="sm"
                  disabled={!isSubscribed}
                  onClick={() => setIsHiddenGemsOnly(!isHiddenGemsOnly)}
                  className={cn(
                    "w-full justify-between h-12 px-4",
                    !isSubscribed && "opacity-50 grayscale pointer-events-none"
                  )}
                >
                  <span className="text-[11px]">Reveal Hidden Gems</span>
                  {!isSubscribed && <Lock className="w-3 h-3" />}
                </HiddenGemsButton>

                {!isSubscribed && (
                  <div className="pt-2 border-t border-gray-50">
                    <p className="text-[10px] text-gray-400 font-medium leading-relaxed mb-3">
                      Unlock 150+ crowd-free "Hidden Gems" only visible to Intelligence subscribers.
                    </p>
                    <Link 
                      href="/pricing" 
                      className="inline-flex items-center gap-1.5 text-[9px] font-black text-brand-3 uppercase tracking-widest hover:underline group/cta"
                    >
                      Subscribe to unlock
                      <ChevronRight className="w-2.5 h-2.5 group-hover/cta:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Experience Level</label>
              <div className="space-y-2">
                {["BEGINNER", "INTERMEDIATE", "ADVANCED"].map(d => (
                  <button 
                    key={d}
                    onClick={() => toggleDifficulty(d)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${selectedDifficulty.includes(d) ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                  >
                    <span className="text-xs font-bold text-gray-900">{d}</span>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedDifficulty.includes(d) ? 'bg-blue-600 border-blue-600' : 'border-gray-200'}`}>
                      {selectedDifficulty.includes(d) && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Specialty Filters */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Tactical Overlays</label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setShowWindHeatmap(!showWindHeatmap)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-500",
                    showWindHeatmap 
                      ? "bg-blue-950 border-brand-3 shadow-[0_0_15px_rgba(96,165,250,0.3)]" 
                      : "bg-white border-gray-100 hover:border-gray-200"
                  )}
                >
                  <Cloud className={cn("w-5 h-5 mb-1", showWindHeatmap ? "text-brand-3" : "text-gray-400")} />
                  <span className={cn("text-[9px] font-black uppercase tracking-widest", showWindHeatmap ? "text-brand-3" : "text-gray-500")}>Wind Bloc</span>
                </button>
                <button
                  onClick={() => setShowSwellHeatmap(!showSwellHeatmap)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-500",
                    showSwellHeatmap 
                      ? "bg-indigo-950 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]" 
                      : "bg-white border-gray-100 hover:border-gray-200"
                  )}
                >
                  <Waves className={cn("w-5 h-5 mb-1", showSwellHeatmap ? "text-indigo-400" : "text-gray-400")} />
                  <span className={cn("text-[9px] font-black uppercase tracking-widest", showSwellHeatmap ? "text-indigo-400" : "text-gray-500")}>Swell Surge</span>
                </button>
              </div>
            </div>
            <div className="p-4 bg-gray-900 rounded-2xl text-white shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Map Intel</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Showing <span className="text-blue-400 font-bold">{filteredBeaches.length}</span> world-class breaks meeting your criteria for <span className="text-white font-bold">{selectedDayIndex === 0 ? "Today" : selectedDayIndex === 1 ? "Tomorrow" : `${selectedDayIndex} days out`}</span>.
              </p>
            </div>

            {/* Specialty Access Moved to Sidebar */}
            <div className="pt-6 border-t border-gray-100">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 block">Specialty Access</label>
              <div className="flex flex-col gap-2">
                <LoggersButton
                  active={isLoggersOnly}
                  size="sm"
                  onClick={() => setIsLoggersOnly(!isLoggersOnly)}
                >
                  Loggers Only
                </LoggersButton>

                <FoilingButton
                  active={isFoilingOnly}
                  size="sm"
                  onClick={() => setIsFoilingOnly(!isFoilingOnly)}
                >
                  Foiling Only
                </FoilingButton>
              </div>
            </div>
          </div>
        </aside>

        {/* Main View Area */}
        <main className="flex-1 relative bg-gray-100">
          {/* Weekday Filter Floating Bar */}
          <div className="absolute top-4 md:top-6 left-0 right-0 md:left-1/2 md:-translate-x-1/2 z-30 flex justify-center px-4">
            <div className="flex gap-1 md:gap-2 bg-white/90 backdrop-blur-md p-1 md:p-1.5 rounded-xl md:rounded-2xl shadow-xl md:shadow-2xl border border-white/20 max-w-full overflow-x-auto no-scrollbar">
              {mounted && weekDays.map((option) => {
                const isSelected = selectedDayIndex === option.index;
                return (
                  <button
                    key={option.index}
                    onClick={() => handleDaySelect(option.index)}
                    className={cn(
                      "flex flex-col items-center min-w-[60px] md:min-w-[80px] px-2 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl transition-all border border-transparent group shrink-0",
                      loading && "cursor-wait opacity-70",
                      isSelected
                        ? "bg-gray-800 border-gray-800 text-white shadow-lg md:translate-y-[-1px]"
                        : "bg-white border-gray-100/50 text-gray-900 hover:bg-gray-50 transition-all"
                    )}
                  >
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-tighter">
                      {option.label}
                    </span>
                    <span className={cn(
                      "text-[8px] md:text-[9px] font-bold",
                      isSelected ? "text-white/70" : "text-gray-400 group-hover:text-gray-500"
                    )}>
                      {option.date}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtle loading indicator overlay */}
          {loading && (
            <div className="absolute top-24 right-6 z-50 flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-500">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">
                Syncing Intel...
              </p>
            </div>
          )}

          {viewMode === "map" ? (
            <div className="relative w-full h-full">
              {/* Floating Widgets - Hidden on mobile, moved to bottom drawer or separate toggle */}
              <div className="absolute top-20 md:top-24 left-4 md:left-6 z-30 flex flex-col gap-4 pointer-events-none md:pointer-events-auto opacity-0 md:opacity-100 invisible md:visible">
                <WeatherForecastWidget />
              </div>
              <TideMap 
                beaches={filteredBeaches} 
                loading={loading}
                onBeachSelect={(beach) => {
                  updateFilter("regionId", beach.regionId);
                }}
                onRegionSelect={(regionId) => {
                  updateFilter("regionId", regionId);
                }}
                selectedRegionId={filters.regionId}
                center={mapCenter}
                zoom={mapZoom}
                selectedDayIndex={selectedDayIndex}
                selectedDateString={selectedDateString}
                onAIReportClick={(beach) => {
                  setReportBeach(beach);
                  setIsReportModalOpen(true);
                }}
                showWindHeatmap={showWindHeatmap}
                showSwellHeatmap={showSwellHeatmap}
                onMoveEnd={handleMapMove}
              />
            </div>
          ) : (
            <div className="absolute inset-0 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max">
              {filteredBeaches.map(beach => (
                <div key={beach.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{beach.region}</span>
                      <h3 className="text-lg font-bold text-gray-900">{beach.name}</h3>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase ${
                         beach.difficulty === 'BEGINNER' ? 'bg-emerald-100 text-emerald-700' :
                         beach.difficulty === 'INTERMEDIATE' ? 'bg-amber-100 text-amber-700' :
                         'bg-rose-100 text-rose-700'
                       }`}>
                         {beach.difficulty}
                       </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="flex gap-0.5 mb-1">
                        {[...Array(5)].map((_, i) => {
                          const currentRating = (beach as any).dailyScores?.[selectedDateString]?.rating ?? beach.rating;
                          return (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < currentRating ? 'bg-blue-600' : 'bg-gray-100'}`} />
                          );
                        })}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Rating</span>
                    </div>
                    <div className="h-8 w-px bg-gray-100" />
                    <div>
                       <span className="text-sm font-bold text-gray-900 uppercase tracking-tighter">{beach.waveType.replace('_', ' ')}</span>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Wave Type</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Toggle FAB - Improved Style and Placement */}
      <div className="fixed bottom-6 right-6 z-40 md:hidden">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="w-14 h-14 bg-gray-900 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex flex-col items-center justify-center border border-white/20 active:scale-90 transition-all group"
        >
          <Filter className="w-5 h-5 mb-0.5 group-active:scale-110 transition-transform" />
          <span className="text-[7px] font-black uppercase tracking-widest opacity-70">Filter</span>
        </button>
      </div>

      {/* Mobile Sidebar/Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 max-h-[90vh] bg-white rounded-t-[2.5rem] z-[101] md:hidden flex flex-col shadow-[0_-20px_40px_rgba(0,0,0,0.2)]"
            >
              <div className="relative p-6 flex-1 overflow-y-auto pb-10">
                {/* Pull handle */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full" />
                
                <div className="flex items-center justify-between mb-8 mt-2">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Filters</h2>
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Reuse the same filter logic from Sidebar here or abstract into a component */}
                  {/* Search */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Search Spots</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Enter beach or region..."
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none"
                      />
                    </div>
                  </div>

                  {/* Specialty Access */}
                  <div className="space-y-3">
                     <div className="mb-4">
                        <WeatherForecastWidget />
                     </div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Specialty Access</label>
                    <LoggersButton active={isLoggersOnly} onClick={() => setIsLoggersOnly(!isLoggersOnly)}>Loggers Only</LoggersButton>
                    <FoilingButton active={isFoilingOnly} onClick={() => setIsFoilingOnly(!isFoilingOnly)}>Foiling Only</FoilingButton>
                    <HiddenGemsButton active={isHiddenGemsOnly} onClick={() => setIsHiddenGemsOnly(!isHiddenGemsOnly)}>Hidden Gems</HiddenGemsButton>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Rating Filter</label>
                    <div className="flex justify-between gap-2">
                      {[1, 2, 3, 4, 5].map(r => (
                        <button 
                          key={r}
                          onClick={() => setMinRating(prev => prev === r ? 0 : r)}
                          className={`flex-1 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${minRating === r ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-100'}`}
                        >
                          <span className="font-bold">{r}+</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Experience Level</label>
                    <div className="grid grid-cols-1 gap-2">
                      {["BEGINNER", "INTERMEDIATE", "ADVANCED"].map(d => (
                        <button 
                          key={d}
                          onClick={() => toggleDifficulty(d)}
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 ${selectedDifficulty.includes(d) ? 'border-blue-600 bg-blue-50' : 'border-gray-100'}`}
                        >
                          <span className="text-xs font-bold">{d}</span>
                          <div className={`w-5 h-5 rounded-full border-2 ${selectedDifficulty.includes(d) ? 'bg-blue-600 border-blue-600' : 'border-gray-100'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                   {/* Tactical Overlays */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Tactical Overlays</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setShowWindHeatmap(!showWindHeatmap)} className={cn("p-4 rounded-2xl border-2 flex flex-col items-center", showWindHeatmap ? "bg-gray-900 text-white" : "border-gray-100 text-gray-400")}>
                        <Cloud className="w-5 h-5 mb-2" />
                        <span className="text-xs font-bold">Wind Bloc</span>
                      </button>
                      <button onClick={() => setShowSwellHeatmap(!showSwellHeatmap)} className={cn("p-4 rounded-2xl border-2 flex flex-col items-center", showSwellHeatmap ? "bg-gray-900 text-white" : "border-gray-100 text-gray-400")}>
                        <Waves className="w-5 h-5 mb-2" />
                        <span className="text-xs font-bold">Swell Surge</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AI Report Modal */}
      {reportBeach && (
        <AIReportModal
          beach={reportBeach}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          date={selectedDateString}
        />
      )}
    </div>
  );
}
