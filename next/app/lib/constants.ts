export const HARDCODED_WIND_DATA = {
  wind: {
    direction: "SE",
    speed: 15,
  },
  swell: {
    height: 2.5,
    direction: "225",
    period: 12,
    cardinalDirection: "SW",
  },
  timestamp: Date.now(),
};

export const MAX_DISTANCE = 10000;

export const INITIAL_FILTERS = {
  continent: [],
  country: [],
  waveType: [],
  difficulty: [],
  region: [],
  crimeLevel: [],
  minPoints: 0,
  sharkAttack: [],
};

export const DEFAULT_PROFILE_IMAGE = "/images/profile/hero-cover.jpg";

export const WAVE_TYPE_ICONS = {
  "Beach Break": "/images/wave-types/beach-break.jpg",
  "Point Break": "/images/wave-types/point-break.jpg",
  "Reef Break": "/images/wave-types/reef-break.jpg",
  "Beach and Reef Break": "/images/wave-types/beach-reef-break.jpg",
  "Beach and Point Break":
    "https://media.tideraider.com/wave-type-beach-point.jpg",
} as const;

export type WaveType = keyof typeof WAVE_TYPE_ICONS;

export const STORY_CATEGORIES = [
  "Wildlife Encounters",
  "Hidden Gems",
  "Rad Towns",
  "Epic Road Trips",
  "Coastal Adventures",
  "Cultural Experiences",
  "Survival Stories",
  "Camping Adventures",
  "Storm Stories",
  "Environmental Impact",
  "Seasonal Changes",
  "Local Surfing Legends",
  "Boat Access Spots",
  "Weather Phenomena",
  "Restricted Access Spots",
  "Crime",
  "UFO Sightings 👽🛸",
  "Great Surf Camps",
  "Surf Vlog",
  "Surf Photography",
  "Storm Alert",
];

export type StoryCategory = (typeof STORY_CATEGORIES)[number];

