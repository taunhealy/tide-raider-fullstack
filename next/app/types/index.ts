export interface SectionData {
  title: string;
  description: string;
  // Add other properties as needed
}

// Blog Types
export interface Category {
  title: string;
  slug: { current: string };
}

// Travel Types
export interface Airport {
  code: string;
  name: string;
  baseCost: number;
}

export interface TravelCosts {
  airports: Airport[];
  accommodation: {
    costPerNight: number;
    hotelName: string;
    bookingLink: string;
  };
  dailyExpenses: {
    food: number;
    transport: number;
    activities: number;
    medical: number;
  };
}

export interface SanityImage {
  _type: "image";
  _id: string;
  alt?: string;
  asset: {
    _ref: string;
    _type: "reference";
  };
  hotspot?: {
    x: number;
    y: number;
  };
}
