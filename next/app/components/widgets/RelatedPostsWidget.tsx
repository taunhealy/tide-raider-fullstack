"use client";

import { urlForImage } from "@/app/lib/urlForImage";
import FormattedDate from "../FormattedDate";
import Link from "next/link";
import { Post } from "@/app/types/blog";
import { formatCountryList } from "@/app/lib/formatters";

interface RelatedPostsWidgetProps {
  title?: string;
  posts: Post[];
  maxPosts?: number;
}

export default function RelatedPostsWidget({
  title = "Related Posts",
  posts,
  maxPosts = 3,
}: RelatedPostsWidgetProps) {
  // Filter out posts without valid slugs
  const validPosts = posts?.filter((post) => post?.slug) || [];

  if (validPosts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold text-gray-800`}>{title}</h3>
      </div>
      <div className="space-y-6">
        {validPosts.slice(0, maxPosts).map((post) => (
          <Link
            key={typeof post.slug === "string" ? post.slug : post.slug.current}
            href={`/blog/${typeof post.slug === "string" ? post.slug : post.slug.current}`}
            className="group block"
          >
            <article className="flex gap-4">
              {post.mainImage && (
                <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg">
                  <img
                    src={
                      urlForImage(post.mainImage)
                        ?.width(80)
                        ?.height(80)
                        ?.url() || ""
                    }
                    alt={post.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 mb-1 truncate group-hover:text-[var(--color-text-secondary)] transition-colors">
                  {post.title}
                </h4>
                {post.countries && post.countries.length > 0 && (
                  <div className="text-[12px] text-[var(--color-text-tertiary)] mb-1 font-primary">
                    {formatCountryList(post.countries)}
                  </div>
                )}
                <p className="text-xs text-gray-500 line-clamp-2 font-primary">
                  {post.description}
                </p>
                {post.publishedAt && (
                  <div className="mt-1 text-xs text-gray-400">
                    <FormattedDate
                      date={new Date(post.publishedAt).getTime()}
                    />
                  </div>
                )}
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
