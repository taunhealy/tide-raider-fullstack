"use client";

import RaidLogTable from "@/app/components/raid-logs/RaidLogTable";
import { RaidLogFilter } from "@/app/components/raid-logs/RaidLogFilter";
import { RaidLogForm } from "@/app/components/raid-logs/RaidLogForm";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState, useCallback, useMemo } from "react";
import { LogVisibilityToggle } from "@/app/components/LogVisibilityToggle";
import { Button } from "@/app/components/ui/Button";
import type { Beach } from "@/app/types/beaches";
import { toast } from "sonner";
import { handleSignIn } from "@/app/lib/auth-utils";
import BeachDetailsModal from "@/app/components/BeachDetailsModal";
import { useBeaches } from "@/app/hooks/useBeaches";
import { X } from "lucide-react";
import { useActiveFilters } from "@/app/hooks/useActiveFilters";
import { ActiveFilterBadges } from "@/app/components/ActiveFiltersBadges";
import type { FilterConfig } from "@/app/types/raidlogs";

const defaultFilters: FilterConfig = {
  beaches: [],
  regions: [],
  countries: [],
  minRating: null,
  dateRange: { start: "", end: "" },
  isPrivate: false,
};

interface RaidLogsComponentProps {
  userId?: string;
  initialFilters?: { isPrivate: boolean; userId?: string };
}

export const RaidLogsComponent: React.FC<RaidLogsComponentProps> = ({
  userId,
  initialFilters,
}) => {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterConfig>(defaultFilters);
  const [isPrivate, setIsPrivate] = useState(
    initialFilters?.isPrivate ?? false
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBeach, setSelectedBeach] = useState<Beach | null>(null);
  const { data: beaches = [], isLoading: isLoadingBeaches } = useBeaches();

  const handleFilterChange = useCallback(
    (newFilters: Partial<FilterConfig>) => {
      // Ensure beaches are stored as IDs
      const processedFilters = {
        ...newFilters,
        beachIds: newFilters.beachIds
          ?.map((beach: Beach | string) => {
            if (typeof beach === "string") return beach;
            if (typeof beach === "object" && beach !== null) return beach.id;
            return "";
          })
          .filter(Boolean),
      };

      setFilters((prev) => ({ ...prev, ...processedFilters }));

      // Update URL params
      const params = new URLSearchParams(searchParams);

      // Update each filter type in the URL
      Object.entries(processedFilters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            params.set(key, value.join(","));
          } else {
            params.delete(key);
          }
        } else if (typeof value === "number" && value > 0) {
          params.set(key, value.toString());
        } else {
          params.delete(key);
        }
      });

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const handlePrivateToggle = () => {
    if (!session?.user) {
      toast.error("Please sign in to view private logs", {
        action: {
          label: "Sign In",
          onClick: () => handleSignIn(window.location.pathname),
        },
      });
      return;
    }
    setIsPrivate((prev) => !prev);
    setFilters((prev) => ({ ...prev, isPrivate: !isPrivate }));
  };

  const {
    data: logEntriesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["raidLogs", filters, isPrivate, userId],
    queryFn: async () => {
      const params = new URLSearchParams();

      // Add user filter if userId is provided
      if (userId) {
        params.set("userId", userId);
      }

      // Add all filter parameters
      if (filters.beaches?.length) {
        params.set("beaches", filters.beaches.join(","));
      }
      if (filters.regions?.length) {
        params.set("regions", filters.regions.join(","));
      }
      if (filters.countries?.length) {
        params.set("countries", filters.countries.join(","));
      }
      if (filters.minRating && filters.minRating > 0) {
        params.set("minRating", filters.minRating.toString());
      }
      if (isPrivate) {
        params.set("isPrivate", "true");
      }

      console.log("Fetching raid logs with params:", params.toString());
      const res = await fetch(`/api/raid-logs?${params.toString()}`);

      // Add debug logging
      console.log("Response status:", res.status);
      console.log(
        "Response headers:",
        Object.fromEntries(res.headers.entries())
      );

      // Check content type
      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        // If not JSON, get the text to see what we received
        const text = await res.text();
        console.error("Received non-JSON response:", text);
        throw new Error(`Expected JSON but received ${contentType}`);
      }

      if (res.status === 401) {
        toast.error("Please sign in to view private logs", {
          action: {
            label: "Sign In",
            onClick: () => handleSignIn(window.location.pathname),
          },
        });
        return { entries: [] };
      }

      if (res.status === 403) {
        toast.error("You can only view your own private logs");
        return { entries: [] };
      }

      if (!res.ok) {
        throw new Error("Failed to fetch logs");
      }

      const data = await res.json();
      return { entries: data };
    },
  });

  const filteredEntries = useMemo(() => {
    if (error) {
      console.error("Raid logs fetch error:", error);
      return [];
    }

    return logEntriesData?.entries || [];
  }, [logEntriesData?.entries, error]);

  const handleBeachClick = useCallback(
    (beachId: string) => {
      const beach = beaches.find((b) => b.id === beachId);
      if (beach) setSelectedBeach(beach);
    },
    [beaches]
  );

  const handleSubscribe = useCallback(() => {
    router.push("/pricing"); // Redirect to pricing page
  }, [router]);

  console.log("Passing to RaidLogTable:", {
    entries: filteredEntries,
    isLoading,
    showPrivateOnly: isPrivate,
  });

  const { hasActiveFilters, removeBeachFilter, removeRegionFilter } =
    useActiveFilters(filters, handleFilterChange);

  return (
    <div className="bg-[var(--color-bg-secondary)] p-3 sm:p-4 md:p-6 lg:p-9 font-primary relative">
      <div className="max-w-[1800px] mx-auto px-0 md:px-4">
        <div className="bg-white rounded-lg shadow-sm p-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 w-full">
            <div className="w-full border-b border-gray-200 pb-3 sm:border-0 sm:pb-0">
              <h2 className="text-xl sm:text-2xl font-semibold font-primary">
                Raid Sessions
              </h2>
            </div>
            <div
              className="flex flex-row
            gap-3 md:gap-4 items-center w-full md:w-auto"
            >
              <LogVisibilityToggle
                isPrivate={isPrivate}
                onChange={handlePrivateToggle}
              />

              <Button
                size="sm"
                className="whitespace-nowrap hover:bg-gray-50 transition-colors"
                onClick={() => {
                  if (!session?.user) {
                    handleSignIn("/raidlogs/new");
                  } else {
                    setIsModalOpen(true);
                  }
                }}
              >
                Post
              </Button>

              <Button
                onClick={() => setIsFilterOpen(true)}
                variant="outline"
                size="sm"
                className="inline-flex hover:bg-gray-50 transition-colors"
              >
                Filter
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          <ActiveFilterBadges
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <p className="text-gray-500 mb-4">
                {isLoading
                  ? "Loading sessions..."
                  : error
                    ? "Error loading sessions"
                    : "No matching sessions found"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <RaidLogTable
                entries={filteredEntries}
                isSubscribed={false}
                isLoading={isLoading}
                showPrivateOnly={isPrivate}
                onBeachClick={handleBeachClick}
              />
            </div>
          )}
        </div>
      </div>

      <RaidLogFilter
        beaches={beaches}
        selectedBeaches={filters.beaches}
        onFilterChange={handleFilterChange}
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />
      <RaidLogForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          console.log("Closing modal");
        }}
        beaches={beaches}
      />

      {selectedBeach && (
        <BeachDetailsModal
          beach={selectedBeach}
          isOpen={!!selectedBeach}
          onClose={() => setSelectedBeach(null)}
          isSubscribed={!!session?.user?.isSubscribed}
          onSubscribe={handleSubscribe}
        />
      )}
    </div>
  );
};
