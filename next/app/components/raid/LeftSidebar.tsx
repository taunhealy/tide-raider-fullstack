"use client";

import { useBeachContext } from "@/app/context/BeachContext";
import LocationFilter from "../LocationFilter";
import BlogPostsSidebar from "../BlogPostsSidebar";
import { useQuery } from "@tanstack/react-query";

export default function LeftSidebar() {
  const { filters, updateFilters } = useBeachContext();

  // Move data fetching to component level since it's sidebar specific
  const { data: regions = [] } = useQuery({
    queryKey: ["all-regions"],
    queryFn: () => fetch("/api/regions").then((res) => res.json()),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: () => fetch("/api/blog-posts").then((res) => res.json()),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <aside className="hidden lg:block lg:w-[250px] xl:w-[300px] flex-shrink-0">
      <div className="hidden lg:block space-y-6">
        <LocationFilter regions={regions} />
        <BlogPostsSidebar
          posts={blogPosts}
          selectedCountry={filters.country}
          selectedContinent={filters.continent}
        />
      </div>
    </aside>
  );
}
