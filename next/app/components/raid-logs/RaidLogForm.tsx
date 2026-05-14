"use client";
import { useState, useEffect } from "react";
import { Star, Search, X, Bell, Loader2 } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { cn } from "@/app/lib/utils";
import type { Beach } from "@/app/types/beaches";
import type { LogEntry } from "@/app/types/raidlogs";
import SurfForecastWidget from "../SurfForecastWidget";
import { Button } from "@/app/components/ui/Button";
import { compressVideoIfNeeded, validateVideoFile } from "@/app/lib/file";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import Image from "next/image";
import {
  getWindEmoji,
  getSwellEmoji,
  degreesToCardinal,
  getSourceName,
} from "@/app/lib/forecastUtils";
import { useCreateLog } from "@/app/hooks/useCreateLog";
import { useUpdateLog } from "@/app/hooks/useUpdateLog";
import { useBeaches } from "@/app/hooks/useBeaches";
import { BeachContext } from "@/app/context/BeachContext";
import { useContext } from "react";
import { useSubscriptionStatus } from "@/app/hooks/useSubscriptionStatus";
import {
  BlueStarRating,
  InteractiveBlueStarRating,
} from "@/app/lib/scoreDisplayBlueStars";
import { getVideoId } from "@/app/lib/videoUtils";
import { MultiImageUploader } from "./MultiImageUploader";
import { MultiVideoUploader } from "./MultiVideoUploader";
import { getBackendUrl } from "@/app/lib/api-config";

interface RaidLogFormProps {
  userEmail?: string;
  isOpen?: boolean;
  onClose?: () => void;
  beaches?: Beach[];
  entry?: LogEntry;
  isEditing?: boolean;
}

type LogEntryInput = Omit<
  LogEntry,
  "id" | "createdAt" | "updatedAt" | "hasAlert" | "isMyAlert" | "alertId"
>;

// Add this constant at the top of the file, outside the component
const FORM_STATE_KEY = "raid_log_form_state";

export function RaidLogForm({
  userEmail,
  isOpen = false,
  onClose = () => {},
  entry,
  beaches: beachesProp,
}: RaidLogFormProps) {
  const queryClient = useQueryClient();
  const { data: session, status: authStatus } = useBackendAuth();
  const router = useRouter();
  const user = session?.user;

  // Check subscription status for photo upload limits
  const { isPremium, isLoading: isSubscriptionLoading } =
    useSubscriptionStatus();

  // Set max images based on subscription: 30 for subscribers, 10 for non-subscribers
  const maxImages = isPremium ? 30 : 10;

  // Debug: Log auth state to help troubleshoot
  useEffect(() => {
    console.log("[RaidLogForm] Auth state:", {
      hasSession: !!session,
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      authStatus,
      sessionData: session,
    });
  }, [session, user, authStatus]);

  // Wait for auth to load before checking user
  const isAuthLoading = authStatus === "loading";

  // Get beaches from context (provided by BeachProvider from layout)
  // Use useContext directly - it returns undefined if not in provider (safe)
  const beachContext = useContext(BeachContext);
  const beachesFromContext = beachContext?.beaches || [];

  // Only fetch beaches via hook if:
  // 1. Not provided as prop
  // 2. Not available from context (or context is empty)
  const needsHookFetch =
    !beachesProp && (!beachesFromContext || beachesFromContext.length === 0);

  const { data: beachesFromHook, isLoading: isBeachesLoadingFromHook } =
    useBeaches({
      enabled: needsHookFetch,
    });

  const beaches = beachesProp || beachesFromContext || beachesFromHook || [];
  const isBeachesLoading = needsHookFetch && isBeachesLoadingFromHook;

  // Relaxed loading condition: only block if auth is still determining if we're signed in
  // or if we're EDITING and need beaches to resolve the current selection
  const shouldBlock = (isAuthLoading && !user && !userEmail) || (entry && isBeachesLoading && beaches.length === 0);

  useEffect(() => {
    if (isOpen) {
      console.log("[RaidLogForm] 🔄 Rendering state update:", {
        isAuthLoading,
        authStatus,
        hasUser: !!user,
        userId: user?.id,
        isBeachesLoading,
        needsHookFetch,
        beachesCount: beaches.length,
        shouldBlock
      });
    }
  }, [isOpen, isAuthLoading, isBeachesLoading, beaches.length, user, authStatus, needsHookFetch, shouldBlock]);

  const [selectedDate, setSelectedDate] = useState<string>(
    (() => {
      if (!entry?.date) return "";
      try {
        const d = new Date(entry.date);
        return isNaN(d.getTime()) ? "" : format(d, "yyyy-MM-dd");
      } catch (e) {
        return "";
      }
    })()
  );
  const [selectedBeach, setSelectedBeach] = useState<Beach | null>(null);
  const [surferRating, setSurferRating] = useState(entry?.surferRating || 0);
  const [comments, setComments] = useState(entry?.comments || "");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(
    entry?.isAnonymous || false
  );
  // Multiple images support
  // Initialize imageUrls from entry - prefer imageUrls array, fallback to imageUrl
  const [imageUrls, setImageUrls] = useState<string[]>(() => {
    if (entry) {
      // Check for imageUrls array first (new format)
      const entryImageUrls = (entry as any).imageUrls;
      if (
        entryImageUrls &&
        Array.isArray(entryImageUrls) &&
        entryImageUrls.length > 0
      ) {
        return entryImageUrls;
      }
      // Fallback to single imageUrl (old format)
      if (entry.imageUrl) {
        return [entry.imageUrl];
      }
    }
    return [];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPrivate, setIsPrivate] = useState<boolean>(
    entry?.isPrivate || false
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [surfTimeSlot, setSurfTimeSlot] = useState<string | undefined>(
    (entry as any)?.surfTimeSlot || undefined
  );
  const [mostAccurateSource, setMostAccurateSource] = useState<string | undefined>(
    (entry as any)?.mostAccurateSource || undefined
  );
  
  // Multiple videos support
  const [videoUrls, setVideoUrls] = useState<any[]>(() => {
    if (entry) {
      const entryVideoUrls = (entry as any).videoUrls;
      if (entryVideoUrls && Array.isArray(entryVideoUrls) && entryVideoUrls.length > 0) {
        return entryVideoUrls;
      }
      if (entry.videoUrl) {
        return [{ 
          url: entry.videoUrl, 
          type: entry.videoPlatform || "upload" 
        }];
      }
    }
    return [];
  });

  const [email, setEmail] = useState<string>("");

  console.log("useForecast params:", {
    regionId: selectedBeach?.regionId || "",
    date: selectedDate,
    selectedBeach,
  });

  const {
    data: allForecasts,
    isLoading: isLoadingForecasts,
  } = useQuery({
    queryKey: ["forecasts-all", selectedBeach?.regionId, selectedDate, surfTimeSlot],
    queryFn: async () => {
      if (!selectedBeach?.regionId || !selectedDate || !surfTimeSlot) return {};
      
      const sources = ["WINDFINDER", "WINDGURU", "WINDY"];
      const results: Record<string, any> = {};
      const dateObj = new Date(selectedDate);
      if (isNaN(dateObj.getTime())) {
        console.error("[RaidLogForm] Invalid selectedDate:", selectedDate);
        return {};
      }
      const dateStr = dateObj.toISOString().split("T")[0];
      
      console.log(`[RaidLogForm] Fetching forecasts for ${selectedBeach.regionId} on ${dateStr} slot ${surfTimeSlot}`);
      
      await Promise.all(sources.map(async (source) => {
        try {
          const url = `/api/surf-conditions?regionId=${selectedBeach.regionId}&forecastDate=${dateStr}&source=${source}&timeSlot=${surfTimeSlot}&fallback=false`;
          const res = await fetch(url, { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            results[source] = data.forecast;
          }
        } catch (e) {
          console.error(`[RaidLogForm] Failed to fetch ${source} forecast:`, e);
        }
      }));
      
      return results;
    },
    enabled: !!selectedBeach?.regionId && !!selectedDate && !!surfTimeSlot
  });

  const forecastData = allForecasts?.WINDFINDER || allForecasts?.WINDGURU || allForecasts?.WINDY;

  // Add debug logging
  useEffect(() => {
    console.log("Forecast Data Debug:", {
      forecastData,
      selectedBeach,
      selectedDate,
      isLoadingForecasts,
      hasData: !!forecastData,
      forecastProps: forecastData && {
        id: (forecastData as any).id,
        windSpeed: (forecastData as any).windSpeed,
        windDirection: (forecastData as any).windDirection,
        swellHeight: (forecastData as any).swellHeight,
        swellPeriod: (forecastData as any).swellPeriod,
        swellDirection: (forecastData as any).swellDirection,
      },
    });
  }, [forecastData, selectedBeach, selectedDate, isLoadingForecasts]);

  const { data: searchResults, isLoading: isLoadingBeaches } = useQuery({
    queryKey: ["beaches-search", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      // Use Next.js API route which proxies to backend
      const response = await fetch(
        `/api/beaches/search?term=${encodeURIComponent(searchTerm)}`,
        {
          credentials: "include", // Include cookies for auth
        }
      );
      if (!response.ok) throw new Error("Failed to fetch beaches");
      return response.json();
    },
    enabled: searchTerm.length >= 2,
  });

  // Track changes to form fields
  useEffect(() => {
    if (!entry) return;

    const entryDateStr = (() => {
      if (!entry.date) return "";
      try {
        const d = new Date(entry.date);
        return isNaN(d.getTime()) ? "" : format(d, "yyyy-MM-dd");
      } catch (e) {
        return "";
      }
    })();

    const hasChanges =
      selectedDate !== entryDateStr ||
      selectedBeach?.name !== entry.beachName ||
      surferRating !== entry.surferRating ||
      comments !== entry.comments ||
      isAnonymous !== entry.isAnonymous ||
      isPrivate !== entry.isPrivate ||
      JSON.stringify(imageUrls) !==
        JSON.stringify(entry?.imageUrl ? [entry.imageUrl] : []) ||
      JSON.stringify(videoUrls) !==
        JSON.stringify((entry as any).videoUrls || (entry?.videoUrl ? [{ url: entry.videoUrl, type: entry.videoPlatform || "upload" }] : [])) ||
      email !== ((entry as any).email || user?.email || userEmail || "");

    setHasUnsavedChanges(hasChanges);
  }, [
    entry,
    selectedDate,
    selectedBeach,
    surferRating,
    comments,
    isAnonymous,
    isPrivate,
    imageUrls,
    email,
    user?.email,
    userEmail,
  ]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to close?"
      );
      if (!confirmed) return;
    }
    onClose();
  };

  // Initialize all form fields from entry when entry loads (for editing)
  useEffect(() => {
    if (entry) {
      console.log("Initializing form from entry:", {
        id: entry.id,
        surferRating: entry.surferRating,
        comments: entry.comments,
        date: entry.date,
        beachName: entry.beachName,
        beachId: (entry as any).beachId,
        beach: (entry as any).beach,
      });

      // Update all form fields from entry
      if (entry.date) {
        try {
          const d = new Date(entry.date);
          if (!isNaN(d.getTime())) {
            setSelectedDate(format(d, "yyyy-MM-dd"));
          }
        } catch (e) {
          console.error("Error setting initial date:", e);
        }
      }
      if (entry.surferRating !== undefined && entry.surferRating !== null) {
        setSurferRating(entry.surferRating);
      }
      if (entry.comments !== undefined && entry.comments !== null) {
        setComments(entry.comments);
      }
      if (entry.isAnonymous !== undefined) {
        setIsAnonymous(entry.isAnonymous);
      }
      if (entry.isPrivate !== undefined) {
        setIsPrivate(entry.isPrivate);
      }
      // videoUrls is already initialized in useState
      // Populate email from entry or user profile
      if ((entry as any).email) {
        setEmail((entry as any).email);
      } else if (user?.email) {
        setEmail(user.email);
      } else if (userEmail) {
        setEmail(userEmail);
      }
      // Populate images - prefer imageUrls array, fallback to imageUrl
      const entryImageUrls = (entry as any).imageUrls;
      if (
        entryImageUrls &&
        Array.isArray(entryImageUrls) &&
        entryImageUrls.length > 0
      ) {
        // Use imageUrls array if available
        setImageUrls(entryImageUrls);
      } else if (entry.imageUrl && imageUrls.length === 0) {
        // Fallback to single imageUrl if no array
        setImageUrls([entry.imageUrl]);
      }
      // videoUrls handles both external and uploaded videos
    }
  }, [entry]);

  // Initialize beach from entry when both entry and beaches are available
  useEffect(() => {
    if (entry && beaches && beaches.length > 0) {
      // Only initialize if we don't have a selected beach yet
      if (!selectedBeach) {
        console.log("Initializing beach selection:", {
          entryBeachId: (entry as any).beachId,
          entryBeachName: entry.beachName,
          entryBeach: (entry as any).beach,
          availableBeachesCount: beaches.length,
          availableBeaches: beaches
            ?.slice(0, 3)
            .map((b) => ({ id: b.id, name: b.name })),
        });

        // Try multiple methods to find the beach:
        // 1. Direct beach relation from entry
        // 2. By beachId
        // 3. By beachName
        let matchingBeach: Beach | null = null;

        // Method 1: Check if entry has a beach relation
        if ((entry as any).beach?.id) {
          matchingBeach =
            beaches.find((beach) => beach.id === (entry as any).beach.id) ||
            null;
        }

        // Method 2: Try by beachId
        if (!matchingBeach && (entry as any).beachId) {
          matchingBeach =
            beaches.find((beach) => beach.id === (entry as any).beachId) ||
            null;
        }

        // Method 3: Try by beachName (fallback)
        if (!matchingBeach && entry.beachName) {
          matchingBeach =
            beaches.find((beach) => beach.name === entry.beachName) || null;
        }

        if (matchingBeach) {
          console.log("Found matching beach:", matchingBeach.name);
          setSelectedBeach(matchingBeach);
          setSearchTerm(matchingBeach.name);
        } else {
          console.log("No matching beach found for:", {
            beachId: (entry as any).beachId,
            beachName: entry.beachName,
            entryBeach: (entry as any).beach,
          });
        }
      }
    }
  }, [entry, beaches, selectedBeach]);

  // Add debug logging for beaches
  useEffect(() => {
    console.log("Available beaches:", {
      count: beaches?.length,
      firstThree: beaches?.slice(0, 3).map((b) => ({
        name: b?.name,
        region: b?.region?.name,
        country: b?.region?.country?.name,
      })),
    });
  }, [beaches]);

  useEffect(() => {
    console.log("Selected beach data:", {
      beach: selectedBeach,
      regionId: selectedBeach?.regionId,
      date: selectedDate,
    });
  }, [selectedBeach, selectedDate]);

  const { mutate: createLog } = useCreateLog();
  const { mutate: updateLog } = useUpdateLog();

  // Populate email from user profile on load
  useEffect(() => {
    if (user?.email) {
      // Use email from session/user profile
      setEmail(user.email);
    } else if (userEmail) {
      // Fallback to userEmail prop if provided
      setEmail(userEmail);
    }
  }, [user?.email, userEmail]);

  // Add effect to restore form state after sign-in
  useEffect(() => {
    if (user) {
      const savedState = localStorage.getItem(FORM_STATE_KEY);
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          setSelectedDate(state.selectedDate || "");
          setSelectedBeach(state.selectedBeach || null);
          setSurferRating(state.surferRating || 0);
          setComments(state.comments || "");
          setIsAnonymous(state.isAnonymous || false);
          setIsPrivate(state.isPrivate || false);
          // Restore video URLs from saved state
          if (state.videoUrls && Array.isArray(state.videoUrls)) {
            setVideoUrls(state.videoUrls);
          }
          // Restore email if it was saved
          if (state.email) {
            setEmail(state.email);
          } else {
            // Otherwise use user's profile email
            setEmail(user.email || userEmail || "");
          }

          // Clean up
          localStorage.removeItem(FORM_STATE_KEY);
        } catch (error) {
          console.error("Error restoring form state:", error);
          localStorage.removeItem(FORM_STATE_KEY);
        }
      } else {
        // No saved state, populate email from user profile
        setEmail(user.email || userEmail || "");
      }
    }
  }, [user, userEmail]);

  // Function to save form state before sign-in
  const saveFormState = () => {
    const formState = {
      selectedDate,
      selectedBeach,
      surferRating,
      comments,
      isAnonymous,
      isPrivate,
      videoUrls,
      selectedVideo: null, // Don't store File object
      uploadedVideoUrl: (entry as any)?.uploadedVideoUrl || "",
      email, // Save email state
    };

    localStorage.setItem(FORM_STATE_KEY, JSON.stringify(formState));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Wait for auth to finish loading
    if (isAuthLoading) {
      toast.info("Please wait while we verify your authentication...");
      return;
    }

    if (!user) {
      saveFormState();
      toast.error("Please sign in to log your session", {
        action: {
          label: "Sign In",
          onClick: () => {
            const BACKEND_URL = getBackendUrl();
            window.location.href = `${BACKEND_URL}/api/auth/google?state=${encodeURIComponent(
              `${window.location.origin}/raidlogs/new`
            )}`;
          },
        },
      });
      return;
    }

    if (!selectedBeach || !selectedDate) {
      toast.error("Please select a beach and date");
      return;
    }

    if (imageUrls.length === 0 && videoUrls.length === 0) {
      toast.error("Raid Log entry needs a media to post, it can't be blank");
      return;
    }

    setIsSubmitting(true);
    try {
      // Images and videos are already handled by their respective Multi-Uploader components
      const finalImageUrls = imageUrls.length > 0 ? imageUrls : [];
      const finalImageUrl = finalImageUrls.length > 0 ? finalImageUrls[0] : undefined;

      const logData = {
        selectedBeach,
        selectedDate,
        forecastData: forecastData || entry?.forecast,
        isAnonymous,
        surferRating,
        comments,
        isPrivate,
        uploadedImageUrl: finalImageUrl,
        imageUrls: finalImageUrls,
        videoUrls: videoUrls,
        // For backward compatibility
        videoUrl: videoUrls.length > 0 ? videoUrls[0].url : "",
        videoPlatform: videoUrls.length > 0 ? videoUrls[0].type : null,
        email: email.trim() || user?.email || userEmail || "",
        surfTimeSlot,
        mostAccurateSource,
      };

      // If editing, update instead of create
      let createdEntry;
      if (entry?.id) {
        createdEntry = await updateLog({
          id: entry.id,
          ...logData,
        });
      } else {
        createdEntry = await createLog(logData);
      }

      // Wait a moment for query invalidation to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to /raidlogs to show the new log
      // For both new posts and edits, go to the main raidlogs page
      setIsSubmitting(false);
      router.push("/raidlogs");
      if (onClose) onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      setIsSubmitting(false);
      toast.error("Failed to submit log entry: " + (error as Error).message);
    }
  };

  const handleBeachSelect = (beach: Beach) => {
    setSelectedBeach(beach);
    setSearchTerm("");
  };

  // Removed handleFileChange - now handled by MultiImageUploader component

  const safeParseFloat = (value: any): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === "string") {
      value = value.replace(",", ".");
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const validateVideoUrl = (
    url: string,
    platform: "youtube" | "vimeo" | null
  ): boolean => {
    if (!url || !platform) return true; // Empty values are valid
    const videoId = getVideoId(url, platform);
    return !!videoId;
  };

  // Add this before rendering SurfForecastWidget
  console.log("Data being passed to SurfForecastWidget:", {
    forecastData,
    expectedShape: {
      windSpeed: "number",
      windDirection: "number",
      swellHeight: "number",
      swellPeriod: "number",
      swellDirection: "number",
    },
  });

  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Only clean up if user is signed in (form submitted) or left the page
      if (user || !document.hidden) {
        localStorage.removeItem(FORM_STATE_KEY);
      }
      // videoUrls cleanup handled by MultiVideoUploader if needed
    };
  }, [user]);

  if (!isOpen) return null;

  if (shouldBlock) {
    // Show loader while auth or beaches (if editing) are loading
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white p-8 rounded-2xl text-center shadow-2xl border border-gray-100 max-w-xs animate-in fade-in zoom-in duration-300">
          <div className="mb-4 flex justify-center">
             <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-[var(--color-tertiary)] animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-2 h-2 bg-[var(--color-tertiary)] rounded-full animate-pulse"></div>
                </div>
             </div>
          </div>
          <p className="font-primary font-bold mb-1 text-[var(--color-primary)] text-lg">Discovery Mode</p>
          <p className="text-sm text-gray-400 font-primary leading-relaxed px-4">
            {isAuthLoading ? "Verifying your identity..." : "Fetching beach coordinates..."}
          </p>
        </div>
      </div>
    );
  }

  // Render form (user may or may not be logged in - form handles that)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white max-h-[90vh] overflow-y-auto p-6 rounded-lg w-full max-w-md">
        <div className="relative">
          <button
            onClick={() => {
              console.log("Close button clicked");
              handleClose();
            }}
            className="absolute top-0 right-0 text-gray-400 hover:text-gray-500 z-[102]"
            type="button"
            aria-label="Close form"
          >
            <X className="h-6 w-6" />
          </button>

          <h2 className="text-[21px] font-bold mb-6 font-primary text-[var(--color-primary)]">
            {entry ? "Edit Session" : "Log Session"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="steps-container space-y-8">
              <div className="step">
                <h3 className="text-[16px] font-semibold mb-3 font-primary text-[var(--color-primary)] flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white mr-2 text-sm">
                    1
                  </span>
                  Select Date
                </h3>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) =>
                    setSelectedDate(e.target.value.split("T")[0])
                  }
                  max={new Date().toISOString().split("T")[0]}
                  required
                  className="p-2 border rounded w-full"
                  aria-label="Select date"
                />
              </div>

              <div className="step">
                <h3 className="text-[16px] font-semibold mb-3 font-primary text-[var(--color-primary)] flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white mr-2 text-sm">
                    2
                  </span>
                  Select Beach
                </h3>
                <div className="relative">
                  <div className="flex items-center border rounded-md mb-2">
                    <Search className="h-4 w-4 ml-2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search beaches..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="p-2 w-full font-primary text-sm focus:outline-none"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="mr-2 text-gray-400 hover:text-gray-600"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {searchTerm && searchResults && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((beach: Beach) => (
                        <div
                          key={beach.id}
                          className="p-2 hover:bg-gray-100 cursor-pointer font-primary"
                          onClick={() => {
                            handleBeachSelect(beach);
                            setSearchTerm("");
                          }}
                        >
                          {beach.name}
                          {beach.region?.name && (
                            <span className="text-sm text-gray-500 ml-2">
                              ({beach.region.name})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-2 border rounded-md flex justify-between items-center">
                    <span className="font-primary">
                      {selectedBeach
                        ? selectedBeach.name
                        : "Search for a beach..."}
                    </span>
                    {selectedBeach && (
                      <button
                        type="button"
                        onClick={() => setSelectedBeach(null)}
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Clear selected beach"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {selectedBeach && selectedDate && (
                <div className="step">
                  <h3 className="text-[16px] font-semibold mb-3 font-primary text-[var(--color-primary)] flex items-center">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white mr-2 text-sm">
                      3
                    </span>
                    When was the session?
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "MORNING", label: "Morning", sub: "05–09h", icon: "🌅" },
                      { value: "NOON", label: "Midday", sub: "11–15h", icon: "☀️" },
                      { value: "EVENING", label: "Evening", sub: "17–21h", icon: "🌇" },
                    ].map((slot) => (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => setSurfTimeSlot(
                          surfTimeSlot === slot.value ? undefined : slot.value
                        )}
                        className={cn(
                          "flex flex-col items-center p-3 rounded-lg border-2 transition-all font-primary text-sm",
                          surfTimeSlot === slot.value
                            ? "border-[var(--color-tertiary)] bg-[var(--color-tertiary)]/10 text-[var(--color-primary)]"
                            : "border-gray-200 hover:border-gray-300 text-gray-600"
                        )}
                      >
                        <span className="text-xl mb-1">{slot.icon}</span>
                        <span className="font-semibold">{slot.label}</span>
                        <span className="text-xs text-gray-400">{slot.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedBeach && selectedDate && surfTimeSlot && (
                <div className="step">
                  <h3 className="text-[16px] font-semibold mb-1 font-primary text-[var(--color-primary)] flex items-center">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white mr-2 text-sm">
                      4
                    </span>
                    Most Accurate Source
                  </h3>
                  <p className="text-[11px] text-gray-500 mb-4 font-primary">
                    Compare the predictions for your <span className="font-bold text-[var(--color-tertiary)]">{surfTimeSlot.toLowerCase()}</span> session. Which was closest to reality?
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { value: "WINDFINDER", label: getSourceName("WINDFINDER"), color: "text-blue-600" },
                      { value: "WINDGURU", label: getSourceName("WINDGURU"), color: "text-emerald-600" },
                      { value: "WINDY", label: getSourceName("WINDY"), color: "text-red-600" },
                    ].map((source) => {
                      const forecast = allForecasts?.[source.value];
                      return (
                        <button
                          key={source.value}
                          type="button"
                          onClick={() => setMostAccurateSource(
                            mostAccurateSource === source.value ? undefined : source.value
                          )}
                          className={cn(
                            "flex flex-col p-3 rounded-xl border-2 transition-all font-primary text-left relative overflow-hidden group",
                            mostAccurateSource === source.value
                              ? "border-[var(--color-tertiary)] bg-[var(--color-tertiary)]/5 ring-1 ring-[var(--color-tertiary)]/20"
                              : "border-gray-100 hover:border-gray-200 bg-white"
                          )}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className={cn("font-bold text-[13px] tracking-tight whitespace-nowrap", source.color)}>{source.label}</span>
                            {mostAccurateSource === source.value && (
                              <div className="w-5 h-5 bg-[var(--color-tertiary)] rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-white text-[10px] font-bold">✓</span>
                              </div>
                            )}
                          </div>

                          {isLoadingForecasts ? (
                            <div className="flex flex-col items-center justify-center py-4 space-y-3">
                              <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                              <div className="space-y-2 w-full">
                                <div className="h-2.5 w-full bg-slate-50 animate-pulse rounded-full" />
                                <div className="h-2.5 w-2/3 bg-slate-50 animate-pulse rounded-full" />
                              </div>
                            </div>
                          ) : forecast ? (
                            <div className="space-y-2.5">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-50 rounded-lg">
                                  <span className="text-xs">{getWindEmoji(forecast.windSpeed)}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase leading-none mb-0.5">Wind</span>
                                  <span className="text-xs font-black text-gray-700 leading-none">
                                    {forecast.windSpeed}kts {degreesToCardinal(forecast.windDirection)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-cyan-50 rounded-lg">
                                  <span className="text-xs">{getSwellEmoji(forecast.swellHeight)}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase leading-none mb-0.5">Swell</span>
                                  <span className="text-xs font-black text-gray-700 leading-none">
                                    {forecast.swellHeight}m @ {forecast.swellPeriod}s
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="py-4 text-center">
                              <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest italic">No Data</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {(mostAccurateSource || entry?.forecast) && (
                <div className="step">
                  <h3 className="text-[16px] font-semibold mb-3 font-primary text-[var(--color-primary)] flex items-center">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white mr-2 text-sm">
                      5
                    </span>
                    Rate Your Session
                  </h3>
                  <InteractiveBlueStarRating
                    rating={surferRating}
                    onRatingChange={setSurferRating}
                    size={24}
                  />
                </div>
              )}

              {(surferRating > 0 || entry?.id) && (
                <div className="step">
                  <h3 className="text-[16px] font-semibold mb-3 font-primary text-[var(--color-primary)] flex items-center">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white mr-2 text-sm">
                      6
                    </span>
                    Session Intel
                  </h3>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value.slice(0, 140))}
                    className="w-full p-2 border rounded-lg"
                    rows={4}
                    placeholder="Describe the waves, crowd, or anything else..."
                    maxLength={140}
                  />
                  <div className="text-sm text-gray-500 mt-1 font-primary">
                    Characters remaining: {140 - comments.length}
                  </div>
                </div>
              )}

              {(surferRating > 0 || entry?.id) && (
                <div className="step">
                  <h3 className="text-[16px] font-semibold mb-3 font-primary text-[var(--color-primary)] flex items-center">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white mr-2 text-sm">
                      7
                    </span>
                    Add Photos (Optional)
                  </h3>
                  <MultiImageUploader
                    images={imageUrls}
                    onImagesChange={setImageUrls}
                    maxImages={maxImages}
                  />
                  {!isPremium && imageUrls.length > 0 && (
                    <p className="text-xs text-[var(--color-text-secondary)] mt-2 font-primary">
                      Subscribers can upload up to 30 photos.{" "}
                      <Link
                        href="/checkout"
                        className="text-[var(--color-primary)] hover:underline"
                      >
                        Learn more
                      </Link>
                    </p>
                  )}
                </div>
              )}

              {(surferRating > 0 || entry?.id) && (
                <div className="step">
                  <h3 className="text-[16px] font-semibold mb-3 font-primary text-[var(--color-primary)] flex items-center">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white mr-2 text-sm">
                      8
                    </span>
                    Add Video (Optional)
                  </h3>
                  <MultiVideoUploader
                    videos={videoUrls}
                    onVideosChange={setVideoUrls}
                    maxVideos={5}
                  />
                </div>
              )}

              <div className="step border-t pt-6">
                <h3 className="text-[16px] font-semibold mb-4 font-primary text-[var(--color-primary)] flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white mr-2 text-sm">
                    9
                  </span>
                  Additional Options
                </h3>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-primary mb-1"
                    >
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full p-2 border rounded-lg font-primary text-sm"
                      aria-label="Email address"
                    />
                    <p className="text-xs text-gray-500 mt-1 font-primary">
                      Leave empty to use your account email
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor="anonymous"
                      className="font-primary text-[14px]"
                    >
                      Post Anonymously
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="private"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor="private"
                      className="font-primary text-[14px]"
                    >
                      Keep Private
                    </label>
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                variant="ghost"
                disabled={
                  (!forecastData && !entry?.forecast) ||
                  !selectedBeach ||
                  !selectedDate ||
                  isSubmitting
                }
                className="w-full font-primary bg-[var(--color-tertiary)] text-white hover:bg-[var(--color-tertiary)]/90 py-2 mt-4"
                onClick={(e) => {
                  if (!user) {
                    e.preventDefault();
                    saveFormState();
                    toast.error("Please sign in to log your session", {
                      action: {
                        label: "Sign In",
                        onClick: () => {
                          // Use single source of truth for backend URL
                          const BACKEND_URL = getBackendUrl();
                          window.location.href = `${BACKEND_URL}/api/auth/google?state=${encodeURIComponent(
                            `${window.location.origin}/raidlogs/new`
                          )}`;
                        },
                      },
                    });
                    return;
                  }
                }}
              >
                {isSubmitting
                  ? "Submitting..."
                  : isAuthLoading
                    ? "Loading..."
                    : !user
                      ? "Sign In to Log Session"
                      : entry
                        ? "Update Session"
                        : "Log Session"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
