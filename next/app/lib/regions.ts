// Define regions directly here instead of importing from scrapeSources
export const VALID_REGIONS = [
  "Western Cape",
  "Eastern Cape",
  "KwaZulu-Natal",
  "Northern Cape",
  "Swakopmund",
  "Inhambane Province",
  "Ponta do Ouro",
  "Madagascar South",
  "Madagascar West",
  "Madagascar East",
  "Mozambique",
  "Zambia",
  "Luanda Province",
  "Benguela",
  "Gabon Coast",
  "Liberia",
  "Bali",
] as const;

export type ValidRegion = (typeof VALID_REGIONS)[number];
