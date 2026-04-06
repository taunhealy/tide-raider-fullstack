"use client";

import React, { useState, useEffect, useMemo } from "react";
import TideMap from "@/app/components/map/TideMap";
import { Search, Filter, Star, Info, List, Map as MapIcon, ChevronRight, Waves, Cloud, Loader2 } from "lucide-react";
import { LoggersButton, FoilingButton, HiddenGemsButton } from "@/app/components/ui/GradientButton";
import { cn } from "@/app/lib/utils";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";
import WeatherForecastWidget from "@/app/components/sidebar/WeatherForecastWidget";

interface Beach {
  id: string;
  name: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  difficulty: string;
  waveType: string;
  regionId: string;
  region: string;
  countryId: string;
  country: string;
  continentId: string;
  continent: string;
  rating: number;
}

export default function GlobalMapPage() {
  const { filters, updateFilter } = useBeachFilters();
  const [beaches, setBeaches] = useState<Beach[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"map" | "grid">("map");
  
  // Use selectedDayIndex but also sync it with filter
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showWindHeatmap, setShowWindHeatmap] = useState(false);
  const [showSwellHeatmap, setShowSwellHeatmap] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isLoggersOnly = filters.isLongboarding || false;
  const isFoilingOnly = filters.isFoiling || false;
  const isHiddenGemsOnly = filters.isHiddenGem || false;

  const setIsLoggersOnly = (val: boolean) => updateFilter("isLongboarding", val ? "true" : "");
  const setIsFoilingOnly = (val: boolean) => updateFilter("isFoiling", val ? "true" : "");
  const setIsHiddenGemsOnly = (val: boolean) => updateFilter("isHiddenGem", val ? "true" : "");

  const weekDays = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setUTCDate(now.getUTCDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        
        // Count how many beaches have a rating >= 3 for this day
        const scoreCount = beaches.reduce((acc, b: any) => {
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

  // Update filter when selectedDayIndex changes
  useEffect(() => {
    const dateStr = weekDays[selectedDayIndex]?.dateStr;
    if (dateStr) {
      updateFilter("forecastDate", dateStr);
    }
  }, [selectedDayIndex, weekDays, updateFilter]);

  const selectedDateString = useMemo(() => {
    return weekDays[selectedDayIndex]?.dateStr || new Date().toISOString().split('T')[0];
  }, [selectedDayIndex, weekDays]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/map-data");
        const data = await res.json();
        if (data.beaches) {
          setBeaches(data.beaches);
        }
      } catch (error) {
        console.error("Error fetching map data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredBeaches = useMemo(() => {
    return beaches.filter(beach => {
      const matchesSearch = beach.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           beach.region.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = selectedDifficulty.length === 0 || selectedDifficulty.includes(beach.difficulty);
      
      const currentRating = (beach as any).dailyScores?.[selectedDateString]?.rating ?? beach.rating;
      const matchesRating = currentRating >= minRating;
      
      const isLogger = (beach as any).isLongboarding || false;
      const isFoiler = (beach as any).isFoiling || false;
      const isGem = (beach as any).isHiddenGem || false;

      const matchesLoggers = !isLoggersOnly || isLogger;
      const matchesFoiling = !isFoilingOnly || isFoiler;
      const matchesHiddenGems = !isHiddenGemsOnly || isGem;
      
      return matchesSearch && matchesDifficulty && matchesRating && matchesLoggers && matchesFoiling && matchesHiddenGems;
    });
  }, [beaches, searchQuery, selectedDifficulty, minRating, selectedDateString, isLoggersOnly, isFoilingOnly, isHiddenGemsOnly]);

  const toggleDifficulty = (d: string) => {
    setSelectedDifficulty(prev => 
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg">
            <MapIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Global Break Intel</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Live Conditions & Rating Map</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === "map" ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <MapIcon className="w-4 h-4" /> Map View
          </button>
          <button 
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === "grid" ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <List className="w-4 h-4" /> List View
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter beach or region..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                />
              </div>
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
                    "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all transition-all duration-500",
                    showWindHeatmap 
                      ? "bg-cyan-950 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
                      : "bg-white border-gray-100 hover:border-gray-200"
                  )}
                >
                  <Cloud className={cn("w-5 h-5 mb-1", showWindHeatmap ? "text-cyan-400" : "text-gray-400")} />
                  <span className={cn("text-[9px] font-black uppercase tracking-widest", showWindHeatmap ? "text-cyan-400" : "text-gray-500")}>Wind Bloc</span>
                </button>
                <button
                  onClick={() => setShowSwellHeatmap(!showSwellHeatmap)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all transition-all duration-500",
                    showSwellHeatmap 
                      ? "bg-indigo-950 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]" 
                      : "bg-white border-gray-100 hover:border-gray-200"
                  )}
                >
                  <Waves className={cn("w-5 h-5 mb-1", showSwellHeatmap ? "text-indigo-400" : "text-gray-400")} />
                  <span className={cn("text-[9px] font-black uppercase tracking-widest", showSwellHeatmap ? "text-indigo-400" : "text-gray-500")}>Swell Surge</span>
                </button>
              </div>

              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Specialty Access</label>
              <div className="grid grid-cols-1 gap-2">
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

                <HiddenGemsButton
                  active={isHiddenGemsOnly}
                  size="sm"
                  onClick={() => setIsHiddenGemsOnly(!isHiddenGemsOnly)}
                >
                  Hidden Gems
                </HiddenGemsButton>
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
          </div>
        </aside>

        {/* Main View Area */}
        <main className="flex-1 relative bg-gray-100">
          {/* Weekday Filter Floating Bar */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border border-white/20">
            {mounted && weekDays.map((option) => {
              const isSelected = selectedDayIndex === option.index;
              return (
                <button
                  key={option.index}
                  onClick={() => setSelectedDayIndex(option.index)}
                  className={cn(
                    "flex flex-col items-center min-w-[80px] px-4 py-2 rounded-xl transition-all border border-transparent group",
                    loading && "cursor-wait opacity-70",
                    isSelected
                      ? "bg-gray-800 border-gray-800 text-white shadow-lg translate-y-[-1px]"
                      : "bg-white border-gray-100 text-gray-900 hover:bg-gray-50 transition-all w-fit"
                  )}
                >
                  <span className="text-[10px] font-black uppercase tracking-tighter">
                    {option.label}
                  </span>
                  <span className={cn(
                    "text-[9px] font-bold",
                    isSelected ? "text-white" : "text-gray-400 group-hover:text-gray-500"
                  )}>
                    {option.date}
                  </span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-50">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] animate-pulse">Syncing Global Data...</p>
              </div>
            </div>
          ) : viewMode === "map" ? (
            <div className="relative w-full h-full">
              <div className="absolute top-6 left-6 z-30 w-72 pointer-events-auto">
                <WeatherForecastWidget />
              </div>
              <TideMap 
                beaches={filteredBeaches} 
                onBeachSelect={(beach) => {
                  updateFilter("regionId", beach.regionId);
                }}
                onRegionSelect={(regionId) => {
                  updateFilter("regionId", regionId);
                }}
                selectedDayIndex={selectedDayIndex}
                showWindHeatmap={showWindHeatmap}
                showSwellHeatmap={showSwellHeatmap}
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
    </div>
  );
}
