"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { cn } from "@/app/lib/utils";
import type { Story } from "@/app/types/stories";
import RippleLoader from "./ui/RippleLoader";

export default function RecentChronicles() {
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["recentChronicles"],
    queryFn: async () => {
      const response = await fetch("/api/stories");
      if (!response.ok) throw new Error("Failed to fetch recent chronicles");
      const allStories = await response.json();
      return allStories.slice(0, 3);
    },
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="font-primary bg-[var(--color-bg-primary)] p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold text-gray-800`}>
          Recent Chronicles
        </h3>
        <Link
          href="/chronicles"
          className="text-sm text-[var(--color-text-secondary)] hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <RippleLoader isLoading={isLoading} />
        ) : (
          stories.map((story: Story) => (
            <div key={story.id} className="group">
              <article className="flex gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 mb-1 truncate group-hover:text-[var(--color-text-secondary)] transition-colors">
                    {story.title}
                  </h4>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {story.details}
                  </p>
                  <div className="mt-1 text-xs text-gray-400">
                    {new Date(story.date).toLocaleDateString()}
                  </div>
                </div>
              </article>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
