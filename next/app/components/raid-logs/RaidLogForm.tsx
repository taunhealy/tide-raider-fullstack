"use client";
import { useState, useEffect } from "react";
import { Star, Search, X, Bell } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { cn } from "@/app/lib/utils";
import type { Beach } from "@/app/types/beaches";
import type { LogEntry } from "@/app/types/raidlogs";
import SurfForecastWidget from "../SurfForecastWidget";
import { Button } from "@/app/components/ui/Button";
import { compressVideoIfNeeded, validateVideoFile } from "@/app/lib/file";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import Image from "next/image";
import { useCreateLog } from "@/app/hooks/useCreateLog";
import { useUpdateLog } from "@/app/hooks/useUpdateLog";
import { useBeaches } from "@/app/hooks/useBeaches";
import { BeachContext } from "@/app/context/BeachContext";
import { useContext } from "react";
import {
  BlueStarRating,
  InteractiveBlueStarRating,
} from "@/app/lib/scoreDisplayBlueStars";
import { getVideoId } from "@/app/lib/videoUtils";
import { MultiImageUploader } from "./MultiImageUploader";
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

  // Priority: prop > context > hook
  const beaches = beachesProp || beachesFromContext || beachesFromHook || [];
  const isBeachesLoading = needsHookFetch && isBeachesLoadingFromHook;
  const [selectedDate, setSelectedDate] = useState<string>(
    entry?.date ? format(new Date(entry.date), "yyyy-MM-dd") : ""
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
  const [videoUrl, setVideoUrl] = useState(entry?.videoUrl || "");
  const [videoPlatform, setVideoPlatform] = useState<
    "youtube" | "vimeo" | null
  >(entry?.videoPlatform || null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string>("");
  const [isValidatingVideo, setIsValidatingVideo] = useState(false);
  const [isCompressingVideo, setIsCompressingVideo] = useState(false);
  const [videoCompressionProgress, setVideoCompressionProgress] = useState(0);
  const [compressionFailed, setCompressionFailed] = useState(false);
  const [email, setEmail] = useState<string>("");

  console.log("useForecast params:", {
    regionId: selectedBeach?.regionId || "",
    date: selectedDate,
    selectedBeach,
  });

  const {
    data: forecastData,
    isLoading: isLoadingForecast,
    error: forecastError,
  } = useQuery({
    queryKey: ["forecast", selectedBeach?.regionId, selectedDate],
    queryFn: async () => {
      if (!selectedBeach?.regionId || !selectedDate) {
        // Return 'unknown' forecast instead of throwing
        return {
          id: "unknown",
          date: new Date(selectedDate || new Date()),
          regionId: selectedBeach?.regionId || "unknown",
          windSpeed: "unknown" as any,
          windDirection: "unknown" as any,
          swellHeight: "unknown" as any,
          swellPeriod: "unknown" as any,
          swellDirection: "unknown" as any,
        };
      }

      const dateStr = new Date(selectedDate).toISOString().split("T")[0];
      // Use Next.js API route which proxies to backend
      // Backend expects 'forecastDate' parameter, not 'date'
      const url = `/api/surf-conditions?regionId=${selectedBeach.regionId}&forecastDate=${dateStr}`;

      console.log("[RaidLogForm] Fetching forecast from:", url);
      const response = await fetch(url, {
        credentials: "include", // Include cookies for auth
      });

      if (!response.ok) {
        console.warn("API error:", response.status, response.statusText);
        // Instead of throwing, return 'unknown' forecast
        if (!selectedBeach?.regionId || !selectedDate) {
          throw new Error("Missing beach or date");
        }
        return {
          id: "unknown",
          date: new Date(selectedDate),
          regionId: selectedBeach.regionId,
          windSpeed: "unknown" as any,
          windDirection: "unknown" as any,
          swellHeight: "unknown" as any,
          swellPeriod: "unknown" as any,
          swellDirection: "unknown" as any,
        };
      }

      const data = await response.json();
      console.log("[RaidLogForm] API response structure:", {
        hasForecast: !!data?.forecast,
        hasScores: !!data?.scores,
        forecastKeys: data?.forecast ? Object.keys(data.forecast) : [],
        selectedBeachId: selectedBeach?.id,
        forecastId: data?.forecast?.id,
        forecastDate: data?.forecast?.date,
        forecastWindSpeed: data?.forecast?.windSpeed,
        forecastSwellHeight: data?.forecast?.swellHeight,
        fullResponse: data, // Log full response for debugging
      });

      // The /api/filtered-beaches endpoint returns: { beaches: [], scores: {}, forecast: {...} }
      // Extract forecast from the response
      if (data?.forecast) {
        console.log("[RaidLogForm] Using forecast from data.forecast:", {
          forecastId: data.forecast.id,
          date: data.forecast.date,
          selectedDate: dateStr,
          hasId: !!data.forecast.id,
          hasWindSpeed: data.forecast.windSpeed !== undefined,
          hasSwellHeight: data.forecast.swellHeight !== undefined,
          windSpeed: data.forecast.windSpeed,
          swellHeight: data.forecast.swellHeight,
        });
        return data.forecast;
      }

      // If forecast is missing, try to extract from scores (for specific beach)
      if (data?.scores && selectedBeach?.id) {
        const beachScore = data.scores[selectedBeach.id];
        if (beachScore?.forecastData) {
          console.log("[RaidLogForm] Using forecast from beach score");
          return beachScore.forecastData;
        }
      }

      // If we have scores, try to get the first beach's forecast
      if (data?.scores) {
        const firstBeachId = Object.keys(data.scores)[0];
        if (firstBeachId && data.scores[firstBeachId]?.forecastData) {
          console.log("[RaidLogForm] Using forecast from first beach score");
          return data.scores[firstBeachId].forecastData;
        }
      }

      // If the entire response is a forecast object (some endpoints return it directly)
      if (data?.id && data?.windSpeed !== undefined) {
        console.log("[RaidLogForm] Using entire response as forecast");
        return data;
      }

      console.warn(
        "[RaidLogForm] No usable forecast data in API response, returning 'unknown' values:",
        {
          dataKeys: Object.keys(data || {}),
          forecast: data?.forecast,
          scoresCount: data?.scores ? Object.keys(data.scores).length : 0,
        }
      );

      // Return a forecast object with 'unknown' values instead of throwing an error
      return {
        id: "unknown",
        date: new Date(selectedDate),
        regionId: selectedBeach.regionId,
        windSpeed: "unknown" as any,
        windDirection: "unknown" as any,
        swellHeight: "unknown" as any,
        swellPeriod: "unknown" as any,
        swellDirection: "unknown" as any,
      };
    },
    enabled: !!selectedBeach?.regionId && !!selectedDate,
    staleTime: 1000 * 60 * 5,
  });

  // Add debug logging
  useEffect(() => {
    console.log("Forecast Data Debug:", {
      forecastData,
      selectedBeach,
      selectedDate,
      isLoadingForecast,
      hasData: !!forecastData,
      forecastProps: forecastData && {
        id: forecastData.id,
        windSpeed: forecastData.windSpeed,
        windDirection: forecastData.windDirection,
        swellHeight: forecastData.swellHeight,
        swellPeriod: forecastData.swellPeriod,
        swellDirection: forecastData.swellDirection,
      },
    });
  }, [forecastData, selectedBeach, selectedDate, isLoadingForecast]);

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

    const hasChanges =
      selectedDate !== format(new Date(entry.date), "yyyy-MM-dd") ||
      selectedBeach?.name !== entry.beachName ||
      surferRating !== entry.surferRating ||
      comments !== entry.comments ||
      isAnonymous !== entry.isAnonymous ||
      isPrivate !== entry.isPrivate ||
      JSON.stringify(imageUrls) !==
        JSON.stringify(entry?.imageUrl ? [entry.imageUrl] : []) ||
      selectedVideo !== null ||
      videoUrl !== entry.videoUrl ||
      videoPlatform !== entry.videoPlatform ||
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
    selectedVideo,
    videoUrl,
    videoPlatform,
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
        setSelectedDate(format(new Date(entry.date), "yyyy-MM-dd"));
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
      if (entry.videoUrl !== undefined && entry.videoUrl !== null) {
        setVideoUrl(entry.videoUrl);
      }
      if (entry.videoPlatform !== undefined && entry.videoPlatform !== null) {
        setVideoPlatform(entry.videoPlatform as "youtube" | "vimeo" | null);
      }
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
      // If entry has a videoUrl but no platform, it's an uploaded video
      if (entry.videoUrl && !entry.videoPlatform && !videoPreview) {
        setVideoPreview(entry.videoUrl);
        setUploadedVideoUrl(entry.videoUrl);
      }
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
          setVideoUrl(state.videoUrl || "");
          setVideoPlatform(state.videoPlatform || null);
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
      videoUrl,
      videoPlatform,
      selectedVideo: null, // Don't store File object
      uploadedVideoUrl,
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

    // Prevent submission if compression is in progress or failed
    if (isCompressingVideo) {
      toast.warning(
        "Please wait for video compression to complete before submitting."
      );
      return;
    }

    if (compressionFailed) {
      toast.error(
        "Video compression failed. Please remove the video or use a YouTube/Vimeo link instead."
      );
      return;
    }

    if (!user) {
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

    if (!selectedBeach || !selectedDate) {
      toast.error("Please select a beach and date");
      return;
    }

    // For editing, allow using existing forecast if no new forecast data
    // Check for forecast data by looking for required properties (windSpeed, swellHeight, etc.)
    const hasForecastData =
      forecastData &&
      (forecastData.id ||
        forecastData.windSpeed !== undefined ||
        forecastData.swellHeight !== undefined);

    // Allow submission even without forecast data (will use 'unknown' values)
    // Removed the error toast - forecast will show 'unknown' instead

    setIsSubmitting(true);
    try {
      // Images are already uploaded via MultiImageUploader component
      // Just use the imageUrls state
      const finalImageUrls = imageUrls.length > 0 ? imageUrls : [];

      // Upload video if selected
      let uploadedVideoUrlFinal = null;
      if (selectedVideo) {
        // Re-validate video before upload to prevent submission if invalid
        const validation = await validateVideoFile(selectedVideo);
        if (!validation.valid) {
          setIsSubmitting(false);
          toast.error(
            validation.error ||
              "Invalid video file. Please select a different video."
          );
          return; // Stop submission if video is invalid
        }

        try {
          // Always use regular upload route (avoids CORS issues with presigned URLs)
          console.log("[RaidLogForm] Uploading video via regular route...");
          const formData = new FormData();
          formData.append("file", selectedVideo);
          formData.append("type", "video");

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
            credentials: "include", // Include cookies for authentication
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errorMessage =
              errorData.error || errorData.message || "Failed to upload video";

            // Provide more specific error messages
            if (response.status === 413) {
              const fileSizeMB = (selectedVideo.size / (1024 * 1024)).toFixed(
                2
              );
              if (selectedVideo.size > 4.5 * 1024 * 1024) {
                errorMessage =
                  errorData.error ||
                  `Video file (${fileSizeMB}MB) exceeds the 4.5MB upload limit. Please compress your video using external tools or use a YouTube/Vimeo link instead.`;
              } else {
                errorMessage =
                  errorData.error ||
                  `Video file is too large (${fileSizeMB}MB). Maximum allowed size is 100MB.`;
              }
            } else if (response.status === 400) {
              errorMessage =
                errorData.error ||
                "Invalid video file. Please select a valid video file (MP4, WebM, MOV, or AVI).";
            }

            console.error(
              "[RaidLogForm] Upload error:",
              errorMessage,
              errorData,
              `Status: ${response.status}`
            );
            toast.error(`Video upload failed: ${errorMessage}`);
            setIsSubmitting(false);
            return;
          } else {
            const data = await response.json();
            uploadedVideoUrlFinal = data.videoUrl;
            if (!uploadedVideoUrlFinal) {
              console.warn(
                "[RaidLogForm] Video upload succeeded but no videoUrl returned"
              );
              toast.warning(
                "Video uploaded but URL not received. Log will be created without video."
              );
            } else {
              console.log(
                "[RaidLogForm] Video uploaded successfully:",
                uploadedVideoUrlFinal
              );
            }
          }
        } catch (uploadError) {
          console.error("[RaidLogForm] Video upload exception:", uploadError);

          // Provide more specific error messages
          let errorMessage = "Unknown error";
          if (uploadError instanceof Error) {
            errorMessage = uploadError.message;
            if (
              uploadError.message.includes("Failed to fetch") ||
              uploadError.name === "TypeError"
            ) {
              errorMessage =
                "Network error: Unable to connect to upload server. Please check your internet connection and try again.";
            }
          }

          toast.error(`Video upload error: ${errorMessage}`, {
            duration: 8000, // Show longer for important errors
          });
          // Stop submission if video upload fails
          setIsSubmitting(false);
          return;
        }
      }

      // Use imageUrls array - first image is the primary imageUrl for backward compatibility
      const finalImageUrl =
        finalImageUrls.length > 0 ? finalImageUrls[0] : undefined;

      // Determine final video URL
      // Priority: uploaded video > existing entry video > video URL input
      // Only use existing entry video if we're editing AND no new video was selected
      let finalVideoUrl: string | undefined = undefined;

      if (uploadedVideoUrlFinal) {
        // New video was uploaded successfully
        finalVideoUrl = uploadedVideoUrlFinal;
      } else if (entry?.videoUrl && !selectedVideo && !videoUrl) {
        // Editing existing entry, no new video selected, use existing
        finalVideoUrl = entry.videoUrl;
      } else if (videoUrl && videoUrl.trim() !== "") {
        // Video URL was provided (YouTube/Vimeo)
        finalVideoUrl = videoUrl;
      } else {
        // No video - set to empty string (schema expects string, not null/undefined)
        finalVideoUrl = "";
      }

      // If we have an uploaded video, don't use platform
      const finalVideoPlatform =
        uploadedVideoUrlFinal ||
        (entry?.videoUrl && !selectedVideo && !videoUrl && entry?.videoPlatform)
          ? null // Uploaded videos don't have a platform
          : videoPlatform;

      const logData = {
        selectedBeach,
        selectedDate,
        forecastData: forecastData || entry?.forecast,
        isAnonymous,
        surferRating,
        comments,
        isPrivate,
        uploadedImageUrl: finalImageUrl,
        imageUrls: finalImageUrls, // Send all images
        videoUrl: finalVideoUrl,
        videoPlatform: finalVideoPlatform,
        email: email.trim() || user?.email || userEmail || "", // Use provided email or fallback to user's email
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
      // Clean up video preview URL
      if (videoPreview && videoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [user, videoPreview]);

  if (!isOpen) return null;

  // If we have user data, proceed immediately (don't wait for status to update)
  if (isAuthLoading || isBeachesLoading) {
    // Show loader while auth or beaches are loading
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white p-6 rounded-lg">
          <p className="font-primary">Loading...</p>
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
                    Surf Conditions
                  </h3>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    {isLoadingForecast ? (
                      <div className="text-gray-600 font-primary">
                        Loading forecast data...
                      </div>
                    ) : forecastData ? (
                      <SurfForecastWidget forecast={forecastData} />
                    ) : (
                      <SurfForecastWidget
                        forecast={{
                          id: "unknown",
                          date: selectedDate
                            ? new Date(selectedDate)
                            : new Date(),
                          regionId: selectedBeach?.regionId || "unknown",
                          windSpeed: "unknown" as any,
                          windDirection: "unknown" as any,
                          swellHeight: "unknown" as any,
                          swellPeriod: "unknown" as any,
                          swellDirection: "unknown" as any,
                        }}
                      />
                    )}
                  </div>
                </div>
              )}

              {(forecastData || entry?.forecast) && (
                <div className="step">
                  <h3 className="text-[16px] font-semibold mb-3 font-primary text-[var(--color-primary)] flex items-center">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white mr-2 text-sm">
                      4
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
                      5
                    </span>
                    Add Comments
                  </h3>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value.slice(0, 140))}
                    className="w-full p-2 border rounded-lg"
                    rows={4}
                    placeholder="How was your session?"
                    maxLength={140}
                  />
                  <div className="text-sm text-gray-500 mt-1 font-primary">
                    Characters remaining: {250 - comments.length}
                  </div>
                </div>
              )}

              {(surferRating > 0 || entry?.id) && (
                <div className="step">
                  <h3 className="text-[16px] font-semibold mb-3 font-primary text-[var(--color-primary)] flex items-center">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white mr-2 text-sm">
                      6
                    </span>
                    Add Photos (Optional)
                  </h3>
                  <MultiImageUploader
                    images={imageUrls}
                    onImagesChange={setImageUrls}
                    maxImages={10}
                  />
                </div>
              )}

              {(surferRating > 0 || entry?.id) && (
                <div className="step">
                  <h3 className="text-[16px] font-semibold mb-3 font-primary text-[var(--color-primary)] flex items-center">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white mr-2 text-sm">
                      7
                    </span>
                    Add Video (Optional)
                  </h3>
                  <div className="space-y-4">
                    {/* Video File Upload */}
                    <div>
                      <label className="block text-sm font-primary mb-1">
                        Upload Video File (Max 100MB)
                      </label>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          setIsValidatingVideo(true);
                          const validation = await validateVideoFile(file);
                          setIsValidatingVideo(false);

                          if (!validation.valid) {
                            toast.error(
                              validation.error || "Invalid video file"
                            );
                            return;
                          }

                          // If file is over 4.5MB, compression is REQUIRED (Vercel body size limit)
                          const FILE_SIZE_THRESHOLD = 4.5 * 1024 * 1024;
                          if (file.size > FILE_SIZE_THRESHOLD) {
                            setIsCompressingVideo(true);
                            setVideoCompressionProgress(0);

                            try {
                              const compressedFile =
                                await compressVideoIfNeeded(
                                  file,
                                  (progress) => {
                                    setVideoCompressionProgress(progress);
                                  }
                                );

                              if (compressedFile.size < FILE_SIZE_THRESHOLD) {
                                // Compression successful - file is now under limit
                                toast.success(
                                  `Video compressed from ${(file.size / (1024 * 1024)).toFixed(2)}MB to ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB`
                                );
                                setSelectedVideo(compressedFile);
                                setVideoPreview(
                                  URL.createObjectURL(compressedFile)
                                );
                                setCompressionFailed(false); // Reset failure flag on success
                              } else if (compressedFile.size < file.size) {
                                // Compression helped but still over limit
                                toast.warning(
                                  `Video compressed from ${(file.size / (1024 * 1024)).toFixed(2)}MB to ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB, but still over 4.5MB limit. Upload may fail. Consider using a YouTube/Vimeo link instead.`,
                                  { duration: 10000 }
                                );
                                setSelectedVideo(compressedFile);
                                setVideoPreview(
                                  URL.createObjectURL(compressedFile)
                                );
                                setCompressionFailed(false); // Reset failure flag - user can still try
                              } else {
                                // Compression didn't help
                                toast.error(
                                  `Video compression failed to reduce size. Your video (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds the 4.5MB upload limit. Please compress it using external tools or use a YouTube/Vimeo link instead.`,
                                  { duration: 10000 }
                                );
                                // Clear the selection since it won't work
                                setSelectedVideo(null);
                                setVideoPreview(null);
                                setCompressionFailed(true);
                                return;
                              }
                            } catch (compressionError) {
                              console.error(
                                "Video compression failed:",
                                compressionError
                              );

                              // Provide more helpful error messages based on error type
                              let errorMessage = `Video compression failed. Your video (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds the 4.5MB upload limit.`;

                              if (compressionError instanceof Error) {
                                if (
                                  compressionError.message.includes("timed out")
                                ) {
                                  errorMessage = compressionError.message;
                                } else if (
                                  compressionError.message.includes("stuck")
                                ) {
                                  errorMessage = compressionError.message;
                                } else {
                                  errorMessage += ` ${compressionError.message}`;
                                }
                              }

                              errorMessage +=
                                " Please try using a YouTube/Vimeo link instead, or compress the video using external tools.";

                              toast.error(errorMessage, { duration: 12000 });
                              // Clear the selection since it won't work
                              setSelectedVideo(null);
                              setVideoPreview(null);
                              setCompressionFailed(true);
                              return;
                            } finally {
                              setIsCompressingVideo(false);
                              setVideoCompressionProgress(0);
                            }
                          } else {
                            // File is small enough, use as-is
                            setSelectedVideo(file);
                            setVideoPreview(URL.createObjectURL(file));
                            setCompressionFailed(false); // Reset failure flag if new file is valid
                          }

                          setVideoUrl(""); // Clear URL if file is selected
                          setVideoPlatform(null);
                        }}
                        className="w-full p-2 border rounded-lg"
                        aria-label="Upload video file"
                      />
                      {isValidatingVideo && (
                        <p className="text-sm text-gray-500 mt-1 font-primary">
                          Validating video...
                        </p>
                      )}
                      {isCompressingVideo && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 mb-1 font-primary">
                            Compressing video...{" "}
                            {Math.round(videoCompressionProgress)}%
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-[var(--color-tertiary)] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${videoCompressionProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {selectedVideo && (
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm font-primary">
                              {selectedVideo.name} (
                              {Math.round(selectedVideo.size / 1024)}KB)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedVideo(null);
                                setVideoPreview(null);
                                if (videoPreview) {
                                  URL.revokeObjectURL(videoPreview);
                                }
                              }}
                              className="text-red-500 hover:text-red-700"
                              aria-label="Remove video"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          {videoPreview && (
                            <video
                              src={videoPreview}
                              controls
                              preload="none"
                              className="w-full rounded-md max-h-48"
                            />
                          )}
                        </div>
                      )}
                      {uploadedVideoUrl && !selectedVideo && (
                        <div className="mt-2">
                          <video
                            src={uploadedVideoUrl}
                            controls
                            preload="none"
                            className="w-full rounded-md max-h-48"
                          />
                        </div>
                      )}
                    </div>

                    <div className="text-center text-sm text-gray-500 font-primary">
                      OR
                    </div>

                    {/* Video URL Input (for YouTube/Vimeo) */}
                    <div>
                      <label className="block text-sm font-primary mb-1">
                        Video Platform
                      </label>
                      <select
                        value={videoPlatform || ""}
                        onChange={(e) => {
                          setVideoPlatform(
                            e.target.value
                              ? (e.target.value as "youtube" | "vimeo")
                              : null
                          );
                          if (selectedVideo) {
                            setSelectedVideo(null);
                            setVideoPreview(null);
                            if (videoPreview) {
                              URL.revokeObjectURL(videoPreview);
                            }
                          }
                        }}
                        className="w-full p-2 border rounded-lg"
                        aria-label="Select video platform"
                      >
                        <option value="">Select Platform</option>
                        <option value="youtube">YouTube</option>
                        <option value="vimeo">Vimeo</option>
                      </select>
                    </div>

                    {videoPlatform && (
                      <div>
                        <label className="block text-sm font-primary mb-1">
                          Video URL
                        </label>
                        <input
                          type="url"
                          value={videoUrl}
                          onChange={(e) => {
                            setVideoUrl(e.target.value);
                            // Reset compression failure flag when user provides a URL
                            if (e.target.value.trim() !== "") {
                              setCompressionFailed(false);
                            }
                          }}
                          placeholder={`Enter ${videoPlatform === "youtube" ? "YouTube" : "Vimeo"} URL`}
                          className="w-full p-2 border rounded-lg"
                        />
                        {videoUrl &&
                          !validateVideoUrl(videoUrl, videoPlatform) && (
                            <p className="text-red-500 text-sm mt-1">
                              Please enter a valid{" "}
                              {videoPlatform === "youtube"
                                ? "YouTube"
                                : "Vimeo"}{" "}
                              URL
                            </p>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="step border-t pt-6">
                <h3 className="text-[16px] font-semibold mb-4 font-primary text-[var(--color-primary)] flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--color-tertiary)] text-white mr-2 text-sm">
                    8
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
                  isSubmitting ||
                  isCompressingVideo ||
                  compressionFailed
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
