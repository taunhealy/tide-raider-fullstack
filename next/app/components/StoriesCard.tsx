"use client";

import { useState, useEffect } from "react";
import { Story } from "@/app/types/stories";
import { useSession } from "next-auth/react";
import { Edit2, Trash2, Calendar, MapPin, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/app/lib/utils";
import { Inter } from "next/font/google";
import { EditPostModal } from "./EditPostModal";
import { ViewPostModal } from "./ViewPostModal";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

interface PostCardProps {
  story: Story;
  isAuthor: boolean;
  beaches: any[];
}

export function PostCard({ story, isAuthor, beaches }: PostCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();

  const CHARACTER_LIMIT = 360;
  const truncatedDetails =
    story.details.length > CHARACTER_LIMIT
      ? `${story.details.substring(0, CHARACTER_LIMIT)}...`
      : story.details;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/stories/${story.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete story");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this story?")) {
      deleteMutation.mutate();
    }
  };

  // Handle card click
  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, a")) {
      return;
    }
    router.push(`?viewStory=${story.id}`, { scroll: false });
    setIsViewModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    router.push("/chronicles", { scroll: false });
    setIsEditModalOpen(false);
  };

  // Check URL params on mount and when they change
  useEffect(() => {
    const viewStory = searchParams.get("viewStory");
    const editStory = searchParams.get("editStory");
    if (viewStory === story.id) setIsViewModalOpen(true);
    if (editStory === story.id) setIsEditModalOpen(true);
  }, [searchParams, story.id]);

  return (
    <>
      <article
        onClick={handleCardClick}
        className={cn(
          "group bg-[var(--color-bg-primary)] rounded-lg",
          "p-4 sm:p-4 md:p-6",
          "border border-[var(--color-border-light)]",
          "transition-all duration-300",
          "hover:border-[var(--color-border-medium)] hover:shadow-sm",
          "cursor-pointer"
        )}
      >
        {/* Header */}
        <div className="flex flex-col gap-2 sm:gap-4 mb-4 sm:mb-4">
          <div className="space-y-2">
            <span
              className={cn(
                "text-xs bg-[var(--color-tertiary)] text-[var(--color-brand-primary)]",
                "py-1 px-2 sm:px-3 rounded",
                "font-secondary font-semibold uppercase",
                "inline-block"
              )}
            >
              {story.category}
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)] font-primary">
              {story.title}
            </h3>

            <div className="flex items-center flex-wrap gap-2 max-w-[200px]">
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] truncate">
                <Link
                  href={`/profile/${story.author.id}`}
                  className="hover:text-[var(--color-brand-primary)] transition-colors inline-block whitespace-nowrap hover:underline font-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  {story.author.name}
                </Link>{" "}
                •{" "}
                {formatDistanceToNow(new Date(story.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3 sm:space-y-3">
          {/* Location and Date */}
          <div className="flex flex-col sm:flex-row gap-2 text-xs sm:text-sm text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="truncate">
                {story.customBeach ||
                  (typeof story.beach === "string"
                    ? story.beach
                    : story.beach?.name?.toString() || "")}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{new Date(story.date).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Story Details */}
          <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-line">
            {truncatedDetails}
            {story.details.length > CHARACTER_LIMIT && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`?story=${story.id}`, { scroll: false });
                  setIsEditModalOpen(true);
                }}
                className="block text-xs sm:text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-tertiary)] font-medium mt-2"
              >
                Read more
              </button>
            )}
          </p>

          {/* Link */}
          {story.link && (
            <a
              href={story.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-tertiary)] transition-colors"
            >
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>View Related Content</span>
            </a>
          )}
        </div>

        {/* Action Buttons */}
        {isAuthor && (
          <div className="flex items-center gap-2 mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-[var(--color-border-light)]">
            <button
              onClick={() => {
                router.push(`?editStory=${story.id}`, { scroll: false });
                setIsEditModalOpen(true);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs sm:text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 px-2 py-1 text-xs sm:text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              Delete
            </button>
          </div>
        )}
      </article>

      <ViewPostModal
        isOpen={isViewModalOpen}
        onClose={() => {
          const params = new URLSearchParams(window.location.search);
          params.delete("viewStory");
          router.replace(`${window.location.pathname}?${params.toString()}`, {
            scroll: false,
          });
          setIsViewModalOpen(false);
        }}
        story={story}
      />

      {isAuthor && (
        <EditPostModal
          isOpen={isEditModalOpen}
          onClose={handleModalClose}
          story={story}
          beaches={beaches}
        />
      )}
    </>
  );
}
