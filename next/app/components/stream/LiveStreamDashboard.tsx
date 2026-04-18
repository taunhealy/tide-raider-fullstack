"use client";
// Forced Recompile: Sentinel System Upgrade

import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { BlueStarRating } from "@/app/lib/scoreDisplayBlueStars";
import dynamic from 'next/dynamic';

const SentinelVFXOverlay = dynamic(() => import('./SentinelVFXOverlay').then(m => m.SentinelVFXOverlay), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 pointer-events-none z-[200] bg-black/20" />
});
import { cn } from "@/app/lib/utils";
import { Radio, Music, Wind, Droplets, Waves, Clock, Camera, User, Volume2, VolumeX, Quote } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { getScoreDisplay } from "@/app/lib/scoreDisplay";
import Image from "next/image";

// --- AUDIO VISUALIZER COMPONENT (WMP CIRCLE STYLE) ---
const AudioVisualizer = ({ audioRef, isMuted }: { audioRef: React.RefObject<HTMLAudioElement | null>, isMuted: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (!audioRef.current || isMuted) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    if (!contextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      contextRef.current = new AudioContextClass();
      analyserRef.current = contextRef.current.createAnalyser();
      sourceRef.current = contextRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(contextRef.current.destination);
      analyserRef.current.fftSize = 128; // Lower for thicker WMP bars
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyserRef.current!.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = canvas.width / 4.5;

      // Draw static border ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 2, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(28, 217, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Dynamic inner pulse
      const avgVolume = dataArray.reduce((a, b) => a + b) / bufferLength;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 4, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(28, 107, 255, ${(avgVolume / 255) * 0.3})`;
      ctx.fill();

      // Draw WMP Reactive Bars
      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i];
        const percent = value / 255;
        const barHeight = percent * 20; 
        
        const angle = (i / bufferLength) * Math.PI * 2;
        
        const xStart = centerX + Math.cos(angle) * radius;
        const yStart = centerY + Math.sin(angle) * radius;
        const xEnd = centerX + Math.cos(angle) * (radius + barHeight);
        const yEnd = centerY + Math.sin(angle) * (radius + barHeight);

        ctx.beginPath();
        ctx.moveTo(xStart, yStart);
        ctx.lineTo(xEnd, yEnd);
        
        ctx.strokeStyle = `rgba(28, 107, 255, ${Math.max(0.4, percent)})`;
        ctx.lineWidth = 3; 
        ctx.lineCap = "round";
        ctx.stroke();
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [audioRef, isMuted]);

  return (
    <canvas 
      ref={canvasRef} 
      width={70} 
      height={70} 
      className="shrink-0 drop-shadow-[0_0_8px_rgba(28,217,255,0.4)]"
    />
  );
};

// Helper to convert degrees to cardinal direction
const getCardinal = (angle: number) => {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(angle / 45) % 8];
};

// Target Beach IDs
const TARGET_BEACHES = [
  { id: "long-beach", name: "Long Beach", region: "Western Cape", regionId: "western-cape" },
  { id: "muizenberg-beach", name: "Muizenberg", region: "Western Cape", regionId: "western-cape" }
];

interface StreamCardProps {
  beachId: string;
  name: string;
  region: string;
  regionId: string;
  beachScores: Record<string, any>;
  forecastData: any;
  recentLogs: any[];
  isLoading: boolean;
  forecastDataSingle?: any;
}

const SentinelIntelligenceFeed = ({ beaches, beachScores, forecastData, dayIndex, activeIndex, onPresenterChange, currentPresenterOverride, carouselDates, recentLogs }: { beaches: any[], beachScores: any, forecastData: any, dayIndex: number, activeIndex: number, onPresenterChange: (idx: number) => void, currentPresenterOverride: number | null, carouselDates: any[], recentLogs: any[] }) => {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const activeBeach = beaches[activeIndex];
  if (!activeBeach) return null;

  // Access score directly from the pre-fetched beachScores map
  // Structure: { [beachId]: { score: number, ... } }
  const score = beachScores?.[activeBeach.id]?.score ?? 0;
  
  const f = forecastData?.[activeBeach.regionId] || {};
  
  // Base URL for API calls
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';

  const activePresenterIdx = currentPresenterOverride !== null ? currentPresenterOverride : dayIndex;
  const personas = ["PIRATE", "MC", "BRO"];
  const currentPersona = personas[activePresenterIdx];

  // Filter logs for this specific beach
  const activeLogs = (recentLogs || []).filter(log => log.beachId === activeBeach.id);
  const latestBeachLog = activeLogs[0];

  useEffect(() => {
    let isMounted = true;
    const fetchAiReport = async () => {
      // Get the correct date for the active horizon
      const targetDate = carouselDates[dayIndex]?.iso;
      if (!targetDate) return;

      setIsAiLoading(true);
      try {
        const queryParams = new URLSearchParams({
           beach: activeBeach.name,
           windSpeed: (f.windSpeed || 0).toString(),
           windDir: (f.windDirectionCardinal || getCardinal(f.windDirection || 0)),
           swellHeight: (f.swellHeight || 0).toString(),
           swellPeriod: (f.swellPeriod || 0).toString(),
           swellDir: getCardinal(f.swellDirection || 0),
           score: score.toString(),
           persona: currentPersona,
           date: targetDate,
           trend: f.trend || ""
        });

        const res = await fetch(`${baseUrl}/api/intelligence/report?${queryParams.toString()}`);
        const data = await res.json();
        if (isMounted && data.report) {
          setAiReport(data.report);
        }
      } catch (e) {
        console.error("AI Intel fetch failed", e);
        if (isMounted) setAiReport("Uplink failed. Local sensors reporting chaos.");
      } finally {
        setIsAiLoading(false);
      }
    };

    fetchAiReport();
    return () => { isMounted = false; };
  }, [activeBeach.id, activePresenterIdx, Math.round(score * 10), dayIndex]);
  
  // Technical Multi-Persona Variety Engine
  const getPresenterName = (dayIdx: number) => {
    if (dayIdx === 0) return "Cap'n Flint (AI Reporter)";
    if (dayIdx === 1) return "Lyricist (AI Reporter)";
    return "Kai (AI Reporter)";
  };

  const getReportLabel = (dayIdx: number) => {
    if (dayIdx === 0) return "Maritime Archive (AI)";
    if (dayIdx === 1) return "Flow Analysis (AI)";
    return "Swell Science (AI)";
  };

  const presenter = getPresenterName(activePresenterIdx);
  const reportLabel = getReportLabel(activePresenterIdx);

  return (
    <div className="w-full bg-black/40 backdrop-blur-3xl border border-white/5 rounded-xl mb-6 overflow-hidden relative group">
       {/* Background Subtle Wave Grid */}
       <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
       
       <div className="relative flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/5 font-primary min-h-[220px]">
          {/* 1. Conditions Column (Now Left) */}
          <div className="lg:w-1/4 p-6 bg-white/[0.02] flex flex-col gap-6">
             <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">The Swell</span>
                <div className="flex items-baseline gap-1">
                   <span className="text-3xl font-black text-white">{(f?.swellHeight !== undefined && f?.swellHeight !== null) ? f.swellHeight.toFixed(1) : "--"}</span>
                   <span className="text-[10px] font-bold text-gray-500 uppercase">m</span>
                   <span className="text-sm font-bold text-gray-400 ml-2">@ {f?.swellPeriod || "--"}s</span>
                </div>
                <div className="text-[9px] font-bold text-brand-3/60 uppercase tracking-widest">Coming from {f?.swellDirectionCardinal || getCardinal(f?.swellDirection || 0)}</div>
             </div>
             
             <div className="flex flex-col gap-1 border-t border-white/5 pt-4">
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">The Wind</span>
                <div className="flex items-baseline gap-1">
                   <span className="text-2xl font-black text-white">{(f?.windSpeed !== undefined && f?.windSpeed !== null) ? f.windSpeed.toFixed(0) : "--"}</span>
                   <span className="text-[10px] font-bold text-gray-500 uppercase">kts</span>
                   <span className="text-sm font-bold text-gray-400 ml-2">from {f?.windDirectionCardinal || getCardinal(f?.windDirection || 0)}</span>
                </div>
             </div>
          </div>

          {/* 2. AI Intelligence & Identity Container (Center) */}
          <div className="flex-1 p-6 lg:p-8 flex flex-col relative group/report bg-white/[0.01]">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-brand-3 shadow-[0_0_10px_#1cd9ff]" />
                   <span className="text-[10px] font-bold text-brand-3 uppercase tracking-[0.4em]">{presenter}</span>
                </div>
                <span className="px-2 py-0.5 border border-white/10 rounded text-[7px] font-bold text-white/40 uppercase tracking-widest">{reportLabel}</span>
             </div>

             <div className="mb-4">
                <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-none mb-1">{activeBeach.name}</h3>
                <div className="flex items-center gap-3">
                   <BlueStarRating score={score} size={14} />
                   <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{score.toFixed(1)}/10</span>
                   <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">{getScoreDisplay(score).description}</span>
                </div>
             </div>
             
             <div className="relative flex-1 flex flex-col justify-center">
                <div className="absolute -left-2 top-0 text-brand-3/10 pointer-events-none">
                   <Quote size={30} className="rotate-180" />
                </div>
                <p className="text-[13px] lg:text-[14px] font-bold text-white/90 leading-relaxed relative z-10 pl-6 pr-4">
                   {isAiLoading ? (
                     <span className="flex items-center gap-2 opacity-40 italic animate-pulse">
                        <Radio size={14} className="text-brand-3" />
                        Syncing...
                     </span>
                   ) : (
                     (typeof aiReport === 'string' ? aiReport : (aiReport ? "Satellite Data Corruption." : "Synchronizing..."))
                   )}
                </p>
             </div>

             {/* Minimal Presenter Toggles */}
             <div className="mt-4 flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
                {[
                  { icon: "⚓", idx: 0 },
                  { icon: "🎤", idx: 1 },
                  { icon: "🤙", idx: 2 }
                ].map((p) => (
                   <button 
                     key={p.idx}
                     onClick={() => onPresenterChange(p.idx)}
                     className={cn(
                       "w-6 h-6 rounded flex items-center justify-center transition-all",
                       activePresenterIdx === p.idx ? "bg-brand-3/20 text-white" : "hover:bg-white/5 text-white/40"
                     )}
                   >
                      <span className="text-[10px]">{p.icon}</span>
                   </button>
                ))}
             </div>
          </div>

          {/* 3. Recent Log Column (Right) */}
          <div className="lg:w-1/4 p-6 bg-white/[0.03] flex flex-col">
             <div className="flex items-center gap-2 mb-4">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Latest Log</span>
                <div className="h-px flex-1 bg-white/5" />
             </div>
             
             {latestBeachLog ? (
               <div className="flex flex-col gap-3 h-full">
                  {/* Thumbnail Resolver */}
                  {(() => {
                    const thumb = latestBeachLog.images?.[0]?.url || latestBeachLog.image || latestBeachLog.imageUrl || latestBeachLog.beach?.imageUrl;
                    return thumb ? (
                      <div className="w-full h-32 rounded overflow-hidden mb-1 relative border border-white/5 bg-gray-900">
                         <img src={thumb} alt="Latest Condition" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      </div>
                    ) : null;
                  })()}

                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-bold text-brand-3">{latestBeachLog.surferRating || 0}★</span>
                     <span className="text-[8px] font-black text-white/40 uppercase tracking-widest truncate">{latestBeachLog.user?.name || "Raider"}</span>
                  </div>
                  <p className="text-[10px] font-medium text-gray-400 leading-snug italic line-clamp-2">
                    "{latestBeachLog.comments || "Conditions verified."}"
                  </p>
                  <div className="mt-auto text-[7px] font-black text-white/20 uppercase tracking-widest">
                    {format(new Date(latestBeachLog.createdAt || latestBeachLog.date), "HH:mm")} • {latestBeachLog.crowdLevel || "Moderate"} Crowds
                  </div>
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden group/await">
                  <div className="relative w-10 h-10 rounded-full bg-brand-3/10 border border-brand-3/30 flex items-center justify-center text-brand-3 shadow-[0_0_15px_rgba(28,217,255,0.1)]">
                     <Camera size={16} className="animate-pulse" />
                  </div>
                  
                  <div className="flex flex-col gap-1 z-10">
                    <span className="text-[9px] font-black text-white/80 uppercase tracking-[0.3em] animate-pulse">Awaiting your log</span>
                    <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Post intel from the field</span>
                  </div>
               </div>
             )}
          </div>
       </div>

       {/* Simple Progress Bar - Sync Fix */}
       <div className="h-1 bg-white/[0.03] w-full mt-auto relative">
          <div key={`${dayIndex}-${activeIndex}`} className="absolute top-0 left-0 h-full bg-brand-3 shadow-[0_0_10px_#1cd9ff] animate-[progress_30s_linear_infinite]" />
       </div>

       <style jsx>{`
         @keyframes progress {
           from { width: 0%; }
           to { width: 100%; }
         }
       `}</style>
    </div>
  );
};

const StreamCard = React.memo(({ beachId, name, region, regionId, beachScores, forecastData, recentLogs, isLoading }: StreamCardProps) => {
  // Direct score access from DB-backed records
  const score = beachScores?.[beachId]?.score ?? 0;
  const f = forecastData?.[regionId] || {};
  const displayScore = Math.min(score, 10);
  const scoreInfo = getScoreDisplay(displayScore);

  // Base URL for diagnostics
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';

  // STRICT DIRECT BEACH MATCHING - No Regional Fallbacks
  const latestLog = recentLogs?.find((log: any) => {
    const logBeachId = log?.beach?.id || log?.beachId;
    const logBeachSlug = log?.beach?.slug || log?.beachSlug;
    
    // Only return true if it's a direct hit for this specific beach
    return logBeachSlug === beachId || logBeachId === beachId;
  });

  // Exhaustive Image Resolution
  const logThumbnail = 
    latestLog?.images?.[0]?.url || 
    latestLog?.image || 
    latestLog?.imageUrl || 
    latestLog?.metadata?.imageUrl ||
    (latestLog?.beach?.imageUrl);

  // Dynamic Intel Summary
  const intelSummary = latestLog ? (
    `${latestLog.surferRating || latestLog.rating || 0}★ • ${(latestLog.comments || "Report Received").toString().substring(0, 25)}`
  ) : `Awaiting your log entry...`;

  return (
    <div className="relative group overflow-hidden bg-black/40 backdrop-blur-3xl border border-white/5 rounded-xl transition-all h-full min-h-0 flex flex-col shadow-2xl">
      {/* Surgical Background Grid */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '15px 15px' }} />

      {/* Top Identity bar */}
      <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/[0.01]">
         <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-red-500 font-black text-[8px] uppercase tracking-widest">
               <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
               Live
            </div>
            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] font-mono">ID: {beachId.split('-')[0].toUpperCase()}</span>
         </div>
      </div>

      <div className="flex flex-1 min-h-0">
         {/* Main Intelligence Zone */}
         <div className="flex-1 p-4 lg:p-5 flex flex-col relative z-10 border-r border-white/5 pointer-events-none">
            <div className="mb-4">
               <h2 className="text-xl lg:text-2xl font-black text-white tracking-widest leading-none uppercase">{name}</h2>
            </div>

            <div className="flex flex-col gap-3">
               <div>
                  <div className="text-[8px] font-black text-white uppercase tracking-widest mb-1.5 opacity-80">Surf Rating</div>
                  <BlueStarRating score={displayScore} size={16} />
               </div>
               
               <div className="inline-flex self-start items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded">
                  <span className="text-sm">{scoreInfo.emoji}</span>
                  <span className="text-[10px] font-black text-white uppercase tracking-tighter">{scoreInfo.description || scoreInfo.label}</span>
               </div>
            </div>

            {/* Tactical Grid */}
            <div className="mt-auto grid grid-cols-2 gap-2">
               <div className="p-2 bg-white/[0.03] border border-white/5 rounded flex flex-col gap-1 overflow-hidden">
                  <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">Swell</span>
                  <div className="text-[11px] font-black text-white tabular-nums truncate">{f?.swellHeight?.toFixed(1) || "--"}m @ {f?.swellPeriod || "--"}s</div>
               </div>
               <div className="p-2 bg-white/[0.03] border border-white/5 rounded flex flex-col gap-1 overflow-hidden">
                  <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">Wind</span>
                  <div className="text-[11px] font-black text-white tabular-nums truncate">{f?.windSpeed?.toFixed(0) || "--"}kts <span className="text-brand-3 text-[10px]">{f?.windDirectionCardinal || getCardinal(f?.windDirection || 0)}</span></div>
               </div>
            </div>
         </div>

      </div>

      {/* Connection Sentinel Loading State */}
      {(isLoading || !beachScores) && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-20">
           <div className="w-10 h-10 relative">
              <div className="absolute inset-0 border-2 border-brand-3/20 rounded-full" />
              <div className="absolute inset-0 border-2 border-brand-3 border-t-transparent rounded-full animate-spin" />
           </div>
           <span className="text-[9px] font-black text-brand-3 uppercase tracking-[0.4em] mt-4 animate-pulse">Establishing Link...</span>
        </div>
      )}
    </div>
  );
});


export default function LiveStreamDashboard() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Generate 3 days for the carousel (memoized)
  const carouselDates = React.useMemo(() => Array.from({ length: 3 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : format(d, "EEE d MMM"),
      iso: d.toISOString().split("T")[0]
    };
  }), []);
  const [isMuted, setIsMuted] = useState(true);
  const [playlist, setPlaylist] = useState<string[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Initial audio scan
    fetch("/api/audio-scanner")
      .then(r => r.json())
      .then(data => {
        if (data.tracks?.length > 0) {
          setPlaylist(data.tracks);
        }
      })
      .catch(console.error);

    return () => clearInterval(timer);
  }, []);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.play().catch(console.error);
        setIsMuted(false);
      } else {
        audioRef.current.pause();
        setIsMuted(true);
      }
    }
  };

  const nextTrack = () => {
    if (playlist.length > 0) {
      setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    }
  };

  useEffect(() => {
    if (!isMuted && audioRef.current && playlist.length > 0) {
      audioRef.current.play().catch(console.error);
    }
  }, [currentTrackIndex, isMuted, playlist]);
  // --- CONSOLIDATED ROTATION ENGINE ---
  const [dayIndex, setDayIndex] = useState(0);
  const [beachIndex, setBeachIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [presenterOverride, setPresenterOverride] = useState<number | null>(null);

  useEffect(() => {
    const beachDuration = 30000;
    const progressStep = 100 / (beachDuration / 100);

    const masterInterval = setInterval(() => {
      setProgress((prevProgress) => {
        const nextProgress = prevProgress + progressStep;
        
        // If we reach 100%, trigger the rotation
        if (nextProgress >= 100) {
          setBeachIndex((prevBeach) => {
            if (prevBeach >= TARGET_BEACHES.length - 1) {
              setDayIndex((prevDay) => (prevDay + 1) % 3);
              return 0; // Reset to first beach
            }
            return prevBeach + 1;
          });
          return 0; // Reset progress
        }
        
        return nextProgress;
      });
    }, 100);

    return () => clearInterval(masterInterval);
  }, []);

  const { data: broadcastData, isLoading } = useQuery({
    queryKey: ["broadcastSync"], 
    queryFn: async () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4001';
      
      const safeFetch = async (url: string) => {
        try {
          // Prepend baseUrl if it's a relative path
          const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
          const r = await fetch(fullUrl);
          if (!r.ok) return {};
          return await r.json();
        } catch (e) {
          console.error(`Fetch error: ${url}`, e);
          return {};
        }
      };

      // Fetch all 3 days in parallel for all regions
      const results = await Promise.all(
        carouselDates.map(async (date) => {
          const [rWC, rEC, fWC, fEC] = await Promise.all([
            safeFetch(`/api/filtered-beaches?regionId=western-cape&forecastDate=${date.iso}&source=WINDFINDER`),
            safeFetch(`/api/filtered-beaches?regionId=eastern-cape&forecastDate=${date.iso}&source=WINDFINDER`),
            safeFetch(`/api/forecast?regionId=western-cape&forecastDate=${date.iso}`),
            safeFetch(`/api/forecast?regionId=eastern-cape&forecastDate=${date.iso}`)
          ]);
          return {
            beachScores: { ...(rWC.scores || {}), ...(rEC.scores || {}) },
            forecasts: { "western-cape": fWC, "eastern-cape": fEC }
          };
        })
      );

      const logs = await safeFetch(`/api/raid-logs?limit=100`);
      const logEntries = Array.isArray(logs.entries) ? logs.entries : Array.isArray(logs) ? logs : [];
      
      return {
        horizons: results, // [day0, day1, day2]
        recentLogs: logEntries.sort((a: any, b: any) => 
          new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
        )
      };
    },
    refetchInterval: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 5, // Data is fresh for 5 mins
    gcTime: 1000 * 60 * 30 // Keep in memory for 30 mins even if unused
  });

  return (
    <div className="fixed inset-0 bg-gray-950 overflow-hidden flex flex-col font-primary selection:bg-brand-3 selection:text-white">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 opacity-[0.12] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-brand-3/10 via-transparent to-transparent" />
      </div>
      
      {/* High Fidelity Overlays */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.6)_100%)]" />
      <div className="absolute inset-0 z-[15] pointer-events-none opacity-[0.03] overflow-hidden bg-[length:100%_4px] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)]" />

      {/* Broadcast Playlist Engine */}
      <audio 
        ref={audioRef}
        onEnded={nextTrack}
        src={playlist.length > 0 ? `/audio/${playlist[currentTrackIndex]}` : undefined}
        className="hidden"
        crossOrigin="anonymous"
      />

      <div className="relative z-20 flex-1 flex flex-col p-6 lg:p-8 xl:p-12 min-h-0 overflow-hidden">
        {/* Compact Logo Header */}
        <header className="flex items-center justify-between mb-5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 lg:w-14 lg:h-14 bg-brand-3 rounded-xl flex items-center justify-center text-gray-950 shadow-[0_0_20px_rgba(28,217,255,0.3)]">
              <Radio size={24} />
            </div>
            <div>
              <h1 className="text-xl lg:text-3xl font-black text-white tracking-widest uppercase leading-none">
                Tide Raider <span className="text-brand-3">Live</span>
              </h1>
              <p className="text-[8px] lg:text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] mt-1.5 opacity-60">Live Surf Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 lg:gap-10 text-right">
             <div className="flex items-center gap-1.5">
                <div className="shrink-0 flex items-center justify-center">
                   <AudioVisualizer audioRef={audioRef} isMuted={isMuted} />
                </div>
                <button 
                  onClick={toggleAudio}
                  suppressHydrationWarning
                  className={cn(
                    "flex flex-col items-end transition-all duration-500",
                    isMuted ? "opacity-30" : "opacity-100"
                  )}
                >
                    <span className="text-[7px] lg:text-[8px] font-black text-brand-3 uppercase tracking-widest mb-1 flex items-center gap-1.5 font-primary">
                      {isMuted ? <VolumeX size={10} /> : <Volume2 size={10} className="animate-pulse" />} 
                      {isMuted ? "Audio Muted" : "Radio Stream Active"}
                    </span>
                    <span className="text-[10px] lg:text-xs font-bold text-white tracking-widest leading-none truncate max-w-[150px]">
                      {isMuted ? "Waiting for play" : (mounted ? (playlist[currentTrackIndex] || "Scanned: 0 tracks") : "---")}
                    </span>
                </button>
             </div>
            <div className="flex flex-col items-end min-w-[140px]">
              {mounted && (
                <>
                  <span className="text-[8px] lg:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-40 font-medium font-primary">
                    Today, {format(currentTime, "MMMM do")}
                  </span>
                  <span className="text-lg lg:text-3xl font-black text-white tracking-tighter tabular-nums leading-none font-primary">
                    {format(currentTime, "HH:mm:ss")}
                  </span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Intelligence Carousel Navigation */}
        <div className="flex flex-col items-center mb-8 shrink-0">
          <div className="grid grid-cols-3 gap-12 lg:gap-20 mb-4 h-8 relative">
            {carouselDates.map((d, i) => (
              <button
                key={i}
                onClick={() => { setDayIndex(i); setProgress(0); }}
                className={cn(
                  "text-[10px] lg:text-[11px] font-black uppercase tracking-[0.4em] transition-all duration-700 relative z-10",
                  dayIndex === i ? "text-brand-3 opacity-100" : "text-gray-600 opacity-40 hover:opacity-60"
                )}
                suppressHydrationWarning
              >
                {mounted ? d.label : "---"}
              </button>
            ))}
            {/* Active Day Indicator Underline */}
            <div 
              className="absolute -bottom-1 h-0.5 bg-brand-3 shadow-[0_0_10px_#1cd9ff] transition-all duration-1000 ease-in-out"
              style={{
                left: `${dayIndex * 33.33}%`,
                width: '33.33%'
              }}
            />
          </div>
        </div>

        {/* AI Sentinel Intelligence Feed */}
        {!isLoading && (
          <SentinelIntelligenceFeed 
            beaches={TARGET_BEACHES}
            beachScores={broadcastData?.horizons?.[dayIndex]?.beachScores}
            forecastData={broadcastData?.horizons?.[dayIndex]?.forecasts}
            dayIndex={dayIndex}
            activeIndex={beachIndex}
            onPresenterChange={setPresenterOverride}
            currentPresenterOverride={presenterOverride}
            carouselDates={carouselDates}
            recentLogs={broadcastData?.recentLogs || []}
          />
        )}

        {/* Primary Intelligence Display takes focus - redundant grid removed */}
        <div className="flex-1 min-h-0" />

        {/* Real-Time Status & Progress (Moved to Bottom) */}
        <div className="flex flex-col items-center mb-4 shrink-0">
           <div className="w-64 lg:w-96 h-px bg-white/5 relative overflow-hidden mb-3">
              <div 
                className="absolute left-0 top-0 bottom-0 bg-brand-3/40 transition-all duration-100 linear"
                style={{ width: `${progress}%` }}
              />
              <div 
                 className="absolute left-0 top-0 bottom-0 bg-brand-3 shadow-[0_0_15px_rgba(28,217,255,0.6)] transition-all duration-100 linear"
                 style={{ width: `${Math.max(0, progress - 1)}%` }}
              />
           </div>
           <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-brand-3 animate-ping" />
              <span className="text-[7px] font-black text-brand-3/40 uppercase tracking-[0.3em]">
                {isLoading ? "Synchronizing Horizons..." : "Real-Time Intelligence Cycle"}
              </span>
           </div>
        </div>

        {/* Call to Action Badge */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] group/cta">
           <a 
            href="https://www.tideraider.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-2 bg-gray-900/80 backdrop-blur-xl border border-brand-3/20 rounded-full shadow-[0_0_20px_rgba(28,217,255,0.1)] group-hover/cta:border-brand-3/50 group-hover/cta:shadow-[0_0_30px_rgba(28,217,255,0.2)] transition-all duration-500 scale-90 lg:scale-100"
           >
              <div className="w-2 h-2 rounded-full bg-brand-3 animate-pulse" />
              <span className="text-[9px] lg:text-[10px] font-black text-white/90 uppercase tracking-[0.4em] group-hover/cta:text-brand-3 transition-colors">
                View more at <span className="text-brand-3">www.tideraider.com</span>
              </span>
           </a>
        </div>

        {/* Seamless Minimal Footer */}
        <footer className="mt-auto flex items-center justify-between border-t border-white/5 pt-4 shrink-0 overflow-hidden opacity-40 group">
           <div className="flex items-center gap-6 font-primary text-primary">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
              <span className="text-[7px] font-black text-gray-600 uppercase tracking-[0.2em] group-hover:text-gray-400 transition-colors">Logic: ON</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
              <span className="text-[7px] font-black text-gray-600 uppercase tracking-[0.2em] group-hover:text-gray-400 transition-colors">Relay: ACTIVE</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white/5 px-2 py-0.5 rounded border border-white/5 font-primary">
            <Clock size={10} className="text-brand-3 opacity-50" />
            <span className="text-[6px] font-black text-gray-500 uppercase tracking-widest">S_INT: 5M</span>
          </div>
        </footer>
      </div>

      {/* Retro Arcade / VCR VFX Overlay (Stable Vanilla Three.js) */}
      <SentinelVFXOverlay />
    </div>
  );
}
