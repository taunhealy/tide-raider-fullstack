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
      videoUrl?: string;
      videoPlatform?: string | null;
    }) => {
      if (!user) {
        throw new Error("You must be logged in to update a log entry");
      }

      const payload = {
        id: data.id,
        date: data.selectedDate,
        surferEmail: user.email,
        surferName: data.isAnonymous
          ? "Anonymous"
          : user.name || "Anonymous Surfer",
        beachId: data.selectedBeach.id,
        beachName: data.selectedBeach.name,
        regionId: data.selectedBeach.regionId,
        surferRating: data.surferRating,
        comments: data.comments,
        isPrivate: data.isPrivate,
        isAnonymous: data.isAnonymous,
        imageUrl: data.uploadedImageUrl || null,
        videoUrl: data.videoUrl || null,
        videoPlatform: data.videoPlatform || null,
        forecastId: data.forecastData?.id || null,
      };

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
