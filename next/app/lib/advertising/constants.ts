export const AD_CATEGORIES = {
  SURF_CAMP: {
    id: "surf_camp",
    label: "Surf Camp",
    emoji: "🏄‍♂️",
    monthlyPrice: 250,
    fields: ["title", "websiteUrl"],
    adPosition: "sidebar",
  },
  SHAPER: {
    id: "shaper",
    label: "Surfboard Shaper",
    emoji: "🏄",
    monthlyPrice: 250,
    fields: ["title", "websiteUrl"],
    adPosition: "sidebar",
  },
  BEER: {
    id: "beer",
    label: "Beer",
    emoji: "🍺",
    monthlyPrice: 250,
    fields: ["title", "websiteUrl"],
    adPosition: "sidebar",
  },
  COFFEE_SHOP: {
    id: "coffee_shop",
    label: "Coffee Shop",
    emoji: "☕",
    monthlyPrice: 250,
    fields: ["title", "websiteUrl"],
    adPosition: "sidebar",
  },
  VIDEOGRAPHER: {
    id: "videographer",
    label: "Videographer",
    emoji: "🎥",
    monthlyPrice: 250,
    fields: ["title", "websiteUrl"],
    adPosition: "sidebar",
  },
  PHOTOGRAPHER: {
    id: "photographer",
    label: "Photographer",
    emoji: "📸",
    monthlyPrice: 250,
    fields: ["title", "websiteUrl"],
    adPosition: "sidebar",
  },
  INFLUENCER: {
    id: "influencer",
    label: "Influencer",
    emoji: "📱",
    monthlyPrice: 250,
    fields: ["title", "websiteUrl"],
    adPosition: "sidebar",
  },
  CLOWN: {
    id: "clown",
    label: "Clown",
    emoji: "🤡",
    monthlyPrice: 250,
    fields: ["title", "websiteUrl"],
    adPosition: "sidebar",
  },
  OTHER: {
    id: "other",
    label: "Other Service",
    emoji: "🔧",
    monthlyPrice: 250,
    fields: ["title", "websiteUrl", "customCategory"],
    adPosition: "sidebar",
  },
} as const;

export type AdCategory = keyof typeof AD_CATEGORIES;

export const ADVENTURE_AD_CATEGORIES = {
  KAYAKING: {
    id: "kayaking",
    label: "Kayaking",
    emoji: "🚣",
    monthlyPrice: 250,
    fields: ["title", "websiteUrl"],
    adPosition: "adventure",
  },
  DIVING: {
    id: "diving",
    label: "Diving",
    emoji: "🤿",
    monthlyPrice: 250,
    fields: ["title", "websiteUrl"],
    adPosition: "adventure",
  },
  PARAGLIDING: {
    id: "paragliding",
    label: "Paragliding",
    emoji: "🪂",
    monthlyPrice: 250,
    fields: ["title", "websiteUrl"],
    adPosition: "adventure",
  },
  VAN_LIFE: {
    id: "van_life",
    label: "Van Life",
    emoji: "🚐",
    monthlyPrice: 250,
    fields: ["title", "websiteUrl"],
    adPosition: "adventure",
  },
  OTHER_ADVENTURE: {
    id: "other_adventure",
    label: "Other Adventure",
    emoji: "🏄‍♂️",
    monthlyPrice: 250,
    fields: ["title", "websiteUrl", "customCategory"],
    adPosition: "adventure",
  },
} as const;

export type AdventureAdCategory = keyof typeof ADVENTURE_AD_CATEGORIES;

export const GOOGLE_ADS_CONFIG = {
  dailyBudget: 23, // Combined daily budget from all contributions
  keywords: [
    "surfing south africa",
    "surf spots sa",
    "learn to surf",
    "surf gear",
    "surf equipment",
    "surf lessons",
    "surf camps",
    "surfboard shapers",
    "4x4 surf spots",
    "surf forecast",
    "surf travel",
    "surf travel south africa",
    "surf spots cape town",
    "surf spots transkei",
  ],
  location: "South Africa",
  language: "en",
} as const;
