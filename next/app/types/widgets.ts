// Base Widget Interface
export interface BaseWidget {
  _type: string;
  _key?: string;
  title: string;
  order: number;
}

// Define a const array of all possible widget types
export const WIDGET_TYPES = [
  "surfSpotsWidget",
  "weatherWidget",
  "travelWidget",
  "locationMap",
  "categoryListWidget",
  "tagCloudWidget",
  "relatedPostsWidget",
  "unsplashGridWidget",
  "flightSearchWidget",
] as const;

// Create a type from the array
export type WidgetType = (typeof WIDGET_TYPES)[number];

// Specific Widget Interfaces
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
  maxTags: number;
  orderBy: "popularity" | "alphabetical" | "recent";
  showTagCount: boolean;
}

export interface RelatedPostsWidget extends BaseWidget {
  _type: "relatedPostsWidget";
  numberOfPosts: number;
}

export interface UnsplashGridWidget extends BaseWidget {
  _type: "unsplashGridWidget";
  images: any[]; // Sanity image array
}

export interface FlightSearchWidget extends BaseWidget {
  _type: "flightSearchWidget";
  destinationCode: string;
}

// Union type for all widgets
export type Widget =
  | SurfSpotsWidget
  | WeatherWidget
  | TravelWidget
  | LocationMapWidget
  | CategoryListWidget
  | TagCloudWidget
  | RelatedPostsWidget
  | UnsplashGridWidget
  | FlightSearchWidget;
// Type guard to check if a widget type is valid
export function isValidWidgetType(type: string): type is WidgetType {
  return WIDGET_TYPES.includes(type as WidgetType);
}
