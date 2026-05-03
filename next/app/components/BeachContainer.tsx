"use client";

import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import { useSubscriptionStatus } from "@/app/hooks/useSubscriptionStatus";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";
import { useFilteredBeaches } from "@/app/hooks/useFilteredBeaches";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/components/ui/Button";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { cn } from "@/app/lib/utils";

// Components
import StickyForecastWidget from "./StickyForecastWidget";
import RightSidebar from "./raid/RightSidebar";
import LeftSidebar from "./raid/LeftSidebar";
import BeachCard from "./BeachCard";
import BeachHeaderControls from "./raid/BeachHeaderControls";
import SidebarSkeleton from "./SidebarSkeleton";
import LoadingIndicator from "./LoadingIndicator";
import EmptyState from "./EmptyState";
import BeachCardSkeleton from "./skeletons/BeachCardSkeleton";
import api from "@/app/lib/api-client";
import type { LogEntry } from "@/app/types/raidlogs";

import type { Beach, BeachInitialData } from "@/app/types/beaches";

import { LocationFilter } from "../types/filters";

// Remove the getBeachForecastData helper function

interface BeachContainerProps {
  initialData: BeachInitialData | null;
}

// Distance helper using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

import AIReportModal from "./beach/AIReportModal";

export default function BeachContainer({ initialData }: BeachContainerProps) {
  const { filters, updateFilter, selectRegion } = useBeachFilters();
  const searchParams = useSearchParams();
  
  // Sorting and Location state - Proximity active by default (45km)
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Deep Link Modal State
  const [deepLinkedBeach, setDeepLinkedBeach] = useState<Beach | null>(null);
  const [isDeepLinkModalOpen, setIsDeepLinkModalOpen] = useState(false);

  const { data, isLoading, isFetching } = useFilteredBeaches({
    initialData: maxDistance !== null ? null : initialData, // Don't use initial regional data in proximity mode
    enabled: true,
    ignoreRegion: maxDistance !== null || (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("beachId"))
  });
  const { data: authData } = useBackendAuth();
  const { isPremium, isSubscribed, isLoading: isSubLoading } = useSubscriptionStatus();
  const user = authData?.user;
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const hasAutoRedirected = useRef(false);

  // Handle Intelligence Deep Links
  useEffect(() => {
    const beachId = searchParams.get("beachId");
    const reportId = searchParams.get("report");

    if (beachId && reportId && data?.beaches) {
      const targetBeach = data.beaches.filter(Boolean).find((b: Beach) => 
        b?.id === beachId || 
        b?.name?.toLowerCase() === beachId.toLowerCase() ||
        b?.id?.toLowerCase() === beachId.toLowerCase() ||
        b?.name?.toLowerCase().includes(beachId.toLowerCase())
      );
      
      if (targetBeach && !isDeepLinkModalOpen) {
        setDeepLinkedBeach(targetBeach);
        setIsDeepLinkModalOpen(true);
      }
    }
  }, [searchParams, data?.beaches]);

  // Request location on mount for proximity filtering
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location on mount:", error);
          setIsLocating(false);
          // If proximity was active by default but location failed, we might want to disable it
          // OR just leave it as 100 but distance calculations won't happen.
        }
      );
    }
  }, []);

  const handleToggleProximityMode = () => {
    if (userLocation) {
      setMaxDistance(maxDistance === null ? 100 : null);
    } else {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setMaxDistance(500); // Default to 500km when enabled
          setIsLocating(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLocating(false);
          alert("Could not get your location. Please check browser permissions.");
        }
      );
    }
  };

  // Auto-redirect to last selected region if no regionId in URL
  const { data: recentSearches } = useQuery({
    queryKey: ["recentSearches"],
    queryFn: async () => {
      const res = await fetch("/api/user-searches?limit=1");
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60 * 5,
    enabled: !filters.regionId && !hasAutoRedirected.current, // Only fetch if no regionId and haven't redirected yet
  });

  // Auto-redirect to most recent region if no regionId in URL
  useEffect(() => {
    // Only redirect if:
    // 1. No regionId in URL
    // 2. We have recent searches
    // 3. We haven't already redirected
    // 4. We're on the /raid page
    if (
      !filters.regionId &&
      !hasAutoRedirected.current &&
      pathname === "/raid"
    ) {
      // If we have recent searches, use the most recent one
      if (recentSearches && recentSearches.length > 0) {
        const mostRecentSearch = recentSearches[0];
        if (mostRecentSearch?.region?.id) {
          // Construct region object from recent search data
          const selectedRegion = {
            id: mostRecentSearch.region.id,
            regionId: mostRecentSearch.region.id,
            name: mostRecentSearch.region.name,
            countryId: mostRecentSearch.region.country?.id || "",
            country: mostRecentSearch.region.country
              ? {
                  id: mostRecentSearch.region.country.id || "",
                  name: mostRecentSearch.region.country.name || "",
                  continentId: mostRecentSearch.region.country.continentId || "",
                }
              : undefined,
            continent: mostRecentSearch.region.continent || "",
          };

          // Use selectRegion logic but combine with timeSlot
          const params = new URLSearchParams(window.location.search);
          const formattedRegionId = selectedRegion.id.toLowerCase().replace(/\s+/g, "-");
          params.set("regionId", formattedRegionId);
          
          if (!params.get("timeSlot")) {
            params.set("timeSlot", "MORNING");
          }
          
          router.push(`${pathname}?${params.toString()}`, { scroll: false });
          hasAutoRedirected.current = true;
        }
      }
    }
  }, [filters.regionId, recentSearches, pathname, router]);

  // Track region searches when regionId changes
  const { mutate: trackSearch } = useMutation({
    mutationFn: async (regionId: string) => {
      const res = await fetch("/api/user-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regionId }),
      });
      if (!res.ok) throw new Error("Failed to track search");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate recent searches to refresh the list
      queryClient.invalidateQueries({ queryKey: ["recentSearches"] });
    },
  });

  // Track search when regionId changes
  useEffect(() => {
    if (filters.regionId) {
      trackSearch(filters.regionId.toLowerCase());
    }
  }, [filters.regionId, trackSearch]);

  // Add pagination state - initialize from URL if present
  const [currentPage, setCurrentPage] = useState(1);

  // Sync currentPage with URL on mount and handle URL changes
  useEffect(() => {
    const p = searchParams.get("page");
    if (p) {
      const pageNum = parseInt(p);
      if (!isNaN(pageNum) && pageNum !== currentPage) {
        setCurrentPage(pageNum);
      }
    } else if (currentPage !== 1) {
      // If no page in URL but state is not 1, we might have navigated back
      // Only reset if we're not explicitly changing it
    }
  }, [searchParams]);

  const itemsPerPage = 20;

  const beaches = data?.beaches || [];
  const beachScores = data?.scores || {};
  const forecast = (data?.forecast as any) ?? null;
  const totalCount = data?.totalCount || 0;

  // Fetch the latest log for this region to feature it at the top
  const { data: latestRegionLog, isLoading: isLoadingLatestLog } = useQuery({
    queryKey: ["latestLog", filters.regionId],
    queryFn: async () => {
      if (!filters.regionId) return null;
      const res = await api.getRaidLogs({ 
        regionId: filters.regionId, 
        limit: 1, 
        page: 1 
      });
      return res.entries?.[0] || null;
    },
    enabled: !!filters.regionId,
  });

  const handleRegionSelect = (regionId: LocationFilter["regionId"]) => {
    updateFilter("regionId", regionId || "");
    setCurrentPage(1);
    // queryClient.invalidateQueries is redundant as queryKey includes regionId
  };

  const sortedBeaches = useMemo(() => {
    if (!beaches) return [];
    
    let processedBeaches = (beaches || []).filter(Boolean).map(b => {
      const score = beachScores[b.id]?.score ?? 0;
      let distance = null;
      if (userLocation && b.coordinates?.lat && b.coordinates?.lng) {
        distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          b.coordinates.lat,
          b.coordinates.lng
        );
      }
      return { ...b, score, distance };
    });

    if (maxDistance !== null && userLocation) {
      processedBeaches = processedBeaches.filter(b => 
        b.distance !== null && b.distance <= maxDistance
      );
    }

    return processedBeaches.sort((a, b) => {
      const hasScoreA = a.id in beachScores;
      const hasScoreB = b.id in beachScores;

      if (hasScoreA && !hasScoreB) return -1;
      if (!hasScoreA && hasScoreB) return 1;

      return b.score - a.score;
    });
  }, [beaches, beachScores, maxDistance, userLocation]);

  const totalPages = Math.ceil(sortedBeaches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBeaches = sortedBeaches.slice(startIndex, endIndex);

  const paginationRange = useMemo(() => {
    const maxVisible = 7;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  }, [totalPages, currentPage]);

  // Reset to page 1 ONLY when tactical filters change, not when page changes
  const tacticalFiltersKey = useMemo(() => {
    const { ...tactical } = filters;
    return JSON.stringify({ tactical, maxDistance });
  }, [filters, maxDistance]);

  useEffect(() => {
    // Only reset if we're not already on page 1
    // And only if the URL doesn't already have a page parameter (to allow deep links)
    const urlPage = searchParams.get("page");
    if (!urlPage && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [tacticalFiltersKey]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    if (page >= 2 && !user) {
      const targetUrl = `${pathname}?page=${page}`;
      window.location.href = `/login?callbackUrl=${encodeURIComponent(targetUrl)}`;
      return;
    }
    
    // Update URL without a full page reload to maintain state
    const params = new URLSearchParams(window.location.search);
    if (page === 1) params.delete("page");
    else params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-[var(--color-bg-secondary)] pt-20 p-4 sm:pt-24 sm:p-6 lg:pt-28 lg:p-8 xl:pt-32 xl:p-12 mx-auto relative min-h-[calc(100vh-72px)] flex flex-col font-primary">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px] max-w-7xl mx-auto w-full">
        <Suspense fallback={<SidebarSkeleton />}>
          <LeftSidebar />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 sm:gap-6 lg:gap-[30px] xl:gap-[54px] flex-1">
          <main className="min-w-0 bg-[var(--color-bg-tan)] p-4 sm:p-6 lg:p-8 rounded-[2rem] border border-[var(--color-border-tan)] shadow-sm">
            <BeachHeaderControls
              onSearch={(value) => updateFilter("searchQuery", value)}
              onRegionSelect={handleRegionSelect}
              currentRegion={filters.regionId || ""}
              beaches={beaches}
              availableDates={data?.availableDates || []}
              maxDistance={maxDistance}
              onMaxDistanceChange={setMaxDistance}
              onToggleProximity={handleToggleProximityMode}
              isLocating={isLocating}
              isAuthenticated={!!user}
              isSubscribed={isPremium}
              forecast={forecast}
              hiddenGemCount={data?.hiddenGemCount}
              isLoading={isLoading || isFetching}
            />

            {isFetching && data && !isLoading && (
              <div className="text-xs text-gray-500 text-center py-2 font-primary">
                Refreshing data...
              </div>
            )}

            <div className="h-px bg-black/10 w-full mt-10" />

            <div className="grid grid-cols-1 gap-5 relative mt-10">
              {!filters.regionId || (isLoading && !data) ? (
                <div className="flex flex-col items-center justify-center py-12 min-h-[400px]">
                  <LoadingIndicator />
                  <p className="text-gray-600 font-primary mt-4 animate-pulse">
                    {!filters.regionId ? "Initializing your region..." : "Loading surf breaks and forecast data..."}
                  </p>
                </div>
              ) : (
                <div className="space-y-10">

                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">All Breaks in Region</h3>
                       <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{sortedBeaches.length} Breaks</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-5">
                      {sortedBeaches.length === 0 ? (
                        <EmptyState message="No breaks found in this region, change filters?" />
                      ) : (
                        currentBeaches.filter(Boolean).map((beach: Beach) => {
                          const score = beachScores[beach.id]?.score ?? 0;
                          const beachForecastData = forecast;
                          const hasScore = beach.id in beachScores;
                          const scoreValue = hasScore
                            ? score !== null && score !== undefined
                              ? Number(score)
                              : null
                            : null;

                          return (
                            <BeachCard
                              key={beach.id}
                              beach={beach}
                              score={scoreValue}
                              forecastData={beachForecastData}
                              isLoading={!hasScore && isLoading && !data}
                              distance={(beach as any).distance}
                              scoreInsights={Array.isArray(beachScores[beach.id]?.beach?.beachDailyScores?.[0]?.conditions) ? beachScores[beach.id].beach.beachDailyScores[0].conditions : []}
                            />
                          );
                        })
                      )}
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex flex-col items-center gap-4 mt-8 mb-4">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="flex items-center gap-2 rounded-xl border-gray-200 hover:border-brand-3 hover:text-brand-3 transition-all h-10 px-4 group"
                        >
                          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Previous</span>
                        </Button>

                        <div className="flex items-center gap-1.5 p-1 bg-white/40 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-sm">
                          {paginationRange.map((page, index) => {
                            if (page === "...") {
                              return (
                                <span key={`ellipsis-${index}`} className="w-8 text-center text-gray-400 font-black">
                                  ...
                                </span>
                              );
                            }

                            const isActive = currentPage === page;
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(Number(page))}
                                className={cn(
                                  "w-9 h-9 flex items-center justify-center rounded-xl text-[10px] font-black tracking-widest transition-all relative overflow-hidden",
                                  isActive
                                    ? "bg-brand-3 text-white shadow-lg shadow-brand-3/30 scale-105 z-10"
                                    : "text-gray-500 hover:bg-white hover:shadow-sm"
                                )}
                              >
                                {page}
                                {Number(page) >= 2 && !user && (
                                  <Lock className="w-2 h-2 absolute top-1 right-1 opacity-60" />
                                )}
                                {isActive && (
                                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-2 rounded-xl border-gray-200 hover:border-brand-3 hover:text-brand-3 transition-all h-10 px-4 group"
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest">Next</span>
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </Button>
                      </div>

                      {/* Page Info Badge */}
                      <div className="inline-flex items-center px-4 py-1.5 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-full shadow-sm">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Showing <span className="text-gray-900">{startIndex + 1}-{Math.min(endIndex, sortedBeaches.length)}</span> of <span className="text-gray-900">{sortedBeaches.length}</span> beaches
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
          <RightSidebar />
        </div>
      </div>

      <StickyForecastWidget />

      {deepLinkedBeach && (
        <AIReportModal
          isOpen={isDeepLinkModalOpen}
          onClose={() => {
            setIsDeepLinkModalOpen(false);
            // Optional: Clear URL params to prevent re-opening on refresh
            const params = new URLSearchParams(searchParams);
            params.delete("report");
            params.delete("beachId");
            router.replace(`${pathname}?${params}`, { scroll: false });
          }}
          beach={deepLinkedBeach}
          reportId={searchParams.get("report") || undefined}
          date={new Date().toISOString()}
        />
      )}
    </div>
  );
}
