"use client";

import { useState, useEffect } from "react";
import { Check, Info, Shield, Target, Award, BarChart3, MapPin } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface Beach {
  id: string;
  name: string;
  regionId: string;
  mostAccurateSource?: string | null;
  sourceAccuracyCount?: number;
}

const SOURCES = ["ALPHA", "BETA", "GAMMA", "DELTA"];
const DIRECTIONS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

function getCardinalDirection(angle: number | null | undefined): string {
  if (angle === null || angle === undefined || isNaN(angle) || angle < 0) return "-";
  const index = Math.round(angle / 22.5) % 16;
  return DIRECTIONS[index];
}

export default function AdminAccuracyPage() {
  const [beaches, setBeaches] = useState<Beach[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<{ beachId: string, source: string } | null>(null);
  const [conditions, setConditions] = useState<any>(null);
  const [loadingConditions, setLoadingConditions] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBeaches();
  }, []);

  const fetchBeaches = async () => {
    try {
      const res = await fetch("/api/map-data?lite=true");
      if (res.ok) {
        const data = await res.json();
        const sorted = data.beaches.sort((a: Beach, b: Beach) => {
           if (a.regionId === 'western-cape' && b.regionId !== 'western-cape') return -1;
           if (a.regionId !== 'western-cape' && b.regionId === 'western-cape') return 1;
           return a.name.localeCompare(b.name);
        });
        setBeaches(sorted);
      }
    } catch (error) {
      console.error("Failed to fetch beaches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSourceClick = async (beachId: string, source: string) => {
    // Map Alpha/Beta/Gamma to the real source names in the DB
    const sourceMap: Record<string, string> = {
      "ALPHA": "WINDFINDER",
      "BETA": "WINDGURU",
      "GAMMA": "WINDY",
      "DELTA": "TIDE_RAIDER"
    };
    const dbSource = sourceMap[source] || source;

    setSelectedSource({ beachId, source });
    setLoadingConditions(true);
    setConditions(null);
    try {
      const res = await fetch(`/api/beaches/${beachId}/rating?source=${dbSource}`);
      if (res.ok) {
        const data = await res.json();
        setConditions(data.conditions || null);
      }
    } catch (error) {
      console.error("Failed to fetch conditions:", error);
    } finally {
      setLoadingConditions(false);
    }
  };

  const handleVote = async () => {
    if (!selectedSource) return;
    const { beachId, source } = selectedSource;

    const sourceMap: Record<string, string> = {
      "ALPHA": "WINDFINDER",
      "BETA": "WINDGURU",
      "GAMMA": "WINDY",
      "DELTA": "TIDE_RAIDER"
    };
    const dbSource = sourceMap[source] || source;

    setVotingId(`${beachId}-${source}`);
    try {
      const res = await fetch(`/api/beaches/${beachId}/accuracy-vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: dbSource }),
      });

      if (res.ok) {
        setBeaches(prev => prev.map(b => {
          if (b.id === beachId) {
            return {
              ...b,
              mostAccurateSource: source,
              sourceAccuracyCount: (b.sourceAccuracyCount || 0) + 1
            };
          }
          return b;
        }));
        // Reset selection after voting
        setSelectedSource(null);
        setConditions(null);
      }
    } catch (error) {
      console.error("Failed to vote:", error);
    } finally {
      setVotingId(null);
    }
  };

  const filteredBeaches = beaches.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.regionId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans p-6 md:p-12">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tighter italic">
                Accuracy <span className="text-blue-500">Command Center</span>
              </h1>
            </div>
            <p className="text-gray-400 font-medium">
              Validate live conditions against forecast sources.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <input 
              type="text"
              placeholder="Search beaches or regions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500/50 transition-all font-medium text-sm"
            />
          </div>
        </div>
      </div>

      {/* Selected Source Preview & Vote Action */}
      {selectedSource && (
        <div className="max-w-6xl mx-auto mb-8 sticky top-6 z-50">
          <div className="bg-blue-600 border border-blue-400 rounded-3xl p-6 shadow-[0_20px_50px_-12px_rgba(37,99,235,0.5)] backdrop-blur-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-white/20 rounded-2xl">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-blue-100 mb-1">Previewing Accuracy</h2>
                  <div className="text-2xl font-black italic uppercase">
                    {beaches.find(b => b.id === selectedSource.beachId)?.name} 
                    <span className="mx-3 opacity-50">→</span>
                    <span className="text-white bg-white/20 px-3 py-1 rounded-lg">{selectedSource.source}</span>
                  </div>
                </div>
              </div>

              {/* Conditions Preview */}
              <div className="flex-1 flex items-center justify-center gap-8 md:px-12 border-white/10 md:border-x">
                {loadingConditions ? (
                  <div className="animate-pulse flex gap-8">
                    <div className="h-8 w-20 bg-white/20 rounded-lg"></div>
                    <div className="h-8 w-20 bg-white/20 rounded-lg"></div>
                  </div>
                ) : conditions ? (
                  <div className="flex gap-12">
                    <div className="text-center">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-1">🌊 Swell</div>
                      <div className="text-xl font-black">
                        {conditions.swellHeight?.toFixed(1)}m @ {conditions.swellPeriod}s
                        <span className="ml-2 text-sm text-blue-100 opacity-60 font-medium">({conditions.swellDirection}°)</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-blue-200 mb-1">💨 Wind</div>
                      <div className="text-xl font-black">
                        {Math.round(conditions.windSpeed)}kts 
                        <span className="ml-2 text-sm text-blue-100 opacity-60 font-medium uppercase">{getCardinalDirection(conditions.windDirection)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-blue-100 font-bold opacity-60 italic">No forecast data found for this source today.</div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { setSelectedSource(null); setConditions(null); }}
                  className="px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-sm font-black uppercase transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleVote}
                  disabled={!!votingId}
                  className="px-10 py-4 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 text-sm font-black uppercase transition-all shadow-xl active:scale-95 disabled:opacity-50"
                >
                  {votingId ? "Confirming..." : "Confirm Vote ✅"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview (Hidden when previewing to save space) */}
      {!selectedSource && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-green-400" />
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">Total Observations</span>
            </div>
            <div className="text-3xl font-black">
              {beaches.reduce((acc, b) => acc + (b.sourceAccuracyCount || 0), 0)}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 text-blue-400" />
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">Monitored Breaks</span>
            </div>
            <div className="text-3xl font-black">{beaches.length}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-black uppercase tracking-widest text-gray-400">Ensemble Confidence</span>
            </div>
            <div className="text-3xl font-black text-purple-400">High</div>
          </div>
        </div>
      )}

      {/* Beach List */}
      <div className="max-w-6xl mx-auto space-y-4 pb-20">
        {filteredBeaches.map((beach) => (
          <div 
            key={beach.id} 
            className={cn(
              "group border rounded-2xl p-4 md:p-6 transition-all duration-300",
              selectedSource?.beachId === beach.id 
                ? "bg-white/10 border-white/20" 
                : "bg-white/5 border-white/5 hover:border-white/10"
            )}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border border-white/10 shadow-lg">
                  <MapPin className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight leading-none mb-1">
                    {beach.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      {beach.regionId}
                    </span>
                    {beach.mostAccurateSource && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 uppercase tracking-widest px-2 py-0.5 bg-green-400/10 rounded-full">
                        <Check className="w-2.5 h-2.5" />
                        Best: {beach.mostAccurateSource}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Vote Matrix */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {SOURCES.map((source) => {
                  const isCurrentWinner = beach.mostAccurateSource === source;
                  const isSelected = selectedSource?.beachId === beach.id && selectedSource?.source === source;
                  
                  return (
                    <button
                      key={source}
                      onClick={() => handleSourceClick(beach.id, source)}
                      className={cn(
                        "relative flex flex-col items-center justify-center px-4 py-3 rounded-xl border transition-all duration-300 group/btn overflow-hidden",
                        isSelected
                          ? "bg-white text-blue-600 border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                          : isCurrentWinner 
                            ? "bg-blue-600/20 border-blue-600/50 text-blue-400" 
                            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                      )}
                    >
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em]",
                        isSelected ? "text-blue-600" : isCurrentWinner ? "text-blue-400" : "text-gray-400 group-hover/btn:text-white"
                      )}>
                        {source}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {filteredBeaches.length === 0 && (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
            <Info className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 font-bold uppercase tracking-widest">No beaches match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
