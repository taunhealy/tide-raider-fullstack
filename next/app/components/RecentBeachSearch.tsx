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
  labelClassName?: string;
  vertical?: boolean;
}

export default function RecentBeachSearch({
  className,
  onBeachSelect,
  selectedBeachId,
  labelClassName,
  vertical = false,
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
    <div ref={containerRef} className={cn("flex flex-col gap-3", className)}>
      {labelClassName !== "hidden" && (
        <label className={cn("text-[9px] font-black uppercase tracking-[0.2em] text-white/20 px-1", labelClassName)}>
          Target History
        </label>
      )}
      <div className={cn("flex gap-2", vertical ? "flex-col" : "flex-wrap items-center")}>
        {uniqueBeaches.map((search: UserSearch) => {
          const isSelected = selectedBeachId === search.beach?.id;
          return (
            <button
              key={search.id}
              onClick={() => handleButtonClick(search)}
              className={cn(
                "group flex items-center gap-2.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                vertical ? "w-full" : "",
                isSelected
                  ? "bg-white border-white text-black shadow-lg shadow-white/5"
                  : "bg-white/5 border-white/5 text-white/30 hover:border-white/10 hover:bg-white/10 hover:text-white"
              )}
            >
              <MapPin className={cn("w-3 h-3", isSelected ? "text-black" : "text-white/20 group-hover:text-indigo-400")} />
              {search.beach?.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

