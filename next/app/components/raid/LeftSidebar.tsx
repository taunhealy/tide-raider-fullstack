import { useBeach } from "@/app/context/BeachContext";
import BlogPostsSidebar from "../BlogPostsSidebar";
import FavouriteSurfVideosSidebar from "../FavouriteSurfVideosSidebar";
import GoldSeeker from "../GoldSeeker";
import EventsSidebar from "../EventsSidebar";
import BeachFeedback from "../BeachFeedback";
import type { Beach } from "@/app/types/beaches";
import type { Post, Trip } from "@/app/types/blog";
import RaidLogSidebar from "../RaidLogSidebar";

interface LeftSidebarProps {
  blogPosts: {
    posts: Post[];
    trip: Trip;
    categories: { title: string; slug: string }[];
  };
}

export default function LeftSidebar({ blogPosts }: LeftSidebarProps) {
  // Get data from Context
  const { filters, beaches: allBeaches } = useBeach();

  return (
    <aside className="hidden lg:block lg:w-[250px] xl:w-[300px] flex-shrink-0">
      <div className="hidden lg:block">
        <BlogPostsSidebar
          posts={blogPosts}
          selectedCountry={
            filters.location.country.length > 0
              ? filters.location.country[0]
              : undefined
          }
          selectedContinent={
            filters.location.continent.length > 0
              ? filters.location.continent[0]
              : undefined
          }
        />
      </div>
      <div className="space-y-6">
        <RaidLogSidebar />
      </div>
    </aside>
  );
}
