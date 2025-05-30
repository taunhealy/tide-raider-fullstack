import { ReactNode } from "react";
import { Post } from "@/app/types/blog";
import { Widget, isValidWidgetType } from "@/app/types/widgets";
import RelatedPostsWidget from "./RelatedPostsWidget";
import LocationMapWidget from "./LocationMapWidget";
import CategoryListWidget from "./CategoryListWidget";
import TagCloudWidget from "./TagCloudWidget";
import WeatherWidget from "./WeatherWidget";
import SurfSpotsWidget from "./SurfSpotsWidget";
import TravelWidget from "./TravelWidget";
import UnsplashGridWidget from "./UnsplashGridWidget";

interface SidebarWidgetFactoryProps {
  widget: Widget;
  posts: Post[];
}

export default function SidebarWidgetFactory({
  widget,
  posts,
}: SidebarWidgetFactoryProps): ReactNode {
  // Add detailed widget logging
  console.log("🎯 SidebarWidgetFactory: Widget details:", {
    type: widget._type, // Just use type, not _type
    title: widget.title,
    order: widget.order,
  });

  if (!isValidWidgetType(widget._type)) {
    console.warn(`Unknown widget type: ${widget._type}`);
    return null;
  }

  // Default placeholder component for missing data
  const PlaceholderWidget = ({ type }: { type: string }) => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <p className="text-gray-500 text-sm">Loading {type} widget...</p>
    </div>
  );

  switch (widget._type) {
    case "tagCloudWidget":
      return (
        <TagCloudWidget
          title={widget.title}
          maxTags={widget.maxTags}
          orderBy={widget.orderBy}
          showTagCount={widget.showTagCount}
        />
      );

    case "travelWidget":
      return (
        <TravelWidget
          title={widget.title}
          destinationCode={widget.destinationCode}
        />
      );

    case "weatherWidget":
      console.log("🌤️ Weather widget config:", widget.region);
      return <WeatherWidget title={widget.title} region={widget.region} />;

    case "relatedPostsWidget":
      const validPosts = posts?.filter(
        (post) => post?.slug && typeof post.slug === "string"
      );
      return validPosts?.length > 0 ? (
        <RelatedPostsWidget
          title={widget.title}
          posts={validPosts}
          maxPosts={widget.numberOfPosts}
        />
      ) : null;

    case "locationMap":
      return (
        <LocationMapWidget
          location={{
            beachName: widget.title,
            region: widget.region,
            country: widget.country || "Unknown",
            continent: widget.continent || "Unknown",
          }}
        />
      );

    case "categoryListWidget":
      return (
        <CategoryListWidget
          title={widget.title}
          displayStyle={widget.displayStyle}
          showPostCount={widget.showPostCount}
        />
      );

    case "surfSpotsWidget":
      console.log("🏄‍♂️ Surf spots config:", widget.region);
      return <SurfSpotsWidget title={widget.title} region={widget.region} />;

    case "unsplashGridWidget":
      return (
        <UnsplashGridWidget title={widget.title} images={widget.images || []} />
      );

    default:
      return null;
  }
}
