// hooks/useUpdateLog.ts
import { Beach } from "@/app/types/beaches";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export function useUpdateLog() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

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
      if (!session?.user) {
        throw new Error("You must be logged in to update a log entry");
      }

      const payload = {
        id: data.id,
        date: data.selectedDate,
        surferEmail: session.user.email,
        surferName: data.isAnonymous
          ? "Anonymous"
          : session.user.name || "Anonymous Surfer",
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

      const response = await fetch("/api/raid-logs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update log entry");
      }
      return response.json();
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
