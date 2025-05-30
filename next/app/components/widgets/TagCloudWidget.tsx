"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/app/lib/sanity";
import { useMemo } from "react";

interface TagCloudWidgetProps {
  title?: string;
  maxTags?: number;
  orderBy?: "popularity" | "alphabetical" | "recent";
  showTagCount?: boolean;
}

export default function TagCloudWidget({
  title = "Tags",
  maxTags = 20,
  orderBy = "popularity",
  showTagCount = true,
}: TagCloudWidgetProps) {
  const { data: tags, isLoading } = useQuery({
    queryKey: ["tags", orderBy],
    queryFn: async () => {
      const query = `
        *[_type == "postTag"] {
          title,
          slug,
          "postCount": count(*[_type == "post" && references(^._id)]),
          "lastUsed": *[_type == "post" && references(^._id)] | order(publishedAt desc)[0].publishedAt
        }
      `;
      return client.fetch(query);
    },
  });

  const sortedTags = useMemo(() => {
    if (!tags) return [];

    const tagsList = [...tags];
    switch (orderBy) {
      case "popularity":
        return tagsList.sort((a, b) => b.postCount - a.postCount);
      case "alphabetical":
        return tagsList.sort((a, b) => a.title.localeCompare(b.title));
      case "recent":
        return tagsList.sort(
          (a, b) =>
            new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
        );
      default:
        return tagsList;
    }
  }, [tags, orderBy]);

  // Calculate font sizes based on post count
  const getTagSize = (count: number) => {
    const sizes = ["text-xs", "text-sm", "text-base", "text-lg", "text-xl"];
    const max = Math.max(...sortedTags.map((t) => t.postCount));
    const index = Math.floor((count / max) * (sizes.length - 1));
    return sizes[index];
  };

  if (isLoading) return <div>Loading tags...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {sortedTags.slice(0, maxTags).map((tag: any) => (
          <Link
            key={tag.slug.current}
            href={`/blog?tag=${tag.slug.current}`}
            className={`
              ${getTagSize(tag.postCount)}
              inline-flex items-center
              hover:text-[var(--color-tertiary)]
              transition-colors
              ${tag.postCount > 0 ? "text-gray-700" : "text-gray-400"}
            `}
          >
            <span>{tag.title}</span>
            {showTagCount && (
              <span className="ml-1 text-xs text-gray-400">
                ({tag.postCount})
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
