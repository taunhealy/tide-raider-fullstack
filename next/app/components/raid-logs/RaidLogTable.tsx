"use client";

import { QuestLogTableColumn, LogEntry } from "@/app/types/raidlogs";

import { format } from "date-fns";
import {
  Star,
  Pencil,
  X,
  Bell,
  Image as ImageIcon,
  MessageCircle,
  Eye,
  Video as VideoIcon,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import {
  getWindEmoji,
  getSwellEmoji,
  degreesToCardinal,
} from "@/app/lib/forecastUtils";
import Image from "next/image";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import BeachDetailsModal from "@/app/components/BeachDetailsModal";
import { useBeach } from "@/app/context/BeachContext";
import type { Beach } from "@/app/types/beaches";

import { toast } from "sonner";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { useSubscriptionDetails } from "@/app/hooks/useSubscriptionDetails";
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { LayoutGrid, Table as TableIcon } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/app/components/ui/pagination";
import { useContentGating } from "@/app/lib/gateUtils";
import { getVideoThumbnail } from "@/app/lib/videoUtils";
import { VideoThumbnail } from "./VideoThumbnail";
import { MediaModal } from "@/app/components/raid-logs/MediaModal";
import { ImageGallery } from "@/app/components/raid-logs/ImageGallery";
import api from "@/app/lib/api-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import { BlueStarRating } from "@/app/lib/scoreDisplayBlueStars";

interface QuestTableProps {
  entries: LogEntry[];
  columns?: QuestLogTableColumn[];
  isSubscribed?: boolean;
  isTrialing?: boolean;
  isLoading?: boolean;
  showPrivateOnly?: boolean;
  onFilterChange?: () => void;
  onBeachClick: (beachName: string) => void;
  nationality?: string;
  session?:
    | {
        user: {
          id?: string;
          email?: string | null;
          name?: string | null;
          image?: string | null;
          isSubscribed?: boolean;
          hasActiveTrial?: boolean;
        } | null;
      }
    | null
    | undefined;
}

interface LogEntryDisplayProps {
  entry: {
    user?: {
      id: string;
      nationality: string | null;
      name: string;
    } | null;
    surferName?: string | null;
    userId?: string | null;
  };
  isAnonymous: boolean;
}

function LogEntryDisplay({ entry, isAnonymous }: LogEntryDisplayProps) {
  // Use userId from entry first, fall back to user?.id if available
  const userId = entry.userId || entry.user?.id;

  // Show Anonymous if explicitly marked as anonymous OR if there's no userId
  // This matches the logic in RaidLogDetails.tsx
  const shouldShowAnonymous = isAnonymous || !userId;

  // Prioritize the user's current name from the User relation
  const displayName = shouldShowAnonymous
    ? "Anonymous"
    : (entry.user?.name ?? entry.surferName ?? "Anonymous"); // Use user's profile name first, fall back to surferName

  return (
    <div className="flex items-center gap-2">
      <Link
        href={shouldShowAnonymous ? "#" : `/profile/${userId}`}
        className={cn(
          "font-primary text-sm hover:text-brand-3 transition-colors",
          shouldShowAnonymous ? "text-gray-900 cursor-default" : "text-gray-900"
        )}
      >
        {displayName}
      </Link>
      {entry.user?.nationality && (
        <span className="text-xs text-gray-500">{entry.user.nationality}</span>
      )}
    </div>
  );
}

function ForecastInfo({
  forecast,
  entry,
  hasAccess,
}: {
  forecast:
    | {
        windSpeed?: number;
        windDirection?: number;
        swellHeight?: number;
        swellPeriod?: number;
        swellDirection?: number;
      }
    | null
    | undefined;
  entry: LogEntry;
  hasAccess: boolean;
}) {
  const router = useRouter();

  // Debug logging - always log to help diagnose
  useEffect(() => {
    console.log(
      `[ForecastInfo] Entry ${entry.id} (${entry.beachName || "Unknown"}):`,
      {
        forecast,
        hasForecast: !!forecast,
        windSpeed: forecast?.windSpeed,
        windSpeedType: typeof forecast?.windSpeed,
        windDirection: forecast?.windDirection,
        swellHeight: forecast?.swellHeight,
        swellHeightType: typeof forecast?.swellHeight,
        swellPeriod: forecast?.swellPeriod,
        swellDirection: forecast?.swellDirection,
      }
    );
  }, [entry.id, forecast, entry.beachName]);

  const handleAlertClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasAccess) {
      router.push("/pricing");
      return;
    }

    // Pass log ID as query parameter instead of localStorage
    router.push(`/alerts/new?logId=${entry.id}`);
  };

  const getBellTooltipText = () => {
    if (!hasAccess) return "Subscribe to create alerts";
    if (entry.hasAlert) {
      return entry.isMyAlert
        ? "You have an active alert for these conditions"
        : "Another user has an alert for these conditions";
    }
    return "Create alert for these conditions";
  };

  // Only show if forecast exists and has at least one valid value
  if (!forecast) {
    return <span className="text-gray-400 text-xs">No conditions</span>;
  }

  // Check if forecast has any valid numeric values (including 0)
  const hasWind =
    typeof forecast.windSpeed === "number" && forecast.windSpeed !== null;
  const hasWindDirection =
    typeof forecast.windDirection === "number" &&
    forecast.windDirection !== null;
  const hasSwell =
    typeof forecast.swellHeight === "number" && forecast.swellHeight !== null;
  const hasSwellPeriod =
    typeof forecast.swellPeriod === "number" && forecast.swellPeriod !== null;
  const hasSwellDirection =
    typeof forecast.swellDirection === "number" &&
    forecast.swellDirection !== null;

  // If no valid values exist, show "No conditions"
  if (
    !hasWind &&
    !hasWindDirection &&
    !hasSwell &&
    !hasSwellPeriod &&
    !hasSwellDirection
  ) {
    return <span className="text-gray-400 text-xs">No conditions</span>;
  }

  return (
    <div className="space-y-1 text-xs font-primary">
      {(hasWind || hasWindDirection) && (
        <p className="text-gray-700">
          {hasWind && forecast.windSpeed !== undefined && (
            <>
              {getWindEmoji(forecast.windSpeed)} {forecast.windSpeed}kts
            </>
          )}
          {hasWindDirection && forecast.windDirection !== undefined && (
            <span className="ml-1 text-gray-600">
              {degreesToCardinal(forecast.windDirection)}
            </span>
          )}
        </p>
      )}
      {(hasSwell || hasSwellPeriod || hasSwellDirection) && (
        <p className="text-gray-700">
          {hasSwell && forecast.swellHeight !== undefined && (
            <>
              {getSwellEmoji(forecast.swellHeight)} {forecast.swellHeight}m
            </>
          )}
          {hasSwellPeriod && forecast.swellPeriod !== undefined && (
            <span className="ml-1 text-gray-600">
              {hasSwell ? " @ " : ""}
              {forecast.swellPeriod}s
            </span>
          )}
          {hasSwellDirection && forecast.swellDirection !== undefined && (
            <span className="ml-1 text-gray-600">
              {degreesToCardinal(forecast.swellDirection)}
            </span>
          )}
        </p>
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="w-full">
      {/* Mobile View Skeleton */}
      <div className="md:hidden space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 shadow p-4 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className="w-4 h-4 bg-gray-200 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-36 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View Skeleton */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 shadow">
        <div className="min-h-[500px]">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {DEFAULT_COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  {DEFAULT_COLUMNS.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap"
                    >
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const normalizeLogEntry = (entry: LogEntry): LogEntry => {
  return {
    ...entry,
    date: format(new Date(entry.date), "yyyy-MM-dd"),
    isPrivate: entry.isPrivate ?? false,
    isAnonymous: entry.isAnonymous ?? false,
    hasAlert: entry.alerts?.length > 0,
    isMyAlert: false,
    alertId: entry.alerts?.[0]?.id ?? "",
  };
};

export const DEFAULT_COLUMNS: QuestLogTableColumn[] = [
  {
    key: "date",
    label: "Date",
  },
  {
    key: "beachName",
    label: "Beach",
  },
  {
    key: "region",
    label: "Region",
  },
  {
    key: "surferName",
    label: "Logger",
  },
  {
    key: "surferRating",
    label: "Rating",
  },
  {
    key: "forecastSummary",
    label: "Conditions",
  },
  {
    key: "comments",
    label: "Comments",
  },
  {
    key: "imageUrl",
    label: "Photo",
  },
];

// Move useComments hook definition outside of the component
const useComments = (logEntryId: string) => {
  return useQuery({
    queryKey: ["comments", logEntryId],
    queryFn: async () => {
      const response = await fetch(
        `/api/comments?entityId=${logEntryId}&entityType=LogEntry`
      );
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
    enabled: !!logEntryId,
  });
};

// Create a separate component for the comments cell
function CommentsCell({
  entry,
  hasAccess,
}: {
  entry: LogEntry;
  hasAccess: boolean;
}) {
  const { data: comments, isLoading } = useComments(entry.id);
  const router = useRouter();

  const handleMessageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasAccess) {
      router.push("/pricing");
      return;
    }
    router.push(`/raidlogs/${entry.id}`);
  };

  const latestComment =
    comments?.length > 0
      ? [...comments].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
      : null;

  return (
    <div className="flex items-center justify-between w-full gap-2">
      <div className="flex-1 truncate">{entry.comments}</div>
      {isLoading ? (
        <div className="w-4 h-4 rounded-full bg-gray-200 animate-pulse" />
      ) : (
        latestComment && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <MessageCircle
                  onClick={handleMessageClick}
                  className="w-4 h-4 shrink-0 text-brand-3 cursor-pointer"
                />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px]">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Latest comment (
                    {format(new Date(latestComment.createdAt), "MMM d, yyyy")}):
                  </p>
                  <p className="text-sm text-gray-600 break-words">
                    {latestComment.text}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      )}
    </div>
  );
}

export default function RaidLogTable({
  entries,
  columns = DEFAULT_COLUMNS,
  isSubscribed = false,
  isTrialing = false,
  isLoading = false,
  showPrivateOnly = false,
  onFilterChange,
  onBeachClick,
  nationality,
}: QuestTableProps) {
  const { beaches } = useBeach();
  const {
    isGated,
    isLoggedOut,
    isLoggedOutGated,
    renderGatedContent,
    getGatedEmoji,
    getGatedTooltip,
    getBlurClass,
  } = useContentGating();
  const [selectedBeach, setSelectedBeach] = useState<Beach | null>(null);
  const [selectedLogForAlert, setSelectedLogForAlert] =
    useState<LogEntry | null>(null);
  const [selectedAlertForEdit, setSelectedAlertForEdit] = useState<
    string | undefined
  >();
  const { data: session } = useBackendAuth();
  const queryClient = useQueryClient();
  const { data: subscriptionDetails } = useSubscriptionDetails();
  // Allow all logged-in users access to logs (premium features are now free)
  const hasAccess =
    !!session?.user ||
    isSubscribed ||
    isTrialing ||
    subscriptionDetails?.hasActiveTrial;

  // Set default view mode based on screen size
  const [viewMode, setViewMode] = useLocalStorage<"table" | "card">(
    "raidLogViewMode",
    typeof window !== "undefined" && window.innerWidth >= 768 ? "table" : "card"
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3x3 grid

  const normalizedEntries = useMemo(() => {
    return entries.map(normalizeLogEntry);
  }, [entries]);

  const router = useRouter();

  // Add state for the entry to be deleted
  const [entryToDelete, setEntryToDelete] = useState<LogEntry | null>(null);

  // Update the delete mutation with better error handling
  const deleteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      return api.deleteRaidLog(entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raidLogs"] });
      toast.success("Log entry deleted successfully");
      setEntryToDelete(null);
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete log entry"
      );
      setEntryToDelete(null);
    },
  });

  // Load user alerts from localStorage
  const userAlerts = useMemo(() => {
    if (typeof window !== "undefined") {
      const savedAlerts = localStorage.getItem("userAlerts");
      return savedAlerts ? JSON.parse(savedAlerts) : [];
    }
    return [];
  }, []); // Only run once on component mount

  // Edit handler
  const handleEdit = (entry: LogEntry) => {
    router.push(`/raidlogs/${entry.id}/edit`);
  };

  // Update the handleDelete function
  const handleDelete = (entry: LogEntry) => {
    setEntryToDelete(entry);
  };

  // Create new alert handler
  const handleAlertClick = async (entry: LogEntry) => {
    if (entry.isMyAlert) {
      if (!entry.alertId) {
        toast.error("Alert ID is missing");
        return;
      }
      router.push(`/alerts/${entry.alertId}`);
    } else {
      // Pass log ID as query parameter
      router.push(`/alerts/new?logId=${entry.id}`);
    }
  };

  const handleAlertSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["alerts"] });
    toast.success("Alert saved successfully");
    setSelectedAlertForEdit(undefined);
    setSelectedLogForAlert(null);
  };

  const filteredEntries = useMemo(() => {
    console.log("Filtering entries:", normalizedEntries.length);

    // For public viewing (no session)
    if (!session) {
      const publicEntries = normalizedEntries.filter(
        (entry) => !entry.isPrivate
      );
      console.log("Public entries:", publicEntries.length);
      return publicEntries;
    }

    // For authenticated users
    if (showPrivateOnly) {
      const privateEntries = normalizedEntries.filter(
        (entry) => entry.isPrivate && entry.userId === session.user?.id
      );
      console.log("Private entries:", privateEntries.length);
      return privateEntries;
    }

    // Show all public entries and user's private entries
    const visibleEntries = normalizedEntries.filter(
      (entry) => !entry.isPrivate || entry.userId === session.user?.id
    );

    return visibleEntries;
  }, [normalizedEntries, session, showPrivateOnly]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);

  // Get current page items
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEntries.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEntries, currentPage, itemsPerPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of the component
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  console.log("[RaidLogTable] Filtered entries:", filteredEntries);

  const actionColumn = {
    key: "actions",
    header: "",
    accessor: "actions",
    cell: ({ row }: { row: any }) => {
      const entry = row.original;
      // Check ownership using userId (more reliable than email)
      // entry.userId is the Prisma user ID, session.user.id is the authenticated user's ID
      const isOwner =
        session?.user?.id && entry.userId && session.user.id === entry.userId;

      return (
        <div className="flex gap-2">
          {isOwner && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(entry);
                }}
                className="text-gray-500 hover:text-[var(--color-text-primary)]"
                aria-label="Edit raid log"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(entry);
                }}
                className="text-gray-500 hover:text-red-600"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <span className="loading-spinner" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </button>
            </>
          )}
        </div>
      );
    },
  };

  const columnsWithAction = [...columns, actionColumn];

  useEffect(() => {
    console.log("RaidLogTable received entries:", entries?.length);

    if (entries && entries.length > 0) {
      console.log("First entry:", entries[0]);
      console.log(
        "Entries with alerts:",
        entries.filter((e) => e.hasAlert).length
      );
    }
  }, [entries]);

  // Update the image rendering in both mobile and desktop views
  const renderImage = (
    entry: LogEntry,
    size: { width: number; height: number }
  ) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={`/raidlogs/${entry.id}`}
            className={`relative w-${size.width} h-${size.height} cursor-pointer hover:opacity-80 transition-opacity`}
          >
            <div className="relative w-full h-full">
              {entry.imageUrl && (
                <Image
                  src={entry.imageUrl}
                  alt="Session photo"
                  fill={true}
                  className={cn(
                    "object-cover rounded-md",
                    !hasAccess && "blur-xl"
                  )}
                />
              )}
              {!hasAccess && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <span className="text-2xl z-10">💩</span>
                </div>
              )}
            </div>
          </Link>
        </TooltipTrigger>
        {!hasAccess && (
          <TooltipContent>
            <p>💩 Subscribe to view details</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );

  // State to track if we're on mobile
  const [isMobile, setIsMobile] = useState(false); // Re-added the isMobile state

  // Check if we're on mobile when component mounts and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile(); // Set initial value
    window.addEventListener("resize", checkIfMobile);

    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Add the DeleteConfirmationDialog to the main component return
  const DeleteConfirmationDialog = () => {
    if (!entryToDelete) return null;

    const formattedDate = format(new Date(entryToDelete.date), "MMM d, yyyy");
    const beachName =
      entryToDelete.beach?.name || entryToDelete.beachName || "Unknown beach";

    return (
      <AlertDialog
        open={!!entryToDelete}
        onOpenChange={(open) => !open && setEntryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Surf Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your surf session at {beachName}{" "}
              on {formattedDate}?
              <br />
              <br />
              <span className="font-medium text-red-600">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (entryToDelete.id) {
                  deleteMutation.mutate(entryToDelete.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <span className="loading-spinner" />
                  Deleting...
                </div>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <>
      <div className="w-full">
        <div className="mb-4 flex justify-end">
          <Tabs
            value={viewMode}
            defaultValue={viewMode}
            onValueChange={(value) => {
              // Only allow changing to table view if not on mobile
              if (value === "table" && isMobile) {
                return;
              }
              setViewMode(value as "table" | "card");
            }}
          >
            <TabsList className="grid w-[180px] grid-cols-2">
              <TabsTrigger
                value="card"
                className="flex items-center gap-2"
                title="Card View"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="text-sm font-primary">Cards</span>
              </TabsTrigger>
              <TabsTrigger
                value="table"
                className={cn(
                  "flex items-center gap-2",
                  isMobile && "opacity-50 pointer-events-none"
                )}
                title="Table View"
              >
                <TableIcon className="h-4 w-4" />
                <span className="text-sm font-primary">Table</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Card View - Grid Layout */}
        {viewMode === "card" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-full">
              {currentItems.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 space-y-4 h-full flex flex-col"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-grow">
                      <Link
                        href={`/raidlogs/${entry.id}`}
                        className="block hover:opacity-75 transition-opacity"
                      >
                        <h3 className="text-base font-medium font-primary text-gray-900 mb-1">
                          {entry.beach?.name || "No beach specified"}
                        </h3>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500 font-primary">
                            📖 {format(new Date(entry.date), "MMM d, yyyy")}
                          </p>
                          <p className="text-sm text-gray-500 font-primary">
                            📍 {entry.region?.name ?? "No region"}
                          </p>
                        </div>
                      </Link>
                    </div>
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAlertClick(entry);
                              }}
                              className={cn(
                                "p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors",
                                "text-gray-500 hover:text-[var(--color-alert-icon-rating)]"
                              )}
                              aria-label="Set alert for this log entry"
                            >
                              <Bell
                                className={cn(
                                  "w-5 h-5 cursor-pointer",
                                  entry.hasAlert
                                    ? entry.isMyAlert
                                      ? "text-[var(--color-alert-icon-rating)] fill-[var(--color-alert-icon-rating)]"
                                      : "text-[var(--color-alert-icon-rating)] fill-none hover:text-[var(--color-alert-icon-rating)]"
                                    : "text-gray-500 fill-none hover:text-[var(--color-alert-icon-rating)]"
                                )}
                              />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">
                              {getGatedTooltip(
                                getBellTooltipText(
                                  entry,
                                  hasAccess,
                                  isSubscribed ||
                                    subscriptionDetails?.hasActiveTrial,
                                  subscriptionDetails?.hasActiveTrial
                                )
                              )}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {session?.user?.id &&
                        entry.userId &&
                        session.user.id === entry.userId && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(entry);
                              }}
                              className="text-gray-500 hover:text-[var(--color-text-primary)]"
                              aria-label="Edit raid log"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(entry);
                              }}
                              className="text-gray-500 hover:text-red-600"
                              disabled={deleteMutation.isPending}
                            >
                              {deleteMutation.isPending ? (
                                <span className="loading-spinner" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <BlueStarRating
                      score={entry.surferRating ?? 0}
                      outOfFive={true}
                    />
                  </div>

                  {/* Conditions - Right under star rating */}
                  {entry.forecast && (
                    <div className="bg-gray-50 p-2.5 rounded-lg space-y-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        {typeof entry.forecast.windSpeed === "number" && (
                          <div className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-primary">
                            <span className="mr-1">
                              {getGatedEmoji(
                                getWindEmoji(entry.forecast.windSpeed)
                              )}
                            </span>
                            <span>{entry.forecast.windSpeed}kts</span>
                          </div>
                        )}

                        {typeof entry.forecast.windDirection === "number" && (
                          <div className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-primary">
                            <span>
                              {degreesToCardinal(entry.forecast.windDirection)}
                            </span>
                          </div>
                        )}

                        {typeof entry.forecast.swellHeight === "number" && (
                          <div className="inline-flex items-center bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full text-xs font-primary">
                            <span className="mr-1">
                              {getGatedEmoji(
                                getSwellEmoji(entry.forecast.swellHeight)
                              )}
                            </span>
                            <span>{entry.forecast.swellHeight}m</span>
                          </div>
                        )}

                        {typeof entry.forecast.swellPeriod === "number" && (
                          <div className="inline-flex items-center bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full text-xs font-primary">
                            <span>{entry.forecast.swellPeriod}s</span>
                          </div>
                        )}

                        {typeof entry.forecast.swellDirection === "number" && (
                          <div className="inline-flex items-center bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full text-xs font-primary">
                            <span>
                              {degreesToCardinal(entry.forecast.swellDirection)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-sm font-primary">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-600">Logger:</span>
                      <LogEntryDisplay
                        entry={entry}
                        isAnonymous={entry.isAnonymous ?? false}
                      />
                    </div>
                  </div>

                  {entry.comments && (
                    <p className="text-sm text-gray-700 break-words font-primary line-clamp-2 mt-2">
                      <span className="font-medium">Comments:</span>{" "}
                      {entry.comments}
                    </p>
                  )}

                  {/* Image/Video section */}
                  {(() => {
                    // Get imageUrls array or fallback to single imageUrl
                    const entryImageUrls = (entry as any).imageUrls;
                    const imageUrls =
                      entryImageUrls &&
                      Array.isArray(entryImageUrls) &&
                      entryImageUrls.length > 0
                        ? entryImageUrls
                        : entry.imageUrl
                          ? [entry.imageUrl]
                          : [];
                    const hasImages = imageUrls.length > 0;
                    const hasVideo =
                      entry.videoUrl && entry.videoUrl.trim() !== "";

                    if (!hasImages && !hasVideo) {
                      return (
                        <div className="mt-auto pt-2 w-full">
                          <div className="relative w-full aspect-video bg-gray-100 rounded-md flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-gray-300" />
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="mt-auto pt-2 w-full">
                        <div className="relative w-full aspect-video rounded-md overflow-hidden group">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/raidlogs/${entry.id}`);
                            }}
                            className="relative w-full h-full block"
                          >
                            {hasImages ? (
                              <>
                                <Image
                                  src={imageUrls[0]}
                                  alt="Session photo"
                                  fill={true}
                                  className="object-cover rounded-md hover:opacity-90 transition-opacity"
                                />
                                {/* Image count badge - Tide Raider design */}
                                {imageUrls.length > 1 && (
                                  <div className="absolute top-2 right-2 bg-[var(--color-tertiary)]/90 backdrop-blur-sm text-white rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-lg border border-white/20 z-10">
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    <span className="text-xs font-primary font-semibold">
                                      {imageUrls.length}
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : hasVideo && entry.videoUrl ? (
                              // Check if it's an uploaded video (no platform) or external (YouTube/Vimeo)
                              !entry.videoPlatform ? (
                                // Uploaded video - use 360p thumbnail for preview to minimize server costs
                                <VideoThumbnail
                                  videoUrl={entry.videoUrl}
                                  onPlay={() => {
                                    router.push(`/raidlogs/${entry.id}`);
                                  }}
                                />
                              ) : (
                                // External video (YouTube/Vimeo) - show thumbnail
                                <>
                                  <Image
                                    src={getVideoThumbnail(
                                      entry.videoUrl,
                                      entry.videoPlatform
                                    )}
                                    alt="Video thumbnail"
                                    fill={true}
                                    className="object-cover rounded-md hover:opacity-90 transition-opacity"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <VideoIcon className="w-8 h-8 text-white" />
                                  </div>
                                </>
                              )
                            ) : null}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          handlePageChange(Math.max(1, currentPage - 1))
                        }
                        className={cn(
                          currentPage === 1 && "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }).map((_, i) => (
                      <PaginationItem key={`page-${i}`}>
                        <PaginationLink
                          onClick={() => handlePageChange(i + 1)}
                          isActive={currentPage === i + 1}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          handlePageChange(
                            Math.min(totalPages, currentPage + 1)
                          )
                        }
                        className={cn(
                          currentPage === totalPages &&
                            "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}

        {/* Table View */}
        {viewMode === "table" && (
          <div className="rounded-lg border border-gray-200 shadow">
            <div className="min-h-[500px] w-full">
              {isLoading ? (
                <div className="text-center p-4 font-primary">Loading...</div>
              ) : entries.length === 0 ? (
                <div className="text-center p-4 font-primary">
                  No matching sessions found
                </div>
              ) : (
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {columnsWithAction.map((column) => (
                        <th
                          key={`header-${column.key}`}
                          className={cn(
                            "px-2 py-2 text-xs text-left text-gray-500 uppercase tracking-wider font-primary",
                            column.key === "date"
                              ? "min-w-[100px]"
                              : "min-w-[120px]",
                            column.key === "comments" &&
                              "max-w-[150px] min-w-[150px]",
                            column.key === "imageUrl" && "w-[60px]",
                            "h-[36px]"
                          )}
                        >
                          {(column as QuestLogTableColumn).label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEntries.map((entry) => {
                      console.log("[TableDebug] Processing entry:", {
                        id: entry.id,
                        beachName: entry.beachName,
                        forecast: entry.forecast,
                      });

                      return (
                        <tr
                          key={`row-${entry.id}`}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={(e) => {
                            // Don't navigate if clicking on a button
                            if (!(e.target as HTMLElement).closest("button")) {
                              router.push(`/raidlogs/${entry.id}`);
                            }
                          }}
                        >
                          <td className="px-2 py-3 whitespace-nowrap text-sm min-w-[100px] font-primary">
                            {format(new Date(entry.date), "MMM d, yyyy")}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap min-w-[120px]">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  const foundBeach = beaches.find(
                                    (b) => b.name === entry.beachName
                                  );
                                  console.log("Found beach data:", foundBeach);
                                  setSelectedBeach(foundBeach || null);
                                }}
                                className="font-primary text-sm text-gray-900 hover:text-brand-3 transition-colors text-left"
                              >
                                {entry.beach?.name || "No beach specified"}
                              </button>
                            </div>
                          </td>
                          <td className="px-2 py-3 min-w-[100px] text-sm font-primary">
                            {entry.region?.name ?? "No region"}
                          </td>
                          <td className="px-2 py-3 min-w-[120px]">
                            <LogEntryDisplay
                              entry={entry}
                              isAnonymous={entry.isAnonymous ?? false}
                            />
                          </td>
                          <td className="px-2 py-3 min-w-[100px]">
                            <BlueStarRating
                              score={entry.surferRating ?? 0}
                              outOfFive={true}
                            />
                          </td>
                          <td className="px-2 py-3 min-w-[150px]">
                            <ForecastInfo
                              forecast={entry.forecast}
                              entry={entry}
                              hasAccess={hasAccess}
                            />
                          </td>
                          <td className="px-2 py-3 max-w-[150px] min-w-[150px] whitespace-normal">
                            <CommentsCell entry={entry} hasAccess={hasAccess} />
                          </td>
                          <td className="px-2 py-3 w-[60px]">
                            <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                              <Link
                                href={`/raidlogs/${entry.id}`}
                                className="relative w-full h-full block"
                              >
                                {(entry as any).imageUrls &&
                                (entry as any).imageUrls.length > 0 ? (
                                  <Image
                                    src={(entry as any).imageUrls[0]}
                                    alt="Session photo"
                                    fill
                                    className="object-cover transition-transform hover:scale-105 duration-300"
                                  />
                                ) : entry.imageUrl ? (
                                  <Image
                                    src={entry.imageUrl}
                                    alt="Session photo"
                                    fill
                                    className="object-cover transition-transform hover:scale-105 duration-300"
                                  />
                                ) : entry.videoUrl && entry.videoPlatform ? (
                                  <Image
                                    src={getVideoThumbnail(
                                      entry.videoUrl,
                                      entry.videoPlatform
                                    )}
                                    alt="Video thumbnail"
                                    fill
                                    className="object-cover transition-transform hover:scale-105 duration-300"
                                  />
                                ) : (
                                  <ImageIcon className="w-4 h-4 text-gray-200" />
                                )}
                              </Link>
                            </div>
                          </td>
                          <td className="px-2 py-3">
                            <div className="flex gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAlertClick(entry);
                                      }}
                                      className={cn(
                                        "p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors",
                                        "text-gray-500 hover:text-[var(--color-alert-icon-rating)]"
                                      )}
                                      aria-label="Set alert for this log entry"
                                    >
                                      <Bell
                                        className={cn(
                                          "w-5 h-5 cursor-pointer",
                                          entry.hasAlert
                                            ? entry.isMyAlert
                                              ? "text-[var(--color-alert-icon-rating)] fill-[var(--color-alert-icon-rating)]"
                                              : "text-[var(--color-alert-icon-rating)] fill-none hover:text-[var(--color-alert-icon-rating)]"
                                            : "text-gray-500 fill-none hover:text-[var(--color-alert-icon-rating)]"
                                        )}
                                      />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-sm">
                                      {getGatedTooltip(
                                        getBellTooltipText(
                                          entry,
                                          hasAccess,
                                          isSubscribed ||
                                            subscriptionDetails?.hasActiveTrial,
                                          subscriptionDetails?.hasActiveTrial
                                        )
                                      )}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              {session?.user?.id &&
                                entry.userId &&
                                session.user.id === entry.userId && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(entry);
                                      }}
                                      className="text-gray-500 hover:text-red-600"
                                      disabled={deleteMutation.isPending}
                                    >
                                      {deleteMutation.isPending ? (
                                        <span className="loading-spinner" />
                                      ) : (
                                        <X className="w-4 h-4" />
                                      )}
                                    </button>
                                  </>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Beach Details Modal */}
      {selectedBeach && (
        <BeachDetailsModal
          beach={selectedBeach}
          isOpen={!!selectedBeach}
          onClose={() => setSelectedBeach(null)}
          isSubscribed={isSubscribed}
          onSubscribe={() => {}}
        />
      )}

      {/* MediaModal */}
      {/* The MediaModal component is no longer used for image/video display,
          so it's removed from the return statement. */}

      <DeleteConfirmationDialog />
    </>
  );
}

// Extract getBellTooltipText as a standalone function
function getBellTooltipText(
  entry: LogEntry,
  hasAccess: boolean,
  isSubscribed?: boolean,
  hasActiveTrial?: boolean
) {
  // If user is not subscribed and doesn't have active trial, show subscribe CTA
  const userIsSubscribed = isSubscribed || hasActiveTrial;
  if (!hasAccess || !userIsSubscribed) {
    return "Subscribe to create alerts";
  }
  // User has alert already
  if (entry.hasAlert) {
    return entry.isMyAlert
      ? "You have an active alert for these conditions"
      : "Another user has an alert for these conditions";
  }
  // User is subscribed - show "Set alert for this log entry"
  return "Set alert for this log entry";
}
