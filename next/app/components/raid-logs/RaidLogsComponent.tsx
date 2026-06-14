"use client";

import { useState, useCallback, useEffect } from "react";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { useBeaches } from "@/app/hooks/useBeaches";
import { FilterConfig, LogEntry } from "@/app/types/raidlogs";
import { Beach as BeachType } from "@/app/types/beaches";
import { RaidLogFilter } from "@/app/components/raid-logs/RaidLogFilter";
import ActiveFilterBadges from "@/app/components/ActiveFiltersBadges";
import { toast } from "sonner";
import { handleSignIn } from "@/app/lib/auth-utils";
import BeachDetailsModal from "@/app/components/BeachDetailsModal";
import { useRouter } from "next/navigation";
import { useRaidLogFilters } from "@/app/hooks/useRaidLogsFilters";
import { Header } from "./RaidLogHeader";
import RaidLogTable from "./RaidLogTable";
import { useRaidLogs } from "@/app/hooks/useRaidLogs";
import { RandomLoader } from "../ui/random-loader";
import { useSubscriptionStatus } from "@/app/hooks/useSubscriptionStatus";
import { Lock, ShieldAlert } from "lucide-react";
import { Button } from "../ui/Button";

// Define the RaidLogsResponse interface
interface RaidLogsResponse {
  entries: LogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface RaidLogsComponentProps {
  userId?: string;
  initialFilters?: Partial<FilterConfig>;
  session?: {
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      isSubscribed?: boolean;
      hasActiveTrial?: boolean;
    } | null;
  } | null;
}

export function RaidLogsComponent({
  userId,
  initialFilters,
  session: sessionProp,
}: RaidLogsComponentProps) {
  const { filters, updateFilters, resetFilters } = useRaidLogFilters({
    initialFilters,
  });

  // State hooks
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedBeach, setSelectedBeach] = useState<BeachType | null>(null);

  // Data fetching hooks
  // Use session from props (fetched at page level) as primary source
  // Fall back to hook if not provided (for backwards compatibility)
  const { data: sessionFromHook, status: authStatus } = useBackendAuth();
  const { credits, isLoading: isSubscriptionLoading } = useSubscriptionStatus();
  
  // Normalize session type to match Header component expectation
  const session = sessionProp
    ? { user: sessionProp.user || null }
    : sessionFromHook
      ? { user: sessionFromHook.user || null }
      : null;
  const { data: beaches, isLoading: isBeachesLoading } = useBeaches();

  // Replace the direct useQuery with useRaidLogs
  const {
    data: raidLogsData,
    isLoading: isLogsLoading,
    error,
  } = useRaidLogs(filters, filters.isPrivate, userId) as {
    data: RaidLogsResponse | undefined;
    isLoading: boolean;
    error: Error | null;
  };

  const router = useRouter();

  // Add timeout for loading states
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  useEffect(() => {
    if (isBeachesLoading || isLogsLoading || isSubscriptionLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 15000); // 15 second timeout (reduced from 30)
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [isBeachesLoading, isLogsLoading, isSubscriptionLoading]);

  // Callbacks
  const handleFilterChange = useCallback(
    (newFilters: Partial<FilterConfig>) => {
      const updatedFilters = { ...newFilters };
      if (updatedFilters.beaches) {
        updatedFilters.beaches = updatedFilters.beaches.map((beach) =>
          typeof beach === "string" ? beach : beach.id
        );
      }
      updateFilters(updatedFilters);
    },
    [updateFilters]
  );

  const handlePrivateToggle = useCallback(() => {
    if (!session?.user) {
      toast.error("Please sign in to view private logs", {
        action: {
          label: "Sign In",
          onClick: () => handleSignIn(window.location.pathname),
        },
      });
      return;
    }
    updateFilters({ isPrivate: !filters.isPrivate });
  }, [session, filters.isPrivate, updateFilters]);

  const handleBeachClick = useCallback(
    (beachId: string) => {
      const beach = beaches?.find((b: BeachType) => b.id === beachId);
      if (beach) setSelectedBeach(beach);
    },
    [beaches]
  );

  const isCurrentlyLoading = isBeachesLoading || isLogsLoading || isSubscriptionLoading;
  const isGated = (!session?.user || authStatus === "unauthenticated") || ((credits ?? 0) < 30);

  return (
    <div id="raid-logs-container" className="min-h-0 py-4 font-primary relative pb-20">
      <div className="max-w-6xl mx-auto px-5 md:px-10">
        {isCurrentlyLoading && !loadingTimeout && (
          <RandomLoader isLoading={isCurrentlyLoading} />
        )}

        {isCurrentlyLoading && loadingTimeout && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">
              Loading is taking longer than expected.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[var(--color-tertiary)] text-white rounded"
            >
              Reload Page
            </button>
          </div>
        )}

        {error && !isLogsLoading && (
          <div className="text-red-500">
            Error loading data: {(error as Error).message}
          </div>
        )}

        {/* Lockout Gate for Unauthenticated Users */}
        {!isCurrentlyLoading && (!session?.user || authStatus === "unauthenticated") && (
          <div className="max-w-xl mx-auto my-12 text-center bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 p-10 shadow-sm">
             <div className="w-14 h-14 bg-gradient-to-br from-blue-700 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20 text-white">
                <Lock className="w-6 h-6 animate-pulse" />
             </div>
             <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Tactical Lockout</h2>
             <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 max-w-sm mx-auto">
               You must be authenticated to view strategic intelligence history and community surf logs.
             </p>
              <Button
                onClick={() => handleSignIn(window.location.pathname)}
                variant="action"
                className="w-full md:w-auto px-8 h-12"
              >
                Sign In to Authorize
              </Button>
          </div>
        )}

        {/* Lockout Gate for Authenticated but Insufficient Points */}
        {!isCurrentlyLoading && session?.user && authStatus === "authenticated" && (credits ?? 0) < 30 && (
          <div className="max-w-2xl mx-auto my-8 bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 p-8 md:p-12 shadow-sm">
             <div className="flex flex-col items-center text-center mb-8">
               <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20 text-white">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
               </div>
               <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Tactical Lockout: Insufficient Points</h2>
               <p className="text-sm text-slate-500 font-medium max-w-md leading-relaxed">
                 Accessing the surf logs archives requires a minimum of <span className="font-bold text-slate-900">30 intelligence points</span>. You currently have <span className="font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-100">{credits ?? 0} points</span>.
               </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200/50">
                {/* Free Community Path */}
                <div className="bg-white/80 rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                   <div>
                     <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">1. Community (Free)</h3>
                     <ul className="space-y-3 mb-6">
                        <li className="flex items-start gap-2.5 text-xs text-slate-600">
                           <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                           <span>Log a Surf Break (+30 Points)</span>
                        </li>
                        <li className="flex items-start gap-2.5 text-xs text-slate-600">
                           <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                           <span>Recruit Friend to Squad (+30 Points)</span>
                        </li>
                     </ul>
                   </div>
                   <div className="flex flex-col gap-2">
                     <button
                       onClick={() => router.push("/raidlogs/new")}
                       className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold uppercase tracking-widest text-[9px] transition-all active:scale-[0.98]"
                     >
                       Log Surf Session
                     </button>
                     <button
                       onClick={() => router.push("/pricing#affiliate")}
                       className="w-full h-10 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-bold uppercase tracking-widest text-[9px] transition-all active:scale-[0.98]"
                     >
                       Get Recruit Link
                     </button>
                   </div>
                </div>

                {/* Paid Instantly Path */}
                <div className="bg-white/80 rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                   <div>
                     <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">2. Strategic Access (Paid)</h3>
                     <ul className="space-y-3 mb-6">
                        <li className="flex items-start gap-2.5 text-xs text-slate-600">
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                           <span>Refill points instantly (R100 for 100 Credits)</span>
                        </li>
                        <li className="flex items-start gap-2.5 text-xs text-slate-600">
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                           <span>Subscribe for unlimited forecasting tools</span>
                        </li>
                     </ul>
                   </div>
                   <button
                     onClick={() => router.push("/pricing")}
                     className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold uppercase tracking-widest text-[9px] transition-all active:scale-[0.98]"
                   >
                     Upgrade or Buy Credits
                   </button>
                </div>
             </div>
          </div>
        )}

        {!isCurrentlyLoading && !error && raidLogsData && !isGated && (
          <>
            <Header
              isPrivate={filters.isPrivate}
              onPrivateToggle={handlePrivateToggle}
              onFilterOpen={() => setIsFilterOpen(true)}
              session={session}
            />

            <ActiveFilterBadges
              filters={filters}
              onFilterChange={handleFilterChange}
              beaches={beaches}
            />

            {/* Add pagination info if needed */}
            <div className="text-sm text-gray-500 mb-4">
              {raidLogsData.totalPages > 1 &&
                ` (Page ${raidLogsData.page} of ${raidLogsData.totalPages})`}
            </div>

            {!raidLogsData.entries.length ? (
              <div className="text-center py-8 md:py-12">
                <p className="text-gray-500">No matching sessions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <RaidLogTable
                  entries={raidLogsData.entries}
                  beaches={beaches || []}
                  isSubscribed={!!session?.user?.isSubscribed}
                  isLoading={isLogsLoading}
                  showPrivateOnly={filters.isPrivate}
                  onBeachClick={handleBeachClick}
                  session={session}
                />
              </div>
            )}

            <RaidLogFilter
              selectedRegionIds={filters.regions}
              selectedBeachIds={filters.beaches as string[]}
              selectedMinRating={filters.minRating}
              onFilterChange={handleFilterChange}
              onReset={resetFilters}
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
            />

            {selectedBeach && (
              <BeachDetailsModal
                beach={selectedBeach}
                isOpen={true}
                onClose={() => setSelectedBeach(null)}
                isSubscribed={!!session?.user?.isSubscribed}
                onSubscribe={() => router.push("/pricing")}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
