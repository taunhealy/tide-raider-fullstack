"use client";

import LocationFilter from "../LocationFilter";
import BlogPostsSidebar from "../BlogPostsSidebar";
import { useQuery } from "@tanstack/react-query";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";

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
        const res = await fetch("/api/regions");
        if (!res.ok) throw new Error("Failed to fetch regions");
        return res.json();
      } catch (error) {
        console.error("Error fetching regions:", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: () => fetch("/api/blog-posts").then((res) => res.json()),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isError) {
    return <div>Error fetching regions...</div>;
  }

  console.log("Regions data:", regions);

  return (
    <aside className="hidden lg:block lg:w-[250px] xl:w-[300px] flex-shrink-0 mt-5">
      <div className="hidden lg:block space-y-3">
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
