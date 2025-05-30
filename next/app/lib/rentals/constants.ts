// Rental policies
export const RENTAL_POLICIES = {
  MIN_RENTAL_WEEKS: 2,
  MAX_RENTAL_WEEKS: 12,
};

// Define the rental item categories
export const ITEM_CATEGORIES = [
  "SURFBOARD",
  "WETSUIT",
  "BODYBOARD",
  "STAND_UP_PADDLE",
  "KAYAK",
  "FOIL",
  "SCOOTER",
  "MOTORBIKE",
  "SKATEBOARD",
  "JET_SKI",
] as const;

// Define emojis for each category
export const ITEM_CATEGORIES_EMOJI: Record<string, string> = {
  SURFBOARD: "🏄",
  WETSUIT: "🌊",
  BODYBOARD: "🏊‍♂️",
  STAND_UP_PADDLE: "🏄‍♀️",
  KAYAK: "🛶",
  FOIL: "🌬️",
  SCOOTER: "🛵",
  MOTORBIKE: "🏍️",
  SKATEBOARD: "🛹",
  JETSKI: "🚤",
};

// Create a type from the constant
export type RentalItemType = (typeof ITEM_CATEGORIES)[number];

// Package prices by item type (in USD per 2-week package)
export const PACKAGE_PRICES: Record<RentalItemType, number> = {
  SURFBOARD: 70,
  WETSUIT: 40,
  BODYBOARD: 30,
  STAND_UP_PADDLE: 80,
  KAYAK: 80,
  FOIL: 100,
  SCOOTER: 100,
  MOTORBIKE: 180,
  SKATEBOARD: 50,
  JET_SKI: 200,
};

// Item type specifications and configuration
export const ITEM_SPECIFICATIONS = {
  SURFBOARD: {
    fields: [
      {
        name: "type",
        label: "Board Type",
        type: "select",
        options: [
          { value: "SHORTBOARD", label: "Shortboard" },
          { value: "LONGBOARD", label: "Longboard" },
          { value: "FISH", label: "Fish" },
          { value: "FUNBOARD", label: "Funboard" },
          { value: "SUP", label: "SUP" },
          { value: "GUN", label: "Gun" },
          { value: "MINI_MAL", label: "Mini Mal" },
        ],
      },
      { name: "length", label: "Length (inches)", type: "number" },
      {
        name: "finSetup",
        label: "Fin Setup",
        type: "select",
        options: [
          { value: "THRUSTER", label: "Thruster" },
          { value: "TWIN", label: "Twin" },
          { value: "QUAD", label: "Quad" },
          { value: "SINGLE", label: "Single" },
          { value: "FIVE", label: "Five" },
          { value: "OTHER", label: "Other" },
        ],
      },
    ],
  },
  WETSUIT: {
    fields: [
      {
        name: "thickness",
        label: "Thickness (mm)",
        type: "select",
        options: [
          { value: "2", label: "2mm" },
          { value: "3/2", label: "3/2mm" },
          { value: "4/3", label: "4/3mm" },
          { value: "5/4", label: "5/4mm" },
          { value: "6/5", label: "6/5mm" },
        ],
      },
      {
        name: "size",
        label: "Size",
        type: "select",
        options: [
          { value: "XS", label: "XS" },
          { value: "S", label: "S" },
          { value: "M", label: "M" },
          { value: "L", label: "L" },
          { value: "XL", label: "XL" },
          { value: "XXL", label: "XXL" },
        ],
      },
      {
        name: "style",
        label: "Style",
        type: "select",
        options: [
          { value: "FULL", label: "Full" },
          { value: "SPRING", label: "Spring" },
          { value: "SHORT_ARM", label: "Short Arm" },
          { value: "VEST", label: "Vest" },
        ],
      },
    ],
  },
  BODYBOARD: {
    fields: [
      { name: "length", label: "Length (inches)", type: "number" },
      {
        name: "core",
        label: "Core Material",
        type: "select",
        options: [
          { value: "PE", label: "PE (Polyethylene)" },
          { value: "PP", label: "PP (Polypropylene)" },
          { value: "EPS", label: "EPS (Expanded Polystyrene)" },
          { value: "OTHER", label: "Other" },
        ],
      },
      {
        name: "tailShape",
        label: "Tail Shape",
        type: "select",
        options: [
          { value: "CRESCENT", label: "Crescent" },
          { value: "BAT", label: "Bat" },
          { value: "SQUARE", label: "Square" },
        ],
      },
    ],
  },
  STAND_UP_PADDLE: {
    fields: [
      { name: "length", label: "Length (inches)", type: "number" },
      { name: "width", label: "Width (inches)", type: "number" },
      {
        name: "type",
        label: "Board Type",
        type: "select",
        options: [
          { value: "ALL_AROUND", label: "All-Around" },
          { value: "TOURING", label: "Touring" },
          { value: "RACING", label: "Racing" },
          { value: "SURF", label: "Surf" },
          { value: "YOGA", label: "Yoga" },
          { value: "INFLATABLE", label: "Inflatable" },
        ],
      },
      {
        name: "paddleIncluded",
        label: "Paddle Included",
        type: "boolean",
      },
    ],
  },
  KAYAK: {
    fields: [
      {
        name: "type",
        label: "Kayak Type",
        type: "select",
        options: [
          { value: "RECREATIONAL", label: "Recreational" },
          { value: "SEA", label: "Sea/Touring" },
          { value: "WHITEWATER", label: "Whitewater" },
          { value: "FISHING", label: "Fishing" },
          { value: "INFLATABLE", label: "Inflatable" },
          { value: "TANDEM", label: "Tandem" },
        ],
      },
      { name: "length", label: "Length (feet)", type: "number" },
      {
        name: "material",
        label: "Material",
        type: "select",
        options: [
          { value: "PLASTIC", label: "Plastic" },
          { value: "FIBERGLASS", label: "Fiberglass" },
          { value: "CARBON", label: "Carbon Fiber" },
          { value: "INFLATABLE", label: "Inflatable" },
        ],
      },
      {
        name: "paddlesIncluded",
        label: "Paddles Included",
        type: "number",
      },
    ],
  },
  FOIL: {
    fields: [
      {
        name: "type",
        label: "Foil Type",
        type: "select",
        options: [
          { value: "SURF", label: "Surf Foil" },
          { value: "WING", label: "Wing Foil" },
          { value: "KITE", label: "Kite Foil" },
          { value: "WAKE", label: "Wake Foil" },
          { value: "SUP", label: "SUP Foil" },
        ],
      },
      {
        name: "mastLength",
        label: "Mast Length (cm)",
        type: "number",
      },
      {
        name: "wingSize",
        label: "Front Wing Size (cm²)",
        type: "number",
      },
      {
        name: "material",
        label: "Material",
        type: "select",
        options: [
          { value: "ALUMINUM", label: "Aluminum" },
          { value: "CARBON", label: "Carbon Fiber" },
          { value: "HYBRID", label: "Hybrid" },
        ],
      },
      {
        name: "boardIncluded",
        label: "Board Included",
        type: "boolean",
      },
    ],
  },
  SCOOTER: {
    fields: [
      {
        name: "type",
        label: "Scooter Type",
        type: "select",
        options: [
          { value: "ELECTRIC", label: "Electric" },
          { value: "GAS", label: "Gas Powered" },
          { value: "KICK", label: "Kick Scooter" },
        ],
      },
      {
        name: "maxSpeed",
        label: "Max Speed (mph)",
        type: "number",
      },
      {
        name: "range",
        label: "Range (miles)",
        type: "number",
      },
      {
        name: "weight",
        label: "Weight Capacity (lbs)",
        type: "number",
      },
      {
        name: "helmetIncluded",
        label: "Helmet Included",
        type: "boolean",
      },
    ],
  },
  MOTORBIKE: {
    fields: [
      {
        name: "type",
        label: "Motorbike Type",
        type: "select",
        options: [
          { value: "CRUISER", label: "Cruiser" },
          { value: "SPORT", label: "Sport" },
          { value: "TOURING", label: "Touring" },
          { value: "DUAL_SPORT", label: "Dual Sport" },
          { value: "SCOOTER", label: "Scooter" },
          { value: "MOPED", label: "Moped" },
          { value: "ON-OFF_ROAD", label: "On-Off Road" },
        ],
      },
      {
        name: "engineSize",
        label: "Engine Size (cc)",
        type: "number",
      },
      {
        name: "fuelType",
        label: "Fuel Type",
        type: "select",
        options: [
          { value: "GASOLINE", label: "Gasoline" },
          { value: "DIESEL", label: "Diesel" },
          { value: "ELECTRIC", label: "Electric" },
          { value: "HYBRID", label: "Hybrid" },
        ],
      },
      {
        name: "transmission",
        label: "Transmission",
        type: "select",
        options: [
          { value: "MANUAL", label: "Manual" },
          { value: "AUTOMATIC", label: "Automatic" },
          { value: "SEMI_AUTO", label: "Semi-Automatic" },
        ],
      },
      {
        name: "helmetIncluded",
        label: "Helmet Included",
        type: "boolean",
      },
      {
        name: "insuranceRequired",
        label: "Insurance Required",
        type: "boolean",
      },
    ],
  },
  SKATEBOARD: {
    fields: [
      {
        name: "type",
        label: "Skateboard Type",
        type: "select",
        options: [
          { value: "LONGBOARD", label: "Longboard" },
          { value: "CRUISER", label: "Cruiser" },
          { value: "STREET", label: "Street" },
          { value: "PENNY", label: "Penny" },
          { value: "ELECTRIC", label: "Electric" },
        ],
      },
      {
        name: "length",
        label: "Deck Length (inches)",
        type: "number",
      },
      {
        name: "wheelSize",
        label: "Wheel Size (mm)",
        type: "number",
      },
      {
        name: "helmetIncluded",
        label: "Helmet Included",
        type: "boolean",
      },
    ],
  },
  JET_SKI: {
    fields: [
      {
        name: "type",
        label: "Jet Ski Type",
        type: "select",
        options: [
          { value: "RECREATION", label: "Recreation" },
          { value: "LUXURY", label: "Luxury" },
          { value: "SPORT", label: "Sport" },
          { value: "TOW_SPORTS", label: "Tow Sports" },
        ],
      },
      {
        name: "engineSize",
        label: "Engine Size (cc)",
        type: "number",
      },
      {
        name: "horsepower",
        label: "Horsepower",
        type: "number",
      },
      {
        name: "riderCapacity",
        label: "Rider Capacity",
        type: "number",
      },
      {
        name: "fuelCapacity",
        label: "Fuel Capacity (L)",
        type: "number",
      },
      {
        name: "lifejacketsIncluded",
        label: "Life Jackets Included",
        type: "number",
      },
      {
        name: "insuranceRequired",
        label: "Insurance Required",
        type: "boolean",
      },
    ],
  },
};
