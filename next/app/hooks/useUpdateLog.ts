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
      videoPlatform?: string | null;
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
        // Convert null/undefined to empty string for URL fields (schema expects valid URL string or empty string, not null)
        // Empty string is valid, but if a value exists it must be a valid URL
        // Use first image from imageUrls array if provided, otherwise use uploadedImageUrl
        imageUrl:
          data.imageUrls && data.imageUrls.length > 0
            ? data.imageUrls[0]
            : (data.uploadedImageUrl && data.uploadedImageUrl.trim() !== ""
              ? data.uploadedImageUrl
              : ""),
        // Include imageUrls array if provided (for multiple images support)
        ...(data.imageUrls && data.imageUrls.length > 0 && { imageUrls: data.imageUrls }),
        videoUrl:
          data.videoUrl && data.videoUrl.trim() !== "" ? data.videoUrl : "",
        // Convert null to undefined for optional string fields (schema doesn't accept null)
        videoPlatform: data.videoPlatform || undefined,
        forecastId: data.forecastData?.id || undefined,
      };

      // Only include beachId if it's a valid UUID
      if (beachId) {
        payload.beachId = beachId;
      }

      return api.updateRaidLog(payload);
    },
    onSuccess: (_, variables) => {
      // Invalidate all log-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["raidLogs"] });
      queryClient.invalidateQueries({ queryKey: ["recentLogs"] });
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      queryClient.invalidateQueries({ queryKey: ["questLogs"] });
      queryClient.invalidateQueries({ queryKey: ["raidLog", variables.id] });
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
