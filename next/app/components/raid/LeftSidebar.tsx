import { useBeachContext } from "@/app/context/BeachContext";
import BlogPostsSidebar from "../BlogPostsSidebar";
import LocationFilter from "../LocationFilter";
import type { Post, Trip } from "@/app/types/blog";
import RaidLogSidebar from "../RaidLogSidebar";
import { Region } from "@/app/types/beaches";

interface LeftSidebarProps {
  blogPosts: {
    posts: Post[];
    trip: Trip;
    categories: { title: string; slug: string }[];
  };
  regions: Region[];
}

export default function LeftSidebar({ blogPosts, regions }: LeftSidebarProps) {
  // Get data from Context
  const { filters, setFilters } = useBeachContext();

  return (
    <aside className="hidden lg:block lg:w-[250px] xl:w-[300px] flex-shrink-0">
      <div className="hidden lg:block space-y-6">
        <LocationFilter
          regions={regions}
          selectedRegion={filters.location.region}
          selectedRegionId={filters.location.regionId}
          onRegionSelect={(region) => {
            setFilters({
              ...filters,
              location: {
                ...filters.location,
                region: region?.name || "",
                regionId: region?.id || "",
              },
            });
          }}
          disabled={false}
        />
        <BlogPostsSidebar
          posts={blogPosts}
          selectedCountry={
            filters.location.country.length > 0
              ? filters.location.country
              : undefined
          }
          selectedContinent={
            filters.location.continent.length > 0
              ? filters.location.continent
              : undefined
          }
        />
      </div>
    </aside>
  );
}
