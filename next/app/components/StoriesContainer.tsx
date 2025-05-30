"use client";

import React, { useState, useMemo } from "react";
import { signIn, useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/app/lib/utils";
import { Inter } from "next/font/google";
import { Plus, Filter } from "lucide-react";
import { CreatePostModal } from "./CreatePostModal";
import { PostCard } from "./StoriesCard";
import { Story, StoryBeach } from "@/app/types/stories";
import { STORY_CATEGORIES, type StoryCategory } from "@/app/lib/constants";
import { RandomLoader } from "@/app/components/ui/random-loader";

interface WildStoriesProps {
  beaches: StoryBeach[];
  userId: string;
}

const inter = Inter({ subsets: ["latin"] });

interface Filters {
  categories: StoryCategory[];
  regions: string[];
  dateRange: {
    start: string;
    end: string;
  };
}

const defaultFilters: Filters = {
  categories: [],
  regions: [],
  dateRange: {
    start: "",
    end: "",
  },
};

export default function WildStoriesContainer({
  beaches,
  userId,
}: WildStoriesProps) {
  const { data: session, status } = useSession();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: stories = [], isLoading } = useQuery<Story[]>({
    queryKey: ["stories", userId],
    queryFn: async () => {
      const url = userId ? `/api/stories?userId=${userId}` : "/api/stories";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch stories");
      return response.json();
    },
  });

  const filteredStories = useMemo(() => {
    let filtered = stories;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (story) =>
          story.title.toLowerCase().includes(query) ||
          story.details.toLowerCase().includes(query) ||
          story.beach?.name.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter((story) =>
        filters.categories.includes(story.category)
      );
    }

    // Update region filter to use the same beach lookup logic
    if (filters.regions.length > 0) {
      filtered = filtered.filter((story) => {
        const beach = beaches.find((b) => b.id === story.beach?.id);
        return filters.regions.includes(beach?.region ?? "Unknown");
      });
    }

    // Apply date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter((story) => {
        const storyDate = new Date(story.date);
        const start = filters.dateRange.start
          ? new Date(filters.dateRange.start)
          : null;
        const end = filters.dateRange.end
          ? new Date(filters.dateRange.end)
          : null;

        if (start && end) {
          return storyDate >= start && storyDate <= end;
        } else if (start) {
          return storyDate >= start;
        } else if (end) {
          return storyDate <= end;
        }
        return true;
      });
    }

    return filtered;
  }, [stories, searchQuery, filters, beaches]);

  // Get unique regions from stories instead of beaches
  const regions = useMemo(() => {
    return Array.from(
      new Set(
        stories.map((story) => {
          const beach = beaches.find((b) => b.id === story.beach?.id);
          return beach?.region ?? "Unknown";
        })
      )
    ).sort();
  }, [stories, beaches]);

  const toggleAllFilters = () => {
    if (
      Object.values(filters).some((f) =>
        Array.isArray(f) ? f.length > 0 : f.start || f.end
      )
    ) {
      // Clear all filters
      setFilters(defaultFilters);
    } else {
      // Select all filters
      setFilters({
        categories: STORY_CATEGORIES,
        regions: beaches.map((beach) => beach.region),
        dateRange: filters.dateRange, // Keep dateRange as is since it needs specific dates
      });
    }
  };

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)] px-2 sm:px-4 md:px-9 py-4 md:py-9">
      <div className="max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:gap-6 mb-6 md:mb-9">
          {/* Title and Create Button */}
          <div className="flex flex-col xs:flex-row xs:items-center gap-4 md:gap-9">
            <h1
              className={`text-xl md:text-2xl font-semibold ${inter.className}`}
            >
              Community Chronicles
            </h1>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-4">
            {/* Search Bar, Share Story Button, and Filter Toggle */}
            <div className="flex flex-col xs:flex-row items-center gap-3">
              <div className="flex w-full xs:w-auto gap-3">
                <input
                  type="text"
                  placeholder="Search stories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="font-primary w-full xs:w-[300px] md:w-[540px] px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-bg-tertiary)]"
                />
                {session ? (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-bg-tertiary)] text-white rounded-lg hover:bg-opacity-90 transition-colors"
                  >
                    <Plus className="w-4 h-4 font-primary" />
                    <span className="md:hidden font-primary">Share Story</span>
                    <span className="hidden md:inline font-primary">Share</span>
                  </button>
                ) : (
                  <button
                    onClick={() => signIn()}
                    className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-white text-[var(--color-bg-tertiary)] border-2 border-[var(--color-bg-tertiary)] rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span>Sign in to share stories</span>
                  </button>
                )}
                <button
                  onClick={toggleAllFilters}
                  className={cn(
                    "font-primary",
                    "text-black font-semibold",
                    "bg-white border border-gray-200",
                    "px-4 py-2",
                    "rounded-[21px]",
                    "flex-shrink-0 flex items-center justify-center gap-2",
                    "hover:bg-gray-50 transition-colors"
                  )}
                >
                  <span>Filters</span>
                  {Object.values(filters).some((f) =>
                    Array.isArray(f) ? f.length > 0 : f.start || f.end
                  ) && (
                    <span className="font-primary w-2 h-2 rounded-full bg-[var(--color-bg-tertiary)]" />
                  )}
                </button>
              </div>
            </div>

            {/* Scrollable Category Filters */}
            <div className="overflow-x-auto md:overflow-visible -mx-2 sm:-mx-4 px-2 sm:px-4">
              <div className="flex flex-nowrap md:flex-wrap gap-2 min-w-min md:min-w-0 pb-2">
                {STORY_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      const newCategories = filters.categories.includes(
                        category
                      )
                        ? filters.categories.filter((c) => c !== category)
                        : [...filters.categories, category];
                      setFilters({ ...filters, categories: newCategories });
                    }}
                    className={cn(
                      "px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-colors font-primary",
                      filters.categories.includes(category)
                        ? "bg-[var(--color-bg-tertiary)] text-white"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Region Filters */}
            <div className="overflow-x-auto md:overflow-visible -mx-2 sm:-mx-4 px-2 sm:px-4">
              <div className="flex flex-nowrap md:flex-wrap gap-2 min-w-min md:min-w-0 pb-2">
                {regions.map((region) => (
                  <button
                    key={region}
                    onClick={() => {
                      const newRegions = filters.regions.includes(region)
                        ? filters.regions.filter((r) => r !== region)
                        : [...filters.regions, region];
                      setFilters({ ...filters, regions: newRegions });
                    }}
                    className={cn(
                      "px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm whitespace-nowrap transition-colors font-primary",
                      "min-w-[120px] max-w-[150px] truncate",
                      "min-h-[36px] flex items-center justify-center gap-1.5",
                      "relative before:content-[''] before:w-2 before:h-2 before:rounded-full",
                      filters.regions.includes(region)
                        ? "bg-white text-[var(--color-bg-tertiary)] border-2 border-[var(--color-bg-tertiary)] before:bg-[var(--color-bg-tertiary)]"
                        : "bg-gray-100 text-gray-600 border-2 border-[var(--color-bg-primary)] hover:bg-gray-100 before:bg-transparent"
                    )}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stories Grid */}
        {isLoading ? (
          <RandomLoader isLoading={true} />
        ) : filteredStories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {filteredStories.map((story) => (
              <PostCard
                key={story.id}
                story={story}
                isAuthor={session?.user?.id === story.author.id}
                beaches={beaches}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-200 rounded-md">
            <p className="font-primary">No stories found. Share your story.</p>
          </div>
        )}
      </div>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        beaches={beaches}
      />
    </div>
  );
}
