"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { MapPin, Play, Lock, Sparkles, Wind, Droplets, ArrowUpRight } from "lucide-react";
import { BlueStarRating } from "@/app/lib/scoreDisplayBlueStars";
import { getVideoThumbnail } from "@/app/lib/videoUtils";
import type { LogEntry } from "@/app/types/raidlogs";
import { cn } from "@/app/lib/utils";

interface LatestIntelCardProps {
  entry: LogEntry;
  isGated?: boolean;
}

export function LatestIntelCard({ entry, isGated = false }: LatestIntelCardProps) {
  if (!entry) return null;

  const date = entry.date ? new Date(entry.date) : new Date();
  const formattedDate = !isNaN(date.getTime()) ? format(date, "MMM d, yyyy") : "Recently";
  
  // Extract forecast data if available
  const forecast = entry.forecast;

  return (
    <div className="group relative bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-500 hover:shadow-xl hover:border-brand-3/30 hover:-translate-y-1">
      {/* Media Section */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
        {entry.videoUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={getVideoThumbnail(entry.videoUrl, entry.videoPlatform || "youtube")}
              alt="Intel Video"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, 400px"
            />
            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center transition-opacity duration-500 group-hover:bg-slate-900/20">
              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-2xl transform transition-transform duration-500 group-hover:scale-110">
                <Play className="w-5 h-5 text-brand-3 fill-brand-3 ml-0.5" />
              </div>
            </div>
          </div>
        ) : entry.imageUrl ? (
          <Image
            src={entry.imageUrl}
            alt="Intel Photo"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50">
             <Sparkles className="w-12 h-12 text-slate-200" />
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-sm border border-white/20">
              Latest Intel
            </span>
            {entry.beach?.isHiddenGem && (
              <span className="inline-flex items-center px-2 py-1 rounded-lg bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg">
                <Lock className="w-2.5 h-2.5 mr-1.5" />
                Hidden Gem
              </span>
            )}
          </div>
          
          <div className="bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl shadow-lg border border-white/20 text-right">
             <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Session Rating</div>
             <BlueStarRating score={entry.surferRating || 0} size={14} />
          </div>
        </div>

        {/* Bottom Location Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-xl font-black text-white truncate mb-1">
                {isGated ? "TOP SECRET BREAK" : (entry.beach?.name || entry.beachName)}
              </h3>
              <div className="flex items-center gap-2 text-slate-200/80 text-xs font-medium">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate">{entry.region?.name || "Unknown Region"}</span>
              </div>
            </div>
            <div className="flex-shrink-0 text-white/60 text-[10px] font-black uppercase tracking-widest pb-1">
              {formattedDate}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section - Conditions */}
      <div className="p-6 space-y-6 bg-white">
        {forecast ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 group/item transition-colors hover:bg-white hover:border-brand-3/20">
               <div className="flex items-center gap-2 mb-2">
                 <Wind className="w-3.5 h-3.5 text-slate-400" />
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Wind Data</span>
               </div>
               <div className="flex items-baseline gap-1">
                 <span className="text-lg font-black text-slate-900">{Math.round(forecast.windSpeed)}</span>
                 <span className="text-[10px] font-bold text-slate-400">kts</span>
                 <span className="ml-auto text-[10px] font-black text-brand-3 px-1.5 py-0.5 bg-brand-3/5 rounded-md">
                   {forecast.windDirection}°
                 </span>
               </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 group/item transition-colors hover:bg-white hover:border-brand-3/20">
               <div className="flex items-center gap-2 mb-2">
                 <Droplets className="w-3.5 h-3.5 text-slate-400" />
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Swell Stats</span>
               </div>
               <div className="flex items-baseline gap-1">
                 <span className="text-lg font-black text-slate-900">{forecast.swellHeight.toFixed(1)}</span>
                 <span className="text-[10px] font-bold text-slate-400">m</span>
                 <span className="ml-1 text-sm font-bold text-slate-600">@ {Math.round(forecast.swellPeriod)}s</span>
               </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium">Conditions not recorded for this log</p>
          </div>
        )}

        {/* Comments Snippet */}
        {entry.comments && typeof entry.comments === 'string' && (
          <div className="relative">
            <p className="text-sm text-slate-600 font-medium font-primary leading-relaxed line-clamp-2 italic">
              "{entry.comments}"
            </p>
          </div>
        )}

        {/* Action Button */}
        <Link 
          href={isGated ? "/pricing" : `/raidlogs/${entry.id}`}
          className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 hover:bg-brand-3 hover:shadow-lg hover:shadow-brand-3/20 active:scale-[0.98]"
        >
          View Full Report
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
