"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { WaveAnimation } from "../WaveAnimation";
import { BlueStarRating } from "@/app/lib/scoreDisplayBlueStars";
import { cn } from "@/app/lib/utils";
import { Radio, Music, Wind, Droplets, Clock } from "lucide-react";
import { format } from "date-fns";
import { getScoreDisplay } from "@/app/lib/scoreDisplay";

// Target Beach IDs
const TARGET_BEACHES = [
  { id: "long-beach", name: "Long Beach", region: "Western Cape" },
  { id: "muizenberg-beach", name: "Muizenberg", region: "Western Cape" },
  { id: "witsand", name: "Witsands", region: "Western Cape" },
  { id: "jeffreys-bay", name: "Jeffreys Bay", region: "Eastern Cape" }
];

interface StreamCardProps {
  beachId: string;
  name: string;
  region: string;
  data: any;
  isLoading: boolean;
}

const StreamCard = ({ beachId, name, region, data, isLoading }: StreamCardProps) => {
  const score = data?.scores?.[beachId]?.score ?? 0;
  const conditions = data?.scores?.[beachId]?.beach?.beachDailyScores?.[0]?.conditions || {}; 
  const scoreInfo = getScoreDisplay(score);

  return (
    <div className="relative group overflow-hidden bg-gray-950/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 transition-all duration-500 hover:border-brand-3/50 shadow-2xl">
      {/* Glow Effect */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-3/10 blur-[100px] rounded-full group-hover:bg-brand-3/20 transition-all duration-700" />
      
      <div className="flex flex-col h-full justify-between relative z-10">
        <div>
          <div className="flex items-center justify-between mb-2">
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-3/80">
              Live Intelligence
            </span>
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Live</span>
            </div>
          </div>

          <h2 className="text-4xl font-black text-white tracking-tight mb-1">{name}</h2>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">{region}</p>

          <div className="flex items-center gap-4 mb-8">
            <BlueStarRating score={score} size={24} />
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
              <span className="text-2xl">{scoreInfo.emoji}</span>
            </div>
          </div>
        </div>

        {/* Forecast Metrics */}
        <div className="grid grid-cols-2 gap-6 bg-white/5 p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-3/10 flex items-center justify-center text-brand-3 border border-brand-3/20">
              <Wind size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Wind</p>
              <p className="text-xl font-bold text-white leading-none mt-1">
                {conditions?.windSpeed?.toFixed(0) || "--"} 
                <span className="text-xs ml-1 text-gray-400">kts</span>
                {conditions?.windDirection && <span className="text-xs ml-2 text-gray-500">{conditions.windDirection}°</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Droplets size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Swell</p>
              <p className="text-xl font-bold text-white leading-none mt-1">
                {conditions?.swellHeight?.toFixed(1) || "--"}
                <span className="text-xs ml-1 text-gray-400">m</span>
                <span className="text-sm ml-2 text-gray-500">@{conditions?.swellPeriod || "--"}s</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {(isLoading || !data) && (
        <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm flex items-center justify-center z-20 rounded-[2.5rem]">
          <div className="flex flex-col items-center gap-3">
             <div className="w-8 h-8 border-2 border-brand-3 border-t-transparent rounded-full animate-spin" />
             <span className="text-[10px] font-black uppercase tracking-widest text-brand-3">Syncing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function LiveStreamDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch data for the beaches
  const { data: wcData, isLoading: wcLoading } = useQuery({
    queryKey: ["streamData", "western-cape"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/beach-ratings/historical?regionId=western-cape&date=${today}`);
      return res.json();
    },
    refetchInterval: 1000 * 60 * 5 // 5 minutes
  });

  const { data: ecData, isLoading: ecLoading } = useQuery({
    queryKey: ["streamData", "eastern-cape"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/beach-ratings/historical?regionId=eastern-cape&date=${today}`);
      return res.json();
    },
    refetchInterval: 1000 * 60 * 5 // 5 minutes
  });

  return (
    <div className="fixed inset-0 bg-gray-950 overflow-hidden font-primary selection:bg-brand-3 selection:text-white">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 opacity-40 grayscale contrast-125">
        <WaveAnimation />
      </div>

      {/* Overlay Layer for CRT/VHS feel */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />
      
      {/* Content Layer */}
      <div className="relative z-20 h-full flex flex-col p-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-brand-3 rounded-2xl flex items-center justify-center text-gray-950 shadow-[0_0_30px_rgba(28,217,255,0.4)]">
              <Radio size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-widest uppercase leading-none">
                Tide Raider <span className="text-brand-3">Live</span>
              </h1>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mt-2">
                Unified Surf Intelligence Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-12 text-right">
             <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-brand-3 uppercase tracking-widest mb-1 flex items-center gap-2">
                <Music size={12} className="animate-bounce" /> Streaming Audio
              </span>
              <span className="text-sm font-bold text-white tracking-widest">Lo-Fi Surf Intel Beats</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Current Sync</span>
              <span className="text-2xl font-black text-white tracking-tighter tabular-nums">
                {format(currentTime, "HH:mm:ss")}
              </span>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-2 gap-8 flex-1">
          {TARGET_BEACHES.map((beach) => (
            <StreamCard 
              key={beach.id}
              beachId={beach.id}
              name={beach.name}
              region={beach.region}
              data={beach.region === "Western Cape" ? wcData : ecData}
              isLoading={beach.region === "Western Cape" ? wcLoading : ecLoading}
            />
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-12 flex items-center justify-between border-t border-white/5 pt-8">
           <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Data Source A: Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Data Source B: Active</span>
            </div>
             <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Data Source C: Active</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
            <Clock size={14} className="text-brand-3" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Next Refresh: 5m</span>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .fixed::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            rgba(18, 16, 16, 0) 50%,
            rgba(0, 0, 0, 0.1) 50%
          ), linear-gradient(
            90deg,
            rgba(255, 0, 0, 0.02),
            rgba(0, 255, 0, 0.01),
            rgba(0, 0, 255, 0.02)
          );
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
          z-index: 100;
        }
      `}</style>
    </div>
  );
}
