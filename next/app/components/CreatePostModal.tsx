"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { X, Loader2, Link as LinkIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";
import type { Beach } from "@/app/types/beaches";
import { STORY_CATEGORIES, type StoryCategory } from "@/app/lib/constants";
import { StoryBeach } from "../types/stories";
import confetti from "canvas-confetti";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  beaches: StoryBeach[];
}

export function CreatePostModal({
  isOpen,
  onClose,
  beaches,
}: CreatePostModalProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isCustomBeach, setIsCustomBeach] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    beachId: "",
    customBeach: "",
    date: new Date().toISOString().split("T")[0],
    details: "",
    category: "" as StoryCategory | "",
    link: "",
  });

  const createStoryMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/stories", {
        method: "POST",
        body: data,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create story");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      onClose();
      resetForm();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("date", formData.date);
    formDataToSend.append("details", formData.details);
    formDataToSend.append("category", formData.category);
    formDataToSend.append(
      "beach",
      isCustomBeach ? formData.customBeach : formData.beachId
    );
    formDataToSend.append("isCustomBeach", String(isCustomBeach));
    formDataToSend.append("link", formData.link);

    createStoryMutation.mutate(formDataToSend);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      beachId: "",
      customBeach: "",
      date: new Date().toISOString().split("T")[0],
      details: "",
      category: "",
      link: "",
    });
    setIsCustomBeach(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-[var(--color-bg-primary)] rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-light)]">
            <h3
              className={cn(
                "text-lg font-semibold text-[var(--color-text-primary)]"
              )}
            >
              Share Your Story
            </h3>
            <button
              onClick={onClose}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-tertiary)]"
                placeholder="Give your story a catchy title"
              />
            </div>

            {/* Beach Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                Beach
              </label>
              <select
                required
                value={formData.beachId}
                onChange={(e) =>
                  setFormData({ ...formData, beachId: e.target.value })
                }
                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-tertiary)]"
              >
                <option value="">Select a beach</option>
                <option value="other">Other</option>
                {beaches.map((beach) => (
                  <option key={beach.id} value={beach.id}>
                    {beach.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                Category
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as StoryCategory,
                  })
                }
                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-tertiary)]"
              >
                <option value="">Select a category</option>
                {STORY_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-tertiary)]"
              />
            </div>

            {/* Story Details */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                Story Details
              </label>
              <textarea
                required
                value={formData.details}
                onChange={(e) =>
                  setFormData({ ...formData, details: e.target.value })
                }
                rows={6}
                className="font-primary w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-md focus:ring-[var(--color-tertiary)]"
                placeholder="Share your wild story..."
              />
            </div>

            {/* Link */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                Related Link
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LinkIcon className="h-5 w-5 text-[var(--color-text-secondary)]" />
                </div>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) =>
                    setFormData({ ...formData, link: e.target.value })
                  }
                  className="font-primary w-full pl-10 px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-tertiary)]"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="font-primary px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createStoryMutation.isPending}
                className={cn(
                  "px-4 py-2 text-sm font-medium text-black bg-[var(--color-tertiary)] rounded-md",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-tertiary)]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center gap-2"
                )}
              >
                {createStoryMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : createStoryMutation.isError ? (
                  <>
                    <span>Try Again</span>
                  </>
                ) : (
                  <span>Post Story</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
