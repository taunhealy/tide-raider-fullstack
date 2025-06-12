"use client";

import { urlForImage } from "@/app/lib/urlForImage";
import Link from "next/link";
import type { Post } from "@/app/types/blog";
import type { Trip } from "@/app/types/blog";
import { useQuery } from "@tanstack/react-query";
import { HARDCODED_COUNTRIES } from "@/app/lib/location/countries/constants";
import { PortableText } from "@portabletext/react";

interface Country {
  id: string;
  name: string;
}

interface BlogPostsSidebarProps {
  posts: {
    posts: Post[];
    trip: Trip;
    categories: { title: string; slug: string }[];
  };
  selectedRegion?: string;
  selectedCountry?: string;
  selectedContinent?: string;
}

export default function BlogPostsSidebar({
  posts,
  selectedRegion,
  selectedCountry,
  selectedContinent,
}: BlogPostsSidebarProps) {
  // Add this new query to fetch countries from database
  const { data: dbCountries } = useQuery<Country[]>({
    queryKey: ["countries"],
    queryFn: async () => {
      const res = await fetch("/api/location");
      if (!res.ok) throw new Error("Failed to fetch countries");
      return res.json();
    },
    staleTime: 1000 * 60 * 60, // Cache for an hour
  });

  // Fetch all recent blog posts (original functionality)
  const { data: freshPosts, isLoading: isLoadingAll } = useQuery({
    queryKey: ["blogPosts"],
    queryFn: async () => {
      // Use the posts API endpoint which returns all posts
      const res = await fetch("/api/posts");
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      return data;
    },
    initialData: posts,
    // Add these options for performance
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
    // Always enable this query so we have fallback data
    enabled: true,
  });

  // Replace the existing filteredPosts query with this one
  const { data: filteredPosts, isLoading } = useQuery({
    queryKey: [
      "filteredBlogPosts",
      selectedCountry,
      selectedContinent,
      dbCountries,
    ],
    queryFn: async () => {
      if (selectedCountry) {
        // Get travel posts
        const travelResponse = await fetch("/api/posts?category=travel");
        const travelData = await travelResponse.json();

        // Find the country name from the database countries
        const countryName =
          dbCountries?.find(
            (c: { id: string; name: string }) => c.id === selectedCountry
          )?.name || selectedCountry;

        // Filter posts by country using available data sources
        const filteredPosts = travelData.filter((post: Post) => {
          // Check if the post has the country in its countries array
          if (post.countries && post.countries.includes(selectedCountry)) {
            return true;
          }

          // Check if trip.country is using country ID format (e.g., "australia")
          if (post.trip && post.trip.country === selectedCountry) {
            return true;
          }

          // Check if trip.country is using country name format (e.g., "Australia")
          if (post.trip && post.trip.country === countryName) {
            return true;
          }

          // Check if the post title contains the country name (fallback)
          if (post.title && post.title.includes(countryName)) {
            return true;
          }

          return false;
        });

        return {
          posts: filteredPosts,
          trip: posts.trip,
          categories: posts.categories,
        };
      }

      return {
        posts: [],
        trip: posts.trip,
        categories: posts.categories,
      };
    },
    enabled: !!selectedCountry && !!dbCountries,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch travel category posts when no country-specific posts are found
  const { data: travelPosts, isLoading: isLoadingTravel } = useQuery({
    queryKey: ["travelCategoryPosts"],
    queryFn: async () => {
      const res = await fetch("/api/posts?category=travel");
      if (!res.ok) throw new Error("Failed to fetch travel posts");
      const data = await res.json();
      return {
        posts: Array.isArray(data.posts)
          ? data.posts
          : Array.isArray(data)
            ? data
            : [],
        trip: posts.trip,
        categories: posts.categories,
      };
    },
    // Add these options for performance
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: true,
  });

  // Update the display logic to be more explicit
  const displayData = (() => {
    if (selectedCountry || selectedContinent) {
      // If we have filtered posts, use them
      if (
        filteredPosts &&
        Array.isArray(filteredPosts.posts) &&
        filteredPosts.posts.length > 0
      ) {
        return filteredPosts;
      }
      // If no filtered posts found, fall back to travel posts
      return travelPosts;
    }
    // If no filters selected, show travel posts
    return travelPosts || freshPosts;
  })();

  // Make sure we handle both array and object formats
  const postsArray = displayData?.posts || [];
  const recentPosts = postsArray.slice(0, 3); // Get 3 most recent posts

  // Show loading state
  if (isLoading || isLoadingAll || isLoadingTravel) {
    return (
      <div className="bg-[var(--color-bg-primary)] p-6 rounded-lg shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="heading-6 mr-4">
            {selectedCountry
              ? `Posts from ${dbCountries?.find((c: Country) => c.id === selectedCountry)?.name || selectedCountry}`
              : selectedContinent
                ? `Posts from ${selectedContinent}`
                : "Travel Posts"}
          </h3>
          <Link
            href={
              selectedCountry || selectedContinent
                ? "/blog"
                : "/blog?category=travel"
            }
            className="text-[12px] hover:text-[var(--color-text-secondary)] hover:underline transition-colors font-primary ml-2 whitespace-nowrap"
          >
            View All
          </Link>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show empty state if no posts data at all
  if (!postsArray.length) {
    // If we have a country filter but no posts, fetch and show travel posts instead
    if (selectedCountry || selectedContinent) {
      // Use travel posts as fallback instead of freshPosts
      const fallbackPosts = travelPosts?.posts || [];

      return (
        <div className="bg-[var(--color-bg-primary)] p-6 rounded-lg shadow-sm mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="heading-6 mr-4">
              {selectedCountry
                ? `Travel Posts`
                : selectedContinent
                  ? `Travel Posts`
                  : "Travel Posts"}
            </h3>
            <Link
              href="/blog?category=travel"
              className="text-[12px] hover:text-[var(--color-text-secondary)] hover:underline transition-colors font-primary ml-2 whitespace-nowrap"
            >
              View All
            </Link>
          </div>

          {/* Show travel posts if available */}
          {fallbackPosts.length > 0 ? (
            <div className="space-y-6">
              {fallbackPosts.slice(0, 3).map((post: Post) => (
                <Link
                  key={
                    typeof post.slug === "string"
                      ? post.slug
                      : post.slug.current
                  }
                  href={`/blog/${typeof post.slug === "string" ? post.slug : post.slug.current}`}
                  className="group block"
                >
                  <article className="flex gap-4">
                    {post.mainImage && (
                      <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg">
                        <img
                          src={urlForImage(post.mainImage)
                            ?.width(80)
                            .height(80)
                            .url()}
                          alt={post.title || "Post title"}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="heading-7 mb-1 truncate group-hover:text-[var(--color-text-secondary)] transition-colors">
                        {post.title}
                      </h4>
                      {/* Location subtitle - try different sources in order of preference */}
                      {post.countries && post.countries.length > 0 ? (
                        <div className="mt-1 text-main text-[12px] text-[var(--color-text-tertiary)] font-primary">
                          {dbCountries
                            ?.filter((c: Country) =>
                              post.countries.includes(c.id)
                            )
                            .map((c: Country) => c.name)
                            .join(" • ") || "Travel Post"}
                        </div>
                      ) : post.trip ? (
                        <div className="mt-1 text-main text-[12px] text-[var(--color-text-tertiary)] font-primary">
                          {[post.trip.region, post.trip.country]
                            .filter(Boolean)
                            .join(" • ")}
                        </div>
                      ) : null}
                      {post.description && (
                        <p className="text-main text-[12px] line-clamp-2 font-primary">
                          {typeof post.description === "string" ? (
                            post.description
                          ) : (
                            <PortableText value={post.description} />
                          )}
                        </p>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-main text-sm font-primary">No travel posts.</p>
          )}
        </div>
      );
    }

    // Original empty state for when there are no filters
    return (
      <div className="bg-[var(--color-bg-primary)] p-6 rounded-lg shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="heading-6 mr-4">
            {selectedCountry
              ? `Posts from ${HARDCODED_COUNTRIES.find((c) => c.id === selectedCountry)?.name || selectedCountry}`
              : "Recent Posts"}
          </h3>
          <Link
            href="/blog"
            className="text-[12px] hover:text-[var(--color-text-secondary)] hover:underline transition-colors font-primary ml-2 whitespace-nowrap"
          >
            View All
          </Link>
        </div>
        <p className="text-main text-sm font-primary">No posts yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-bg-primary)] p-6 rounded-lg shadow-sm mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="heading-6 mr-4">
          {selectedCountry
            ? `Posts from ${dbCountries?.find((c: Country) => c.id === selectedCountry)?.name || selectedCountry}`
            : selectedContinent
              ? `Posts from ${selectedContinent}`
              : "Travel Posts"}
        </h3>
        <Link
          href={
            selectedCountry || selectedContinent
              ? "/blog"
              : "/blog?category=travel"
          }
          className="text-[12px] hover:text-[var(--color-text-secondary)] hover:underline transition-colors font-primary ml-2 whitespace-nowrap"
        >
          View All
        </Link>
      </div>

      <div className="space-y-6">
        {recentPosts.map((post: Post) => (
          <Link
            key={typeof post.slug === "string" ? post.slug : post.slug.current}
            href={`/blog/${typeof post.slug === "string" ? post.slug : post.slug.current}`}
            className="group block"
          >
            <article className="flex gap-4">
              {post.mainImage && (
                <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg">
                  <img
                    src={urlForImage(post.mainImage)
                      ?.width(80)
                      .height(80)
                      .url()}
                    alt={post.title || "Post title"}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="heading-7 mb-1 truncate group-hover:text-[var(--color-text-secondary)] transition-colors">
                  {post.title}
                </h4>
                {/* Location subtitle - try different sources in order of preference */}
                {post.countries && post.countries.length > 0 ? (
                  <div className="mt-1 text-main text-[12px] text-[var(--color-text-tertiary)] font-primary">
                    {dbCountries
                      ?.filter((c: Country) => post.countries.includes(c.id))
                      .map((c: Country) => c.name)
                      .join(" • ") || "Travel Post"}
                  </div>
                ) : post.trip ? (
                  <div className="mt-1 text-main text-[12px] text-[var(--color-text-tertiary)] font-primary">
                    {[post.trip.region, post.trip.country]
                      .filter(Boolean)
                      .join(" • ")}
                  </div>
                ) : null}
                {post.description && (
                  <p className="text-main text-[12px] line-clamp-2 font-primary">
                    {typeof post.description === "string" ? (
                      post.description
                    ) : (
                      <PortableText value={post.description} />
                    )}
                  </p>
                )}
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
