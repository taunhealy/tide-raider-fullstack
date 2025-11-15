// hooks/useCreateLog.ts
import { Beach } from "@/app/types/beaches";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export function useCreateLog() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

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

      const payload = {
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create log entry");
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
