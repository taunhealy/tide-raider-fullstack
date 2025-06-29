// hooks/useCreateLog.ts
import { Beach } from "@prisma/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCreateLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      selectedBeach: Beach;
      selectedDate: string;
      forecastData: any;
      isAnonymous: boolean;
      session: any;
      userEmail?: string;
      surferRating: number;
      comments: string;
      isPrivate: boolean;
      uploadedImageUrl?: string;
      videoUrl?: string;
      videoPlatform?: string | null;
    }) => {
      const newEntry = {
        beachId: data.selectedBeach.id,
        beachName: data.selectedBeach.name,
        date: new Date(data.selectedDate),
        surferName: data.isAnonymous
          ? "Anonymous"
          : (data.session?.user as { name?: string })?.name ||
            data.userEmail?.split("@")[0] ||
            "Anonymous Surfer",
        surferRating: data.surferRating,
        comments: data.comments,
        regionId: data.selectedBeach.regionId,
        waveType: data.selectedBeach.waveType,
        isAnonymous: data.isAnonymous,
        isPrivate: data.isPrivate,
        forecastId: data.forecastData.id,
        imageUrl: data.uploadedImageUrl || null,
        videoUrl: data.videoUrl || null,
        videoPlatform: data.videoPlatform || null,
      };

      const response = await fetch("/api/raid-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      });

      if (!response.ok) throw new Error("Failed to create log entry");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raidLogs"] });
      toast.success("Session logged successfully!");
    },
  });
}
