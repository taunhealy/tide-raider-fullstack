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

      // regionId must be a UUID (required by schema)
      // If regionId is not a UUID, try to get it from the region object
      let regionId = data.selectedBeach.regionId;
      if (!isUUID(regionId) && data.selectedBeach.region?.id) {
        regionId = data.selectedBeach.region.id;
      }

      // Validate regionId is a UUID before sending
      if (!isUUID(regionId)) {
        console.error("[useCreateLog] Invalid regionId:", {
          regionId,
          beachRegionId: data.selectedBeach.regionId,
          regionObject: data.selectedBeach.region,
          beachId: data.selectedBeach.id,
          beach: data.selectedBeach,
        });
        throw new Error(
          `Invalid region ID: ${regionId}. Region ID must be a valid UUID. Please select a beach from the search results.`
        );
      }

      console.log("[useCreateLog] Payload being sent:", {
        beachId,
        regionId,
        beachName: data.selectedBeach.name,
        hasRegion: !!data.selectedBeach.region,
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
        imageUrl: data.uploadedImageUrl || "",
        videoUrl: data.videoUrl || "",
        videoPlatform: data.videoPlatform || undefined,
        forecastId: data.forecastData?.id || undefined,
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
    onSuccess: () => {
      // Invalidate all log-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["raidLogs"] });
      queryClient.invalidateQueries({ queryKey: ["recentLogs"] });
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      queryClient.invalidateQueries({ queryKey: ["questLogs"] });
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
