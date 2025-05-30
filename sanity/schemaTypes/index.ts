import post from './documents/post'
import postTemplate from './documents/postTemplate'
import postCategory from './documents/postCategory'
import home from './documents/home'
import pricing from './documents/pricing'
// Object schemas
import postTag from './documents/postTag'
import {
  relatedPostsWidget,
  locationMapWidget,
  categoryListWidget,
  tagCloudWidget,
  weatherWidget,
  flightSearchWidget,
  surfSpotsWidget,
  travelWidget,
  unsplashGridWidget,
} from './objects/sidebarWidgets'
import trip from './documents/trip'
import accommodation from './documents/accommodation'
import {youTube} from './objects/youtube'
import dashboard from './documents/dashboard'
import profile from './documents/profile'
import {video} from './objects/video'

export const schemaTypes = [
  // Documents
  home,
  post,
  postTemplate,
  postCategory,
  postTag,
  pricing,
  trip,
  accommodation,
  profile,
  // Widgets
  relatedPostsWidget,
  locationMapWidget,
  categoryListWidget,
  tagCloudWidget,
  weatherWidget,
  flightSearchWidget,
  surfSpotsWidget,
  travelWidget,
  unsplashGridWidget,
  // Objects
  youTube,
  video,
]
