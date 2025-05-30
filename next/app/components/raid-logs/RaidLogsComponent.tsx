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
import Link from "next/link";
import type { Beach } from "@/app/types/beaches";
import { toast } from "sonner";
import { handleSignIn } from "@/app/lib/auth-utils";
import BeachDetailsModal from "@/app/components/BeachDetailsModal";

// Add filter config types similar to QuestLogs
type FilterConfig = {
  beaches: string[];
  regions: string[];
  countries: string[];
  minRating: number;
  dateRange: { start: string; end: string };
  isPrivate: boolean;
};

const defaultFilters: FilterConfig = {
  beaches: [],
  regions: [],
  countries: [],
  minRating: 0,
  dateRange: { start: "", end: "" },
  isPrivate: false,
};

interface RaidLogsComponentProps {
  beaches: Beach[];
  userId?: string;
  initialFilters?: { isPrivate: boolean; userId?: string };
}

export const RaidLogsComponent: React.FC<RaidLogsComponentProps> = ({
  beaches,
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

  const handleFilterChange = useCallback(
    (newFilters: Partial<FilterConfig>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));

      // Update URL params
      const params = new URLSearchParams(searchParams);

      // Update each filter type in the URL
      Object.entries(newFilters).forEach(([key, value]) => {
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
      if (filters.beaches.length) {
        params.set("beaches", filters.beaches.join(","));
      }
      if (filters.regions.length) {
        params.set("regions", filters.regions.join(","));
      }
      if (filters.countries.length) {
        params.set("countries", filters.countries.join(","));
      }
      if (filters.minRating > 0) {
        params.set("minRating", filters.minRating.toString());
      }
      if (isPrivate) {
        params.set("isPrivate", "true");
      }

      console.log("Fetching raid logs with params:", params.toString());
      const res = await fetch(`/api/raid-logs?${params.toString()}`);
      console.log("Raid logs API response status:", res.status);

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
      console.log("Raid logs API response data:", data);
      return { entries: data };
    },
  });

  const filteredEntries = useMemo(() => {
    if (error) {
      console.error("Raid logs fetch error:", error);
      return [];
    }
    console.log("logEntriesData:", logEntriesData);
    console.log("logEntriesData?.entries:", logEntriesData?.entries);
    console.log("Number of entries:", logEntriesData?.entries?.length || 0);
    return logEntriesData?.entries || [];
  }, [logEntriesData?.entries, error]);

  const handleBeachClick = useCallback(
    (beachName: string) => {
      const beach = beaches.find((b) => b.name === beachName);
      if (beach) {
        setSelectedBeach(beach);
      }
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
            <div className="flex flex-wrap gap-3 md:gap-4 items-center w-full md:w-full">
              <LogVisibilityToggle
                isPrivate={isPrivate}
                onChange={handlePrivateToggle}
              />

              <Button
                size="sm"
                className="whitespace-nowrap"
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
                className="hidden sm:inline-flex"
              >
                Filter
              </Button>
            </div>
          </div>

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
                isSubscribed={session?.user?.isSubscribed}
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
