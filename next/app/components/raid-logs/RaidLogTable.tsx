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
  LayoutGrid,
  Table as TableIcon,
  Loader2,
  Lock as LockIcon,
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
import { useMemo, useState, useEffect, useRef } from "react";
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
import { SubscriptionStatus } from "@/app/types/subscription";


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
  beaches?: Beach[];
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

  const hasProfile = !!userId;
  const showName = isAnonymous
    ? "Anonymous"
    : (entry.user?.name ?? entry.surferName ?? "Anonymous");

  return (
    <div className="flex items-center gap-2">
      <Link
        href={!hasProfile || isAnonymous ? "#" : `/profile/${userId}`}
        className={cn(
          "font-primary text-sm hover:text-brand-3 transition-colors",
          !hasProfile || isAnonymous ? "text-gray-900 cursor-default" : "text-gray-900"
        )}
      >
        {showName}
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
  isGated,
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
  entry: LogEntry;
  isGated?: boolean;
}) {
  const router = useRouter();

  // Only show if forecast exists and has at least one valid value
  if (!forecast && !isGated) {
    return <span className="text-gray-500 text-xs font-primary font-medium">No conditions</span>;
  }

  const isActuallyGated = isGated;

  // Check if forecast has any valid numeric values (including 0)
  const hasWind =
    typeof forecast?.windSpeed === "number" && forecast.windSpeed !== null;
  const hasWindDirection =
    typeof forecast?.windDirection === "number" &&
    forecast.windDirection !== null;
  const hasSwell =
    typeof forecast?.swellHeight === "number" && forecast.swellHeight !== null;
  const hasSwellPeriod =
    typeof forecast?.swellPeriod === "number" && forecast.swellPeriod !== null;
  const hasSwellDirection =
    typeof forecast?.swellDirection === "number" &&
    forecast.swellDirection !== null;

  // If no valid values exist, show "No conditions"
  if (
    !isActuallyGated &&
    !hasWind &&
    !hasWindDirection &&
    !hasSwell &&
    !hasSwellPeriod &&
    !hasSwellDirection
  ) {
    return <span className="text-gray-500 text-xs font-primary font-medium">No conditions</span>;
  }

  return (
    <div className={cn("flex flex-col gap-1.5 relative", isActuallyGated && "select-none")}>
      {isActuallyGated && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
           <div className="bg-white/80 backdrop-blur-[2px] rounded-full px-2 py-0.5 border border-amber-200 shadow-sm flex items-center gap-1.5">
             <LockIcon className="w-2.5 h-2.5 text-amber-600" />
             <span className="text-[9px] font-black text-amber-700 uppercase tracking-tight">Premium Data</span>
           </div>
        </div>
      )}
      <div className={cn("flex flex-wrap gap-1.5 items-center", isActuallyGated && "blur-[10px] select-none opacity-30")}>
        {(hasWind || hasWindDirection) && (
          <div className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-primary border border-blue-100">
            {hasWind && (
              <span className="font-medium mr-1">
                {getWindEmoji(forecast!.windSpeed!)} {forecast!.windSpeed}kts
              </span>
            )}
            {hasWindDirection && (
              <span className="opacity-80">
                {degreesToCardinal(forecast!.windDirection!)}
              </span>
            )}
          </div>
        )}

        {(hasSwell || hasSwellPeriod || hasSwellDirection) && (
          <div className="inline-flex items-center bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full text-xs font-primary border border-cyan-100">
            {hasSwell && (
              <span className="font-medium mr-1">
                {getSwellEmoji(forecast!.swellHeight!)} {Number(forecast!.swellHeight).toFixed(1)}m
              </span>
            )}
            {hasSwellPeriod && (
              <span className="opacity-80">
                @{forecast!.swellPeriod}s
              </span>
            )}
            {hasSwellDirection && (
              <span className="ml-1 opacity-80">
                {degreesToCardinal(forecast!.swellDirection!)} ({Math.round(forecast!.swellDirection!)}°)
              </span>
            )}
          </div>
        )}

      </div>
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
  let formattedDate = "Unknown Date";
  try {
    if (entry.date) {
      const date = new Date(entry.date);
      if (!isNaN(date.getTime())) {
        formattedDate = format(date, "yyyy-MM-dd");
      }
    }
  } catch (e) {
    console.error("Error formatting date for log entry:", entry.id, e);
  }

  return {
    ...entry,
    date: formattedDate,
    isPrivate: entry.isPrivate ?? false,
    isAnonymous: entry.isAnonymous ?? false,
    hasAlert: Array.isArray(entry.alerts) && entry.alerts.length > 0,
    isMyAlert: false,
    alertId: Array.isArray(entry.alerts) && entry.alerts.length > 0 ? entry.alerts[0].id : "",
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

  const latestComment = comments?.[comments.length - 1];

  return (
    <div className="flex items-center gap-2 min-h-[20px]">
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
      ) : (
        comments && comments.length > 0 ? (
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
                    Latest comment ({latestComment ? format(new Date(latestComment.createdAt), "MMM d, yyyy") : ''}):
                  </p>
                  <p className="text-sm text-gray-600 break-words">
                    {latestComment?.text}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <MessageCircle
            onClick={handleMessageClick}
            className="w-4 h-4 shrink-0 text-gray-300 cursor-pointer hover:text-brand-3"
          />
        )
      )}
    </div>
  );
}

export default function RaidLogTable({
  entries,
  beaches = [],
  columns = DEFAULT_COLUMNS,
  isSubscribed = false,
  isTrialing = false,
  isLoading = false,
  showPrivateOnly = false,
  onFilterChange,
  onBeachClick,
  nationality,
  session,
}: QuestTableProps) {
  const tableTopRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Reset page when entries change
  useEffect(() => {
    setCurrentPage(1);
  }, [entries]);

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
  const queryClient = useQueryClient();
  const { data: subscriptionDetails } = useSubscriptionDetails();
  // Use prop if available, otherwise check subscription details
  const isUserPremium = isSubscribed || subscriptionDetails?.status === SubscriptionStatus.ACTIVE || subscriptionDetails?.hasActiveTrial;
  const hasAccess = isUserPremium;

  // Set default view mode based on screen size
  const [viewMode, setViewMode] = useLocalStorage<"table" | "card">(
    "raidLogViewMode",
    "card"
  );

  // Pagination state
  // Items per page

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
    // Scroll to the top of the results container
    const container = document.getElementById("raid-logs-container");
    if (container) {
      container.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-full auto-rows-fr">
                {currentItems.map((entry) => {
                  const isOwner = session?.user?.id && entry.userId && session.user.id === entry.userId;
                  // Harden isHiddenGemEntry check to handle cases where beach relationship might be missing or stale
                  const isHiddenGemEntry = !!(entry as any).beach?.isHiddenGem || 
                                          beaches?.find(b => 
                                            b.id === (entry as any).beachId || 
                                            b.id === entry.beach?.id ||
                                            b.name?.toLowerCase() === entry.beachName?.toLowerCase() ||
                                            b.name?.toLowerCase() === entry.beach?.name?.toLowerCase()
                                          )?.isHiddenGem;
                  const isPremium = hasAccess; // Use unified access logic
                  const isGatedGem = isHiddenGemEntry && !isPremium && !isOwner;

                  const cardHref = isGatedGem ? "/pricing" : `/raidlogs/${entry.id}`;

                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 space-y-4 h-full flex flex-col",
                      isGatedGem && "cursor-pointer"
                    )}
                  onClick={isGatedGem ? () => router.push("/pricing") : undefined}
                >
                  {/* Hidden Gem lock overlay */}
                  {isGatedGem ? (
                    <div className="absolute top-2 right-2 z-20 bg-amber-500 rounded-full p-2 shadow-lg border border-amber-400 flex items-center justify-center">
                      <LockIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 z-20">
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
                                "p-2 rounded-full shadow-lg border transition-all flex items-center justify-center",
                                entry.hasAlert 
                                  ? "bg-[var(--color-tertiary)] border-[var(--color-tertiary)]" 
                                  : "bg-[var(--color-tertiary)]/10 border-[var(--color-tertiary)]/20"
                              )}
                              aria-label="Set alert for this log entry"
                            >
                              <Bell
                                className={cn(
                                  "w-4 h-4 cursor-pointer",
                                  entry.hasAlert
                                    ? "text-white fill-white"
                                    : "text-[var(--color-tertiary)] fill-none"
                                )}
                              />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
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
                    </div>
                  )}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-grow">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={cardHref}
                              className="block hover:opacity-75 transition-opacity"
                              onClick={(e) => isGatedGem && e.stopPropagation()}
                            >
                              <h3 className="h-5 mb-2 flex items-center gap-2">
                                {isGatedGem ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 text-[11px] font-black uppercase tracking-widest border border-amber-500/20">
                                    <LockIcon className="w-4 h-4 mr-1.5" />
                                    Hidden Gem
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-900 truncate">
                                    {entry.beach?.name || entry.beachName || "No beach specified"}
                                  </span>
                                )}
                                {isHiddenGemEntry && !isGatedGem && (
                                  <span className="text-amber-500 text-[11px]" title="Hidden Gem">💎</span>
                                )}
                              </h3>
                              <div className="space-y-1">
                                <p className="text-[11px] text-gray-500 font-primary flex items-center gap-1.5">
                                  <span className="opacity-70">📖</span> {isGatedGem ? "---" : format(new Date(entry.date), "MMM d, yyyy")}
                                </p>
                                <p className="text-[11px] text-gray-500 font-primary flex items-center gap-1.5">
                                  <span className="opacity-70">📍</span> {isGatedGem ? "---" : (entry.region?.name ?? "No region")}
                                </p>
                              </div>
                            </Link>
                          </TooltipTrigger>
                          {isGatedGem && (
                            <TooltipContent side="top">
                              <p className="text-xs">💎 Subscribe to view Hidden Gem/Novelty Wave sessions</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {session?.user?.id &&
                      entry.userId &&
                      session.user.id === entry.userId && (
                        <div className="flex gap-2">
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
                        </div>
                      )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <BlueStarRating
                        score={isGatedGem ? 0 : Number(entry.surferRating || 0)}
                        outOfFive={true}
                      />
                    </div>

                    {/* Conditions - Right under star rating */}
                    <div className="bg-gray-50 p-2.5 rounded-lg">
                      <ForecastInfo
                        forecast={entry.forecast}
                        entry={entry}
                        isGated={isGatedGem}
                        onAlertClick={handleAlertClick}
                      />
                    </div>

                    <div className="text-[13px] font-primary">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-gray-500">Logger:</span>
                        {isGatedGem ? (
                          <span className="text-gray-400 italic">---</span>
                        ) : (
                          <LogEntryDisplay
                            entry={entry}
                            isAnonymous={entry.isAnonymous ?? false}
                          />
                        )}
                      </div>
                    </div>

                    <div className="text-[13px] text-gray-700 font-primary mt-2 h-[40px] overflow-hidden">
                      <span className="font-semibold text-gray-500">Comments:</span>{" "}
                      {isGatedGem ? (
                        <span className="text-gray-400 italic">---</span>
                      ) : (
                        <span className="break-words">
                          {entry.comments ? (
                            entry.comments.length > 80 ? (
                              <>
                                {entry.comments.slice(0, 80)}...{" "}
                                <Link 
                                  href={cardHref}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                  className="text-[var(--color-tertiary)] hover:underline font-bold"
                                >
                                  Read more
                                </Link>
                              </>
                            ) : entry.comments
                          ) : (
                            "No comments"
                          )}
                        </span>
                      )}
                    </div>
                  </div>

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
                              if (isGatedGem && entry.videoUrl) {
                                window.open(entry.videoUrl, '_blank');
                              } else if (isGatedGem && entry.imageUrl) {
                                window.open(entry.imageUrl, '_blank');
                              } else {
                                router.push(isGatedGem ? "/pricing" : `/raidlogs/${entry.id}`);
                              }
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
                                    if (isGatedGem) {
                                      window.open(entry.videoUrl!, '_blank');
                                    } else {
                                      router.push(`/raidlogs/${entry.id}`);
                                    }
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
                );
              })}
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
                      const isOwner = session?.user?.id && entry.userId && session.user.id === entry.userId;
                      // Harden isHiddenGemEntry check to handle cases where beach relationship might be missing or stale
                      const isHiddenGemEntry = !!(entry as any).beach?.isHiddenGem || 
                                              beaches?.find(b => 
                                                b.id === (entry as any).beachId || 
                                                b.id === entry.beach?.id ||
                                                b.name?.toLowerCase() === entry.beachName?.toLowerCase() ||
                                                b.name?.toLowerCase() === entry.beach?.name?.toLowerCase()
                                              )?.isHiddenGem;
                      const isPremium = hasAccess; // Use unified access logic
                      const isGatedGem = isHiddenGemEntry && !isPremium && !isOwner;

                      return (
                        <tr
                          key={`row-${entry.id}`}
                          className={cn(
                            "hover:bg-gray-50 cursor-pointer",
                            isGatedGem && "bg-amber-50/30"
                          )}
                          onClick={(e) => {
                            // Don't navigate if clicking on a button
                            if (!(e.target as HTMLElement).closest("button")) {
                              router.push(isGatedGem ? "/pricing" : `/raidlogs/${entry.id}`);
                            }
                          }}
                        >
                          <td className="px-2 py-3 whitespace-nowrap text-sm min-w-[100px] font-primary">
                            {isGatedGem ? "---" : format(new Date(entry.date), "MMM d, yyyy")}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap min-w-[120px]">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  const foundBeach = beaches.find(
                                    (b) => b.name === entry.beachName
                                  );
                                  setSelectedBeach(foundBeach || null);
                                }}
                                className="font-primary text-sm text-gray-900 hover:text-brand-3 transition-colors text-left"
                              >
                                {isGatedGem ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
                                    <LockIcon className="w-2.5 h-2.5 mr-1" />
                                    Hidden Gem
                                  </span>
                                ) : (
                                  <>
                                    {entry.beach?.name || entry.beachName || "No beach specified"}
                                    {isHiddenGemEntry && (
                                      <span className="ml-1 text-amber-500" title="Hidden Gem">💎</span>
                                    )}
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-2 py-3 min-w-[100px] text-sm font-primary">
                            {isGatedGem ? "---" : (entry.region?.name ?? "No region")}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-sm font-primary">
                            {isGatedGem ? (
                              <span className="text-gray-400 italic">Hidden</span>
                            ) : (
                              <LogEntryDisplay
                                entry={entry}
                                isAnonymous={entry.isAnonymous ?? false}
                              />
                            )}
                          </td>
                          <td className="px-2 py-3 min-w-[100px]">
                            <BlueStarRating
                              score={isGatedGem ? 0 : Number(entry.surferRating || 0)}
                              outOfFive={true}
                            />
                          </td>
                          <td className="px-2 py-3 min-w-[150px]">
                            <ForecastInfo
                              forecast={entry.forecast}
                              entry={entry}
                              isGated={isGatedGem}
                              onAlertClick={handleAlertClick}
                            />
                          </td>
                          <td className="px-2 py-3 max-w-[150px] min-w-[150px] whitespace-normal">
                            {!isGatedGem && (
                              <CommentsCell entry={entry} hasAccess={hasAccess} />
                            )}
                          </td>
                          <td className="px-2 py-3 w-[60px]">
                            <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                              <div
                                className="relative w-full h-full block cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isGatedGem && entry.videoUrl) {
                                    window.open(entry.videoUrl, '_blank');
                                  } else if (isGatedGem && entry.imageUrl) {
                                    window.open(entry.imageUrl, '_blank');
                                  } else {
                                    router.push(isGatedGem ? "/pricing" : `/raidlogs/${entry.id}`);
                                  }
                                }}
                              >
                                {isGatedGem && (
                                  <div className="absolute inset-0 z-10 bg-white/40 flex items-center justify-center">
                                    <LockIcon className="w-3 h-3 text-amber-600" />
                                  </div>
                                )}
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
                              </div>
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
