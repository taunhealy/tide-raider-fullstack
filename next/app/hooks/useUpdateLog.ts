// hooks/useUpdateLog.ts
import { Beach } from "@/app/types/beaches";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useBackendAuth } from "./useBackendAuth";
import api from "@/app/lib/api-client";

export function useUpdateLog() {
  const queryClient = useQueryClient();
  const { data: session } = useBackendAuth();
  const user = session?.user;

  return useMutation({
    mutationFn: async (data: {
      id: string;
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
      videoUrls?: any[];
      videoPlatform?: string | null;
      surfTimeSlot?: string;
      mostAccurateSource?: string;
    }) => {
      if (!user) {
        throw new Error("You must be logged in to update a log entry");
      }

      // Helper to check if a string is a valid UUID
      const isUUID = (str: string | undefined): boolean => {
        if (!str) return false;
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
      };

      // Handle regionId - can be UUID or slug
      let regionId: string | undefined;
      if (typeof data.selectedBeach.regionId === "string") {
        regionId = data.selectedBeach.regionId;
      } else if (
        data.selectedBeach.regionId &&
        typeof data.selectedBeach.regionId === "object"
      ) {
        regionId = (data.selectedBeach.regionId as any)?.id;
      }
      if (!regionId && data.selectedBeach.region?.id) {
        regionId =
          typeof data.selectedBeach.region.id === "string"
            ? data.selectedBeach.region.id
            : undefined;
      }

      // Only include beachId if it's a valid UUID (schema requires UUID or undefined)
      const beachId = isUUID(data.selectedBeach.id)
        ? data.selectedBeach.id
        : undefined;

      const payload: any = {
        id: data.id,
        date: data.selectedDate,
        surferEmail: user.email,
        surferName: data.isAnonymous
          ? "Anonymous"
          : user.name || "Anonymous Surfer",
        beachName: data.selectedBeach.name,
        regionId: regionId,
        surferRating: data.surferRating,
        comments: data.comments || "",
        isPrivate: data.isPrivate,
        isAnonymous: data.isAnonymous,
        surfTimeSlot: data.surfTimeSlot,
        mostAccurateSource: data.mostAccurateSource,
        // Convert null/undefined to empty string for URL fields (schema expects valid URL string or empty string, not null)
        // Empty string is valid, but if a value exists it must be a valid URL
        // Use first image from imageUrls array if provided, otherwise use uploadedImageUrl
        imageUrl:
          data.imageUrls && data.imageUrls.length > 0
            ? data.imageUrls[0]
            : data.uploadedImageUrl && data.uploadedImageUrl.trim() !== ""
              ? data.uploadedImageUrl
              : "",
        // Include imageUrls array if provided (for multiple images support)
        ...(data.imageUrls &&
          data.imageUrls.length > 0 && { imageUrls: data.imageUrls }),
        videoUrl:
          data.videoUrl && data.videoUrl.trim() !== "" ? data.videoUrl : "",
        // Include videoUrls array if provided
        ...(data.videoUrls && data.videoUrls.length > 0 && { videoUrls: data.videoUrls }),
        // Convert null to undefined for optional string fields (schema doesn't accept null)
        videoPlatform: data.videoPlatform || undefined,
        // Handle forecastId - can come from forecastData.id or forecastData itself if it's already an ID string
        forecastId:
          data.forecastData?.id ||
          (typeof data.forecastData === "string"
            ? data.forecastData
            : undefined),
      };

      // Only include beachId if it's a valid UUID
      if (beachId) {
        payload.beachId = beachId;
      }

      // Extract forecast ID - handle different forecast data structures
      let extractedForecastId: string | undefined = undefined;
      if (data.forecastData) {
        if (typeof data.forecastData === "string") {
          extractedForecastId = data.forecastData;
        } else if (data.forecastData.id) {
          extractedForecastId = data.forecastData.id;
        }
      }

      // Update payload with extracted forecast ID
      if (extractedForecastId) {
        payload.forecastId = extractedForecastId;
      }

      // Debug: Log forecast data
      console.log("[useUpdateLog] Forecast data:", {
        hasForecastData: !!data.forecastData,
        forecastDataType: typeof data.forecastData,
        forecastId: data.forecastData?.id,
        extractedForecastId,
        payloadForecastId: payload.forecastId,
        forecastDataKeys:
          data.forecastData && typeof data.forecastData === "object"
            ? Object.keys(data.forecastData)
            : [],
      });

      return api.updateRaidLog(payload);
    },
    onSuccess: async (_, variables) => {
      // Invalidate all log-related queries to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ["raidLogs"] });
      await queryClient.invalidateQueries({ queryKey: ["recentLogs"] });
      await queryClient.invalidateQueries({ queryKey: ["logs"] });
      await queryClient.invalidateQueries({ queryKey: ["questLogs"] });
      await queryClient.invalidateQueries({
        queryKey: ["raidLog", variables.id],
      });

      // Force refetch to ensure data is fresh (since refetchOnMount is false)
      await queryClient.refetchQueries({
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

      toast.success("Session updated successfully!");
    },
    onError: (error) => {
      console.error("Log update error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update log entry"
      );
    },
  });
}
