"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import Textarea from "../ui/textarea";
import { Input } from "../ui/input";
import { Button } from "../ui/Button";

interface BioSectionProps {
  initialBio?: string;
  initialLink?: string;
  isOwnProfile: boolean;
  userId: string;
  className?: string;
}

export default function BioSection({
  initialBio = "",
  initialLink = "",
  isOwnProfile,
  userId,
  className,
}: BioSectionProps) {
  const queryClient = useQueryClient();

  const updateBioMutation = useMutation({
    mutationFn: async ({ bio, link }: { bio: string; link: string }) => {
      const response = await fetch(`/api/user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, link }),
      });
      if (!response.ok) throw new Error("Failed to save");
      return response.json();
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["user", userId] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(["user", userId]);

      // Optimistically update to new value
      queryClient.setQueryData(["user", userId], (old: any) => ({
        ...old,
        bio: newData.bio,
        link: newData.link,
      }));

      return { previousData };
    },
    onError: (err, newData, context) => {
      // Rollback to previous value on error
      queryClient.setQueryData(["user", userId], context?.previousData);
      toast.error("Failed to save bio");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
    onSuccess: () => {
      toast.success("Bio updated successfully!");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    },
  });

  return (
    <div className={`space-y-2 max-w-[540px] ${className || ""}`}>
      <h3 className="text-lg font-semibold font-primary mb-2">About</h3>
      {isOwnProfile ? (
        <Textarea
          value={initialBio}
          onChange={(e) =>
            queryClient.setQueryData(["user", userId], (old: any) => ({
              ...old,
              bio: e.target.value,
            }))
          }
          placeholder="Something about you..."
          className="min-h-[120px]"
        />
      ) : (
        <p className="text-gray-600">{initialBio || "No bio yet"}</p>
      )}

      <h3 className="text-lg font-semibold font-primary mb-2">Website</h3>
      {isOwnProfile ? (
        <Input
          type="url"
          value={initialLink}
          onChange={(e) =>
            queryClient.setQueryData(["user", userId], (old: any) => ({
              ...old,
              link: e.target.value,
            }))
          }
          placeholder="Add your website/social link"
        />
      ) : initialLink ? (
        <a
          href={initialLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-black hover:underline"
        >
          {initialLink}
        </a>
      ) : null}

      {isOwnProfile && (
        <div className="flex justify-end">
          <Button
            onClick={() =>
              updateBioMutation.mutate({
                bio: initialBio,
                link: initialLink,
              })
            }
            disabled={updateBioMutation.isPending}
            className="mt-4"
          >
            {updateBioMutation.isPending ? "Saving..." : "Save Bio"}
          </Button>
        </div>
      )}
    </div>
  );
}
