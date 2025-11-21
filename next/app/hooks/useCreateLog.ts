// hooks/useCreateLog.ts
import { Beach } from "@/app/types/beaches";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useBackendAuth } from "@/app/hooks/useBackendAuth";

export function useCreateLog() {
  const queryClient = useQueryClient();
  const { data: session } = useBackendAuth();

  return useMutation({
    mutationFn: async (data: {
      selectedBeach: Beach;
      selectedDate: string;
      forecastData: any;
      isAnonymous: boolean;
      surferRating: number;
      comments: string;
      isPrivate: boolean;
      uploadedImageUrl?: string;
      imageUrls?: string[];
      videoUrl?: string;
      videoPlatform?: string | null;
    }) => {
      if (!session?.user) {
        throw new Error("You must be logged in to create a log entry");
      }

      // Helper to check if a string is a valid UUID
      const isUUID = (str: string | undefined): boolean => {
        if (!str) return false;
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
      };

      // Only include beachId if it's a valid UUID (schema requires UUID or undefined)
      const beachId = isUUID(data.selectedBeach.id)
        ? data.selectedBeach.id
        : undefined;

      // regionId can be a UUID or a slug (backend accepts both)
      // Handle different beach data structures:
      // 1. regionId as string (slug or UUID)
      // 2. region object with id property
      // 3. regionId might be the region object itself (edge case)
      let regionId: string | undefined;

      // Check if regionId is a string
      if (typeof data.selectedBeach.regionId === "string") {
        regionId = data.selectedBeach.regionId;
      }
      // If regionId is an object, try to get id from it
      else if (
        data.selectedBeach.regionId &&
        typeof data.selectedBeach.regionId === "object"
      ) {
        regionId = (data.selectedBeach.regionId as any)?.id;
      }
      // Fallback to region object id
      if (!regionId && data.selectedBeach.region?.id) {
        regionId =
          typeof data.selectedBeach.region.id === "string"
            ? data.selectedBeach.region.id
            : undefined;
      }

      // Validate regionId exists and is a string (but don't require UUID format - backend accepts slugs)
      if (!regionId || typeof regionId !== "string" || regionId.trim() === "") {
        console.error("[useCreateLog] Missing or invalid regionId:", {
          regionId,
          regionIdType: typeof regionId,
          beachRegionId: data.selectedBeach.regionId,
          beachRegionIdType: typeof data.selectedBeach.regionId,
          regionObject: data.selectedBeach.region,
          beachId: data.selectedBeach.id,
          beach: data.selectedBeach,
        });
        throw new Error(
          `Missing region ID. Please select a beach from the search results.`
        );
      }

      console.log("[useCreateLog] Payload being sent:", {
        beachId,
        regionId,
        beachName: data.selectedBeach.name,
        hasRegion: !!data.selectedBeach.region,
      });

      // Extract forecast ID - handle different forecast data structures
      let forecastId: string | undefined = undefined;
      if (data.forecastData) {
        if (typeof data.forecastData === "string") {
          // If forecastData is already an ID string
          forecastId = data.forecastData;
        } else if (data.forecastData.id) {
          // If forecastData is an object with id
          forecastId = data.forecastData.id;
        }
      }

      console.log("[useCreateLog] Forecast data:", {
        hasForecastData: !!data.forecastData,
        forecastDataType: typeof data.forecastData,
        forecastId,
        forecastDataKeys:
          data.forecastData && typeof data.forecastData === "object"
            ? Object.keys(data.forecastData)
            : [],
      });

      const payload = {
        date: data.selectedDate,
        surferEmail: session.user.email || "",
        surferName: data.isAnonymous
          ? "Anonymous"
          : session.user.name || "Anonymous Surfer",
        beachName: data.selectedBeach.name,
        regionId: regionId,
        surferRating: data.surferRating,
        comments: data.comments || "",
        isPrivate: data.isPrivate || false,
        isAnonymous: data.isAnonymous || false,
        // Schema expects URL string or empty string, not null
        // Use first image from imageUrls array if provided, otherwise use uploadedImageUrl
        imageUrl:
          data.imageUrls && data.imageUrls.length > 0
            ? data.imageUrls[0]
            : data.uploadedImageUrl || "",
        // Include imageUrls array if provided (for multiple images support)
        ...(data.imageUrls &&
          data.imageUrls.length > 0 && { imageUrls: data.imageUrls }),
        videoUrl: data.videoUrl || "",
        videoPlatform: data.videoPlatform || undefined,
        forecastId: forecastId,
        // Also send forecast object for fallback lookup
        ...(data.forecastData &&
          typeof data.forecastData === "object" &&
          !data.forecastData.id && { forecast: data.forecastData }),
        // Only include beachId if it's a valid UUID
        ...(beachId && { beachId }),
      };

      const response = await fetch("/api/raid-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: "Failed to create log entry",
        }));
        console.error("[useCreateLog] Backend error:", error);
        throw new Error(
          error.message || error.error || "Failed to create log entry"
        );
      }
      return response.json();
    },
    onSuccess: async () => {
      // Invalidate all log-related queries to ensure fresh data
      // Use predicate to match all queries that start with these keys
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return (
            key === "raidLogs" ||
            key === "recentLogs" ||
            key === "logs" ||
            key === "questLogs"
          );
        },
      });
      // Force refetch to ensure data is fresh
      await queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return key === "raidLogs";
        },
      });
      toast.success("Session logged successfully!");
    },
    onError: (error) => {
      console.error("Log creation error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create log entry"
      );
    },
  });
}
