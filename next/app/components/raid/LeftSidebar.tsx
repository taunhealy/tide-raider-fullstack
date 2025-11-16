"use client";

import LocationFilter from "../LocationFilter";
import BlogPostsSidebar from "../BlogPostsSidebar";
import { useQuery } from "@tanstack/react-query";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";
import api from "@/app/lib/api-client";

export default function LeftSidebar() {
  const { filters } = useBeachFilters();

  const {
    data: regions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["all-regions"],
    queryFn: async () => {
      try {
        return await api.getRegions();
      } catch (error) {
        console.error("Error fetching regions:", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const { data: blogPosts } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: () => api.request<{ posts: any[]; trip: any; categories: { title: string; slug: string }[] }>("/api/blog-posts"),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isError) {
    return <div>Error fetching regions...</div>;
  }

  console.log("Regions data:", regions);

  return (
    <aside className="hidden lg:block lg:w-[280px] xl:w-[320px] flex-shrink-0 mt-5">
      <div className="hidden lg:block space-y-8 w-full">
        <LocationFilter regions={regions} />
        {blogPosts && (
          <BlogPostsSidebar
            posts={blogPosts}
            selectedCountry={filters.country}
            selectedContinent={filters.continent}
          />
        )}
      </div>
    </aside>
  );
}
