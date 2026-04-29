"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/app/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import gsap from "gsap";
import type { UserSearch } from "@/app/types/regions";
import type { Beach } from "@/app/types/beaches";
import { MapPin } from "lucide-react";
import { useSearchTracking } from "@/app/hooks/useSearchTracking";


interface RecentBeachSearchProps {
  className?: string;
  onBeachSelect: (beach: Beach) => void;
  selectedBeachId?: string;
}

export default function RecentBeachSearch({
  className,
  onBeachSelect,
  selectedBeachId,
}: RecentBeachSearchProps) {
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const {
    data: recentSearches,
    isLoading,
  } = useQuery({
    queryKey: ["recentBeachSearches"],
    queryFn: async () => {
      const res = await fetch("/api/user-searches?limit=10");
      if (!res.ok) return [];
      const data = await res.json();
      // Filter only for searches that have a beach
      return Array.isArray(data) ? data.filter((s: UserSearch) => !!s.beach) : [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const { trackBeach } = useSearchTracking();

  const handleButtonClick = async (search: UserSearch) => {
    if (!search.beach) return;
    setLoadingId(search.id);
    try {
      onBeachSelect(search.beach);
      trackBeach(search.beach.id);
    } finally {
      setTimeout(() => setLoadingId(null), 500);
    }
  };


  useEffect(() => {
    if (containerRef.current && recentSearches?.length) {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 5 },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          stagger: 0.05,
          ease: "power2.out",
        }
      );
    }
  }, [recentSearches]);

  if (isLoading && !recentSearches) return null;
  if (!recentSearches?.length) return null;

  // Take only the 3 most recent unique beaches
  const uniqueBeaches = recentSearches.reduce((acc: UserSearch[], current: UserSearch) => {
    if (!acc.find(s => s.beach?.id === current.beach?.id)) {
      acc.push(current);
    }
    return acc;
  }, []).slice(0, 3);

  return (
    <div ref={containerRef} className={cn("flex flex-col gap-2 mt-4", className)}>
      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 px-1">Target History</label>
      <div className="flex flex-wrap gap-2">
        {uniqueBeaches.map((search: UserSearch) => {
          const isSelected = selectedBeachId === search.beach?.id;
          return (
            <button
              key={search.id}
              onClick={() => handleButtonClick(search)}
              className={cn(
                "group flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border shadow-sm",
                isSelected
                  ? "bg-slate-900 border-slate-800 text-white shadow-lg shadow-slate-200"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <MapPin className={cn("w-3 h-3", isSelected ? "text-white" : "text-slate-400 group-hover:text-indigo-500")} />
              {search.beach?.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

