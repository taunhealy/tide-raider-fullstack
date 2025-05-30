import { useAppSelector } from "@/app/redux/hooks";
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
  // Get data from Redux
  const filters = useAppSelector((state) => state.filters);
  const { allBeaches } = useAppSelector((state) => state.beaches);

  return (
    <aside className="hidden lg:block lg:w-[250px] xl:w-[300px] flex-shrink-0">
      <div className="hidden lg:block">
        <BlogPostsSidebar
          posts={blogPosts}
          selectedCountry={
            filters.country.length > 0 ? filters.country[0] : undefined
          }
          selectedContinent={
            filters.continent.length > 0 ? filters.continent[0] : undefined
          }
        />
      </div>
      <div className="space-y-6">
        <RaidLogSidebar />
        <FavouriteSurfVideosSidebar />
        <GoldSeeker />
        <EventsSidebar />
        <BeachFeedback beaches={allBeaches} />
      </div>
    </aside>
  );
}
