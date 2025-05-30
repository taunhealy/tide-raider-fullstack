import { WindData } from "@/app/types/wind";
import { scraperA } from "@/app/lib/scrapers/scraperA";
import { ValidRegion } from "@/app/lib/regions";

interface RegionSourceConfig {
  region: string;
  sourceA: {
    url: string;
    scraper: (url: string, region: ValidRegion) => Promise<WindData>;
  };
}

export const REGION_CONFIGS: RegionSourceConfig[] = [
  {
    region: "Western Cape",
    sourceA: {
      url: "https://www.windfinder.com/forecast/muizenberg_beach",
      scraper: scraperA,
    },
  },
  {
    region: "Eastern Cape",
    sourceA: {
      url: "https://www.windfinder.com/forecast/jeffreys_bay",
      scraper: scraperA,
    },
  },
  {
    region: "KwaZulu-Natal",
    sourceA: {
      url: "https://www.windfinder.com/forecast/durban_bluff",
      scraper: scraperA,
    },
  },
  {
    region: "Northern Cape",
    sourceA: {
      url: "https://www.windfinder.com/forecast/port_nolloth",
      scraper: scraperA,
    },
  },
  {
    region: "Swakopmund",
    sourceA: {
      url: "https://www.windfinder.com/forecast/swakopmund",
      scraper: scraperA,
    },
  },
  {
    region: "Inhambane Province",
    sourceA: {
      url: "https://www.windfinder.com/forecast/tofo",
      scraper: scraperA,
    },
  },
  {
    region: "Ponta do Ouro",
    sourceA: {
      url: "https://www.windfinder.com/forecast/ponta_do_ouro",
      scraper: scraperA,
    },
  },
  {
    region: "Madagascar South",
    sourceA: {
      url: "https://www.windfinder.com/forecast/anakao",
      scraper: scraperA,
    },
  },
  {
    region: "Madagascar West",
    sourceA: {
      url: "https://www.windfinder.com/forecast/anakao",
      scraper: scraperA,
    },
  },
  {
    region: "Madagascar East",
    sourceA: {
      url: "https://www.windfinder.com/forecast/farafangana",
      scraper: scraperA,
    },
  },
  {
    region: "Mozambique",
    sourceA: {
      url: "https://www.windfinder.com/forecast/maputo_costa_do_sol",
      scraper: scraperA,
    },
  },
  {
    region: "Zambia",
    sourceA: {
      url: "https://www.windfinder.com/forecast/livingstone",
      scraper: scraperA,
    },
  },
  {
    region: "Luanda Province",
    sourceA: {
      url: "https://www.windfinder.com/forecast/cabo_ledo",
      scraper: scraperA,
    },
  },
  {
    region: "Benguela",
    sourceA: {
      url: "https://www.windfinder.com/forecast/caota",
      scraper: scraperA,
    },
  },
  {
    region: "Gabon Coast",
    sourceA: {
      url: "https://www.windfinder.com/forecast/cocobeach_estuaire_gabon",
      scraper: scraperA,
    },
  },
  {
    region: "Liberia",
    sourceA: {
      url: "https://www.windfinder.com/forecast/monrovia_montserrado_liberia",
      scraper: scraperA,
    },
  },
  {
    region: "Bali",
    sourceA: {
      url: "https://www.windfinder.com/forecast/bali_uluwatu",
      scraper: scraperA,
    },
  },
  {
    region: "Puntarenas Province",
    sourceA: {
      url: "https://www.windfinder.com/forecast/puntarenas",
      scraper: scraperA,
    },
  },
  {
    region: "Queensland",
    sourceA: {
      url: "https://www.windfinder.com/forecast/noosa_main_beach",
      scraper: scraperA,
    },
  },
  {
    region: "Waikato",
    sourceA: {
      url: "https://www.windfinder.com/forecast/raglan_waikato_new_zealand",
      scraper: scraperA,
    },
  },
  {
    region: "San Salvador",
    sourceA: {
      url: "https://www.windfinder.com/forecast/san_salvador_san_salvador_el_salvador",
      scraper: scraperA,
    },
  },
  {
    region: "Costa del Balsamo",
    sourceA: {
      url: "https://www.windfinder.com/forecast/el_zonte",
      scraper: scraperA,
    },
  },
  {
    region: "Chicama",
    sourceA: {
      url: "https://www.windfinder.com/forecast/chicama",
      scraper: scraperA,
    },
  },
  {
    region: "Andalucia",
    sourceA: {
      url: "https://www.windfinder.com/forecast/fuentes_de_andalucia",
      scraper: scraperA,
    },
  },
  {
    region: "Granada",
    sourceA: {
      url: "https://www.windfinder.com/forecast/paripé",
      scraper: scraperA,
    },
  },
  {
    region: "California",
    sourceA: {
      url: "https://www.windfinder.com/forecast/california_maryland_usa",
      scraper: scraperA,
    },
  },
  {
    region: "New South Wales",
    sourceA: {
      url: "https://www.windfinder.com/forecast/bondi_beach",
      scraper: scraperA,
    },
  },
  {
    region: "Scotland",
    sourceA: {
      url: "https://www.windfinder.com/forecast/oban_airport",
      scraper: scraperA,
    },
  },
  {
    region: "Suðuroy",
    sourceA: {
      url: "https://www.windfinder.com/forecast/vagur_suduroy_faroe_islands",
      scraper: scraperA,
    },
  },
  {
    region: "Streymoy",
    sourceA: {
      url: "https://www.windfinder.com/forecast/torshavn",
      scraper: scraperA,
    },
  },
  {
    region: "Sandoy",
    sourceA: {
      url: "https://www.windfinder.com/forecast/kollafjordhur_streymoy_faroe_islands",
      scraper: scraperA,
    },
  },
  {
    region: "Central Morocco",
    sourceA: {
      url: "https://www.windfinder.com/forecast/taghazout",
      scraper: scraperA,
    },
  },
  {
    region: "Morocco",
    sourceA: {
      url: "https://www.windfinder.com/forecast/taghazout",
      scraper: scraperA,
    },
  },
];
