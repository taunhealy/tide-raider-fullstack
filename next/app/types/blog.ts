import { PortableTextBlock } from "@portabletext/types";
import { Widget } from "@/app/types/widgets";

export interface Route {
  _id?: string;
  title: string;
  steps: Step[];
  accommodations: Accommodation[];
  bestTimeToGo: string;
  routeImage: any;
  routeVideo: any;
  routeDescription: string;
}

interface Step {
  stepNumber: number;
  description: string;
  details: PortableTextBlock[];
  price: number;
  accommodations?: {
    name: string;
    category: string;
    price: number;
    description?: string;
  }[];
}

interface Accommodation {
  name: string;
  category: string;
  price?: number;
  description?: string;
  images?: any[];
}

export interface Category {
  title: string;
  slug?: { current: string };
}

export interface RouteReference {
  _ref: string; // Reference ID of the Route document
  _type: "route"; // Type of the reference
}

export interface Trip {
  title: string;
  country: string;
  region?: string;
  destination: string; // Keep existing for backward compatibility
  days: TripDay[];
  idealMonth?: string;
}

interface TripDay {
  dayNumber: number;
  activities: Activity[];
  stay: Stay;
}

interface Activity {
  title: string;
  duration: string;
  price: number;
  transport: string;
  bookingURL: string | null;
}

interface Stay {
  title: string;
  price: number;
  bookingURL: string | null;
}

export interface Post {
  _id?: string;
  _createdAt?: string;
  title: string;
  slug:
    | {
        current: string;
      }
    | string;
  mainImage: any;
  hoverImage?: any;
  publishedAt?: string | null;
  description: string;
  categories?: Category[];
  sidebarWidgets: Widget[];
  template?: {
    name: string;
    sidebar: string;
    sidebarWidgets: Widget[];
  };
  content: ContentSection[];
  relatedPosts: Post[];
  trip?: Trip;
  sectionImages?: SectionImage[];
  country?: string;
  region?: string;
  countries: string[];
}

export interface ContentSection {
  _type: string;
  _key: string;
  sectionHeading?: string;
  content: PortableTextBlock[];
  sectionImages?: SectionImage[];
  videoLink?: string;
}

export interface SectionImage {
  source: "upload" | "unsplash";
  uploadedImage?: {
    asset: any;
    alt?: string;
    caption?: string;
  };
  unsplashImage?: {
    url: string;
    alt?: string;
  };
  layout: "full" | "half" | "quarter";
}

// Base Widget Interface
export interface BaseWidget {
  _type: string;
  _key?: string;
  title: string;
  order: number;
}

// Specific Widget Types
export interface SurfSpotsWidget extends BaseWidget {
  _type: "surfSpotsWidget";
  region: string;
}

export interface WeatherWidget extends BaseWidget {
  _type: "weatherWidget";
  region: string;
}

export interface TravelWidget extends BaseWidget {
  _type: "travelWidget";
  destinationCode: string;
}

export interface LocationMapWidget extends BaseWidget {
  _type: "locationMap";
  region: string;
  country: string;
  continent: string;
}

export interface CategoryListWidget extends BaseWidget {
  _type: "categoryListWidget";
  displayStyle: string;
  showPostCount: boolean;
}

export interface TagCloudWidget extends BaseWidget {
  _type: "tagCloudWidget";
  maxTags?: number;
  orderBy?: "popularity" | "alphabetical" | "recent";
  showTagCount?: boolean;
}

export interface RelatedPostsWidget extends BaseWidget {
  _type: "relatedPostsWidget";
  numberOfPosts?: number;
}

export interface FlightSearchWidget extends BaseWidget {
  _type: "flightSearchWidget";
  destinationCode?: string;
}

// Props Types for Widget Components
export type SurfSpotsWidgetProps = Pick<SurfSpotsWidget, "title" | "region">;
export type WeatherWidgetProps = Pick<WeatherWidget, "title" | "region">;
export type TravelWidgetProps = Pick<TravelWidget, "title" | "destinationCode">;

// Then update the props type in CategoryListWidget.tsx
type CategoryListWidgetProps = Pick<
  CategoryListWidget,
  "title" | "displayStyle" | "showPostCount"
>;

// Add these types
interface RouteStep {
  stepNumber: number;
  title: string;
  details: PortableTextBlock[];
}
