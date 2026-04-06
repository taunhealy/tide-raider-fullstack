"use client";

import { useState, useEffect } from "react";
import { 
  getWindEmoji, 
  getSwellEmoji, 
  degreesToCardinal 
} from "@/app/lib/forecastUtils";
import { Star } from "lucide-react";

interface BeachScore {
  source: string;
  sourceName: string;
  score: number;
  starRating: number;
}

interface BlogForecastWidgetProps {
  beachName: string;
}

export default function BlogForecastWidget({ beachName }: BlogForecastWidgetProps) {
  const [data, setData] = useState<{
    beach: any;
    scores: BeachScore[];
    forecast: any;
    loading: boolean;
    error: string | null;
  }>({
    beach: null,
    scores: [],
    forecast: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Fetch Beach Data to get Beach ID and Region ID
        const beachRes = await fetch(`/api/beaches/${encodeURIComponent(beachName)}`);
        if (!beachRes.ok) throw new Error("Beach not found");
        const beachData = await beachRes.json();
        const beach = beachData.beach;

        // 2. Fetch Scores for today
        const today = new Date().toISOString().split("T")[0];
        const scoresRes = await fetch(`/api/beach-ratings/beach-scores?beachId=${beach.id}&date=${today}`);
        const scoresData = await scoresRes.json();
        const scores = scoresData.scores || [];

        // 3. Fetch Forecast for today
        const forecastRes = await fetch(`/api/forecast?regionId=${beach.regionId}&forecastDate=${today}`);
        const forecast = await forecastRes.json();

        setData({
          beach,
          scores,
          forecast,
          loading: false,
          error: null,
        });
      } catch (err: any) {
        setData(prev => ({ ...prev, loading: false, error: err.message }));
      }
    }

    fetchData();
  }, [beachName]);

  if (data.loading) {
    return (
      <div className="w-full h-32 bg-gray-50/50 animate-pulse rounded-2xl border border-gray-100 flex items-center justify-center p-6 mb-8 mt-12">
        <p className="text-gray-400 text-sm font-primary">Fetching live conditions for {beachName}...</p>
      </div>
    );
  }

  if (data.error || !data.beach) {
    return null;
  }

  const { forecast, scores } = data;
  const hasForecast = forecast && Object.keys(forecast).length > 0;
  
  const avgStarRating = scores.length > 0
    ? Math.round(scores.reduce((acc, s) => acc + s.starRating, 0) / scores.length)
    : 3;

  const scoreText = avgStarRating >= 4 ? "GOOD" : avgStarRating >= 3 ? "FAIR" : "POOR";
  const scoreColor = avgStarRating >= 4 ? "bg-emerald-500 shadow-emerald-100" : avgStarRating >= 3 ? "bg-amber-500 shadow-amber-100" : "bg-rose-500 shadow-rose-100";

  return (
    <div className="my-12 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex flex-col md:flex-row">
        {/* Left Side: Rating & Name */}
        <div className="p-6 bg-blue-50/30 md:w-1/3 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-gray-100">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 font-primary">Live Spot Guide</span>
          <div className="flex gap-0.5 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-4 h-4 ${i < avgStarRating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} 
              />
            ))}
          </div>
          <h4 className="text-xl font-bold text-gray-900 font-primary leading-tight line-clamp-1">{data.beach.name}</h4>
          <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">{data.beach.location}</p>
        </div>

        {/* Right Side: Quick Stats */}
        <div className="p-6 md:w-2/3">
          {hasForecast ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <span className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-tighter">Swell</span>
                <div className="flex items-center">
                  <span className="text-sm mr-1 font-primary">{getSwellEmoji(forecast?.swellHeight || 0)}</span>
                  <span className="font-bold text-gray-900 text-sm whitespace-nowrap">{forecast?.swellHeight}m</span>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <span className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-tighter">Period</span>
                <div className="flex items-center">
                  <span className="text-sm mr-1">⏱️</span>
                  <span className="font-bold text-gray-900 text-sm">{forecast?.swellPeriod}s</span>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <span className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-tighter">Wind</span>
                <div className="flex items-center">
                  <span className="text-sm mr-1 font-primary">{getWindEmoji(forecast?.windSpeed || 0)}</span>
                  <span className="font-bold text-gray-900 text-sm">{forecast?.windSpeed}kt</span>
                </div>
              </div>
              <div className={`flex flex-col items-center justify-center p-3 rounded-xl text-white shadow-lg ${scoreColor}`}>
                <span className="text-[10px] uppercase font-bold text-white/80 mb-1 tracking-tighter">Rating</span>
                <span className="font-bold text-xs">{scoreText}</span>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl p-4">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Real-time data pending</span>
                <p className="text-[9px] text-gray-300">Background analytics currently deploying for this spot.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="px-6 py-2 bg-gray-50/50 flex justify-between items-center border-t border-gray-100">
        <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Tide Raider Real-Time Analytics</span>
        <button className="text-[9px] font-bold text-blue-600 uppercase tracking-tighter hover:underline">Full Analytics Dashboard →</button>
      </div>
    </div>
  );
}
