"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { BlueStarRating } from "@/app/lib/scoreDisplayBlueStars";
import { cn } from "@/app/lib/utils";
import { Radio, Music, Wind, Droplets, Clock, Camera, User, Volume2, VolumeX } from "lucide-react";
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
  { id: "muizenberg-beach", name: "Muizenberg", region: "Western Cape", regionId: "western-cape" },
  { id: "witsand", name: "Witsands", region: "Western Cape", regionId: "western-cape" },
  { id: "jeffreys-bay", name: "Jeffreys Bay", region: "Eastern Cape", regionId: "eastern-cape" }
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
}

const StreamCard = ({ beachId, name, region, regionId, beachScores, forecastData, recentLogs, isLoading }: StreamCardProps) => {
  const score = beachScores?.[beachId]?.score ?? 0;
  const f = forecastData?.[regionId] || {};
  const displayScore = Math.min(score, 10);
  const scoreInfo = getScoreDisplay(displayScore);

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
    <div className="relative overflow-hidden bg-gray-950/60 backdrop-blur-xl border border-white/10 rounded-[1.5rem] transition-all h-full min-h-0 flex shadow-2xl font-primary">
      <div className="absolute -top-12 -left-12 w-24 h-24 bg-brand-3/5 blur-[60px] rounded-full" />
      
      {/* Left Data Column */}
      <div className="flex-1 p-4 lg:p-5 flex flex-col relative z-10 border-r border-white/5 min-w-0">
        <div className="flex items-center justify-between mb-2 shrink-0">
           <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full shrink-0">
              <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest text-red-500">Live</span>
           </div>
        </div>

        <div className="shrink-0 mb-2">
           <h2 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight leading-tight truncate">{name}</h2>
           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mt-1 opacity-80">{region}</p>
        </div>

        <div className="flex items-center gap-2 mb-4 shrink-0">
          <BlueStarRating score={displayScore} size={14} />
          <div className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full flex items-center gap-1.5">
            <span className="text-[10px]">{scoreInfo.emoji}</span>
            <span className="text-[8px] font-black text-white/40 uppercase truncate max-w-[70px]">{scoreInfo.description || scoreInfo.label}</span>
          </div>
        </div>

        {/* Compact Forecast Metrics */}
        <div className="mt-auto flex flex-col gap-2 shrink-0">
             <div className="bg-white/5 px-2 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
                <Wind size={14} className="text-brand-3 shrink-0" />
                <div className="flex items-baseline gap-1.5 overflow-hidden">
                   <span className="text-sm font-black text-white leading-none">{f?.windSpeed?.toFixed(0) || "--"}</span>
                   <span className="text-[7px] text-gray-500 font-bold uppercase tracking-widest leading-none">kts</span>
                   <span className="text-[9px] text-white font-black uppercase">{f?.windDirectionCardinal || getCardinal(f?.windDirection || 0)}</span>
                </div>
             </div>

             <div className="bg-blue-500/5 px-2 py-1.5 rounded-lg border border-blue-500/10 flex items-center gap-2">
                <Droplets size={14} className="text-blue-400 shrink-0" />
                <div className="flex items-baseline gap-1.5 overflow-hidden">
                   <span className="text-sm font-black text-white leading-none">{f?.swellHeight?.toFixed(1) || "--"}</span>
                   <span className="text-[7px] text-gray-400 font-bold uppercase">m</span>
                   <span className="text-[9px] text-white font-black uppercase">{f?.swellDirectionCardinal || getCardinal(f?.swellDirection || 0)}</span>
                </div>
             </div>
        </div>
      </div>

      {/* Right Log Column */}
      <div className="flex-[1.4] bg-white/5 relative overflow-hidden flex flex-col shrink-0 min-w-0 group/log">
         {latestLog ? (
           <>
             <div className="absolute inset-0 z-0">
                {logThumbnail ? (
                   <Image 
                    src={logThumbnail} 
                    alt="Surf Log" 
                    fill 
                    className="object-cover opacity-40 group-hover/log:scale-110 transition-transform duration-1000" 
                    unoptimized={logThumbnail.includes('http')}
                   />
                ) : (
                  <div className="w-full h-full bg-gray-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-transparent to-gray-950/90" />
             </div>
             <div className="relative z-10 p-3 lg:p-4 flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-start mb-auto">
                   <div className="px-1.5 py-0.5 bg-brand-3/20 backdrop-blur-md rounded-lg border border-brand-3/30 flex items-center gap-1.5 shrink-0">
                      <Camera size={9} className="text-brand-3" />
                      <span className="text-[8px] font-black text-white uppercase tracking-[0.1em]">Log Entry</span>
                   </div>
                   <div className="flex flex-col items-end gap-1">
                      <div className="text-[9px] font-black text-white px-1.5 py-0.5 bg-black/40 backdrop-blur-md rounded-lg whitespace-nowrap drop-shadow-sm border border-white/5">
                         {formatDistanceToNow(new Date(latestLog.createdAt || latestLog.date || new Date()))} ago
                      </div>
                      <div className="text-[7px] font-bold text-gray-400 uppercase tracking-widest px-1">
                         {format(new Date(latestLog.createdAt || latestLog.date || new Date()), "MMM dd")}
                      </div>
                   </div>
                </div>
                
                <div className="mt-auto pointer-events-none flex flex-col items-start">
                   <div className="inline-flex items-center gap-2 mb-2 p-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/5 w-fit overflow-hidden">
                      <div className="w-6 h-6 rounded-full bg-gray-800 border border-brand-3/30 overflow-hidden shrink-0">
                         {(!latestLog.isAnonymous && (latestLog.user?.image || latestLog.surferImage)) ? (
                           <Image src={latestLog.user?.image || latestLog.surferImage} alt="User" width={24} height={24} />
                         ) : (
                           <User size={12} className="text-brand-3 h-full w-full p-1" />
                         )}
                      </div>
                      <div className="min-w-0 pr-1">
                         <p className="text-[9px] font-black text-white truncate leading-none uppercase tracking-wide">
                            {latestLog.isAnonymous ? "Anonymous Raider" : (latestLog.user?.name || latestLog.surferName || "Verified Raider")}
                         </p>
                         <p className="text-[8px] font-bold text-gray-400 mt-1 whitespace-nowrap leading-tight">
                           {intelSummary}
                         </p>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-1 px-0.5 w-full">
                       <div className="py-1 bg-brand-3/5 border border-brand-3/20 rounded-md text-center backdrop-blur-sm">
                          <p className="text-[8px] lg:text-[9px] font-black text-white/90">
                            {(latestLog.forecast?.windSpeed || latestLog.windSpeed)?.toFixed(0) || "--"}
                            <span className="text-[6px] ml-0.5 opacity-50 uppercase font-black tracking-tighter">kts</span>
                            <span className="text-[7px] ml-1 text-brand-3 font-black">{latestLog.forecast?.windDirectionCardinal || getCardinal(latestLog.forecast?.windDirection || 0)}</span>
                          </p>
                       </div>
                       <div className="py-1 bg-blue-500/5 border border-blue-500/20 rounded-md text-center backdrop-blur-sm">
                          <p className="text-[8px] lg:text-[9px] font-black text-white/90">
                            {(latestLog.forecast?.swellHeight || latestLog.swellHeight)?.toFixed(1) || "--"}
                            <span className="text-[6px] ml-0.5 opacity-50 uppercase font-black tracking-tighter">m</span>
                            <span className="text-[7px] ml-1 text-blue-400 font-black">{latestLog.forecast?.swellDirectionCardinal || getCardinal(latestLog.forecast?.swellDirection || 0)}</span>
                          </p>
                       </div>
                   </div>
                </div>
             </div>
           </>
         ) : (
           <div className="flex-1 flex flex-col items-center justify-center p-3 text-center opacity-50">
              <Radio size={20} className="text-cyan-500 mb-3 animate-pulse" />
              <span className="text-[10px] lg:text-xs font-black tracking-[0.05em] text-gray-400 group-hover:text-gray-300 transition-colors">
                 Awaiting your log entry...
              </span>
           </div>
         )}
      </div>

      {(isLoading || !beachScores) && (
        <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-20">
           <div className="w-6 h-6 border-2 border-brand-3 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default function LiveStreamDashboard() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
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

  const { data: broadcastData, isLoading } = useQuery({
    queryKey: ["broadcastSync"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const safeFetch = async (url: string) => {
        try {
          const r = await fetch(url);
          if (!r.ok) return {};
          return await r.json();
        } catch (e) {
          console.error(`Fetch error: ${url}`, e);
          return {};
        }
      };

      const [rWC, rEC, fWC, fEC, logs] = await Promise.all([
        safeFetch(`/api/filtered-beaches?regionId=western-cape&date=${today}&source=WINDFINDER`),
        safeFetch(`/api/filtered-beaches?regionId=eastern-cape&date=${today}&source=WINDFINDER`),
        safeFetch(`/api/forecast?regionId=western-cape&date=${today}`),
        safeFetch(`/api/forecast?regionId=eastern-cape&date=${today}`),
        safeFetch(`/api/raid-logs?limit=100`)
      ]);

      const logEntries = Array.isArray(logs.entries) ? logs.entries : Array.isArray(logs) ? logs : [];
      
      return {
        beachScores: { ...(rWC.scores || {}), ...(rEC.scores || {}) },
        forecasts: { "western-cape": fWC, "eastern-cape": fEC },
        recentLogs: logEntries.sort((a: any, b: any) => 
          new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
        )
      };
    },
    refetchInterval: 1000 * 60 * 5
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
                      {isMuted ? "Waiting for play" : (playlist[currentTrackIndex] || "Scanned: 0 tracks")}
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

        {/* Scalable 2x2 Grid */}
        <div className="grid grid-cols-2 gap-4 lg:gap-6 flex-1 min-h-0 overflow-hidden mb-6">
          {TARGET_BEACHES.map((beach) => (
            <div key={beach.id} className="min-h-0">
               <StreamCard 
                beachId={beach.id}
                name={beach.name}
                region={beach.region}
                regionId={beach.regionId}
                beachScores={broadcastData?.beachScores}
                forecastData={broadcastData?.forecasts}
                recentLogs={broadcastData?.recentLogs}
                isLoading={isLoading}
              />
            </div>
          ))}
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
    </div>
  );
}
