"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRaidLogsData } from "@/app/hooks/useRaidLogsData";
import { useBeaches } from "@/app/hooks/useBeaches";
import { FilterConfig } from "@/app/types/raidlogs";
import { Beach } from "@/app/types/beaches";
import RaidLogTable from "@/app/components/raid-logs/RaidLogTable";
import { RaidLogFilter } from "@/app/components/raid-logs/RaidLogFilter";
import { RaidLogForm } from "@/app/components/raid-logs/RaidLogForm";
import { ActiveFilterBadges } from "@/app/components/ActiveFiltersBadges";
import { LogVisibilityToggle } from "../LogVisibilityToggle";
import { Button } from "../ui/Button";
import { toast } from "sonner";
import { handleSignIn } from "@/app/lib/auth-utils";
import BeachDetailsModal from "@/app/components/BeachDetailsModal";
import { useRouter } from "next/navigation";
import { Session } from "next-auth";
import { LogEntry } from "@/app/types/raidlogs";

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
  initialFilters?: {
    isPrivate: boolean;
    userId?: string;
  };
}

interface MainContentProps {
  entries: LogEntry[];
  isLoading: boolean;
  error: Error | null;
  isPrivate: boolean;
  onBeachClick: (beachId: string) => void;
}

export function RaidLogsComponent({
  userId,
  initialFilters,
}: RaidLogsComponentProps) {
  // State
  const [filters, setFilters] = useState<FilterConfig>(defaultFilters);
  const [isPrivate, setIsPrivate] = useState(
    initialFilters?.isPrivate ?? false
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBeach, setSelectedBeach] = useState<Beach | null>(null);

  // Hooks
  const { data: session } = useSession();
  const { data: beaches = [] } = useBeaches();
  const {
    data: logEntriesData,
    isLoading,
    error,
  } = useRaidLogsData(filters, isPrivate, userId);
  const router = useRouter();

  // Handlers
  const handleFilterChange = useCallback(
    (newFilters: Partial<FilterConfig>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
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
    setIsPrivate((prev) => !prev);
    setFilters((prev) => ({ ...prev, isPrivate: !isPrivate }));
  }, [session, isPrivate]);

  const handleBeachClick = useCallback(
    (beachId: string) => {
      const beach = beaches.find((b) => b.id === beachId);
      if (beach) setSelectedBeach(beach);
    },
    [beaches]
  );

  return (
    <div className="bg-[var(--color-bg-secondary)] p-3 sm:p-4 md:p-6 lg:p-9 font-primary relative">
      <div className="max-w-[1800px] mx-auto px-0 md:px-4">
        {/* Header */}
        <Header
          isPrivate={isPrivate}
          onPrivateToggle={handlePrivateToggle}
          onFilterOpen={() => setIsFilterOpen(true)}
          onModalOpen={() => setIsModalOpen(true)}
          session={session}
        />

        {/* Filters */}
        <ActiveFilterBadges
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* Content */}
        <MainContent
          entries={logEntriesData?.entries || []}
          isLoading={isLoading}
          error={error}
          isPrivate={isPrivate}
          onBeachClick={handleBeachClick}
        />

        {/* Modals */}
        <RaidLogFilter
          beaches={beaches}
          selectedBeachIds={filters.beaches}
          selectedRegionIds={filters.regions}
          onFilterChange={handleFilterChange}
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
        />

        <RaidLogForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          beaches={beaches}
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
      </div>
    </div>
  );
}

// Separate components for better organization
interface HeaderProps {
  isPrivate: boolean;
  onPrivateToggle: () => void;
  onFilterOpen: () => void;
  onModalOpen: () => void;
  session: Session | null;
}

function Header({
  isPrivate,
  onPrivateToggle,
  onFilterOpen,
  onModalOpen,
  session,
}: HeaderProps) {
  return (
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
        <LogVisibilityToggle isPrivate={isPrivate} onChange={onPrivateToggle} />

        <Button
          size="sm"
          className="whitespace-nowrap hover:bg-gray-50 transition-colors"
          onClick={onModalOpen}
        >
          Post
        </Button>

        <Button
          onClick={onFilterOpen}
          variant="outline"
          size="sm"
          className="inline-flex hover:bg-gray-50 transition-colors"
        >
          Filter
        </Button>
      </div>
    </div>
  );
}

function MainContent({
  entries,
  isLoading,
  error,
  isPrivate,
  onBeachClick,
}: MainContentProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 md:py-12">
        <p className="text-gray-500 mb-4">
          {isLoading
            ? "Loading sessions..."
            : error
              ? "Error loading sessions"
              : "No matching sessions found"}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <RaidLogTable
        entries={entries}
        isSubscribed={false}
        isLoading={isLoading}
        showPrivateOnly={isPrivate}
        onBeachClick={onBeachClick}
      />
    </div>
  );
}
