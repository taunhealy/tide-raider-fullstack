import { CoreForecastData, BaseForecastData } from "@/app/types/forecast";
import { scraperA } from "@/app/lib/scrapers/scraperA";

interface RegionSourceConfig {
  regionId: string;
  sourceA: {
    url: string;
    scraper: (url: string, regionId: string) => Promise<BaseForecastData>;
  };
}

export const REGION_CONFIGS: Record<string, RegionSourceConfig> = {
  "western-cape": {
    regionId: "western-cape",
    sourceA: {
      url: "https://www.windfinder.com/forecast/muizenberg_beach",
      scraper: scraperA,
    },
  },
  "eastern-cape": {
    regionId: "eastern-cape",
    sourceA: {
      url: "https://www.windfinder.com/forecast/jeffreys_bay",
      scraper: scraperA,
    },
  },
  "kwazulu-natal": {
    regionId: "kwazulu-natal",
    sourceA: {
      url: "https://www.windfinder.com/forecast/durban_bluff",
      scraper: scraperA,
    },
  },
  "northern-cape": {
    regionId: "northern-cape",
    sourceA: {
      url: "https://www.windfinder.com/forecast/port_nolloth",
      scraper: scraperA,
    },
  },
  swakopmund: {
    regionId: "swakopmund",
    sourceA: {
      url: "https://www.windfinder.com/forecast/swakopmund",
      scraper: scraperA,
    },
  },
  "inhambane-province": {
    regionId: "inhambane-province",
    sourceA: {
      url: "https://www.windfinder.com/forecast/tofo",
      scraper: scraperA,
    },
  },
  "ponta-do-ouro": {
    regionId: "ponta-do-ouro",
    sourceA: {
      url: "https://www.windfinder.com/forecast/ponta_do_ouro",
      scraper: scraperA,
    },
  },
  "madagascar-south": {
    regionId: "madagascar-south",
    sourceA: {
      url: "https://www.windfinder.com/forecast/anakao",
      scraper: scraperA,
    },
  },
  "madagascar-west": {
    regionId: "madagascar-west",
    sourceA: {
      url: "https://www.windfinder.com/forecast/anakao",
      scraper: scraperA,
    },
  },
  "madagascar-east": {
    regionId: "madagascar-east",
    sourceA: {
      url: "https://www.windfinder.com/forecast/farafangana",
      scraper: scraperA,
    },
  },
  mozambique: {
    regionId: "mozambique",
    sourceA: {
      url: "https://www.windfinder.com/forecast/maputo_costa_do_sol",
      scraper: scraperA,
    },
  },
  zambia: {
    regionId: "zambia",
    sourceA: {
      url: "https://www.windfinder.com/forecast/livingstone",
      scraper: scraperA,
    },
  },
  "luanda-province": {
    regionId: "luanda-province",
    sourceA: {
      url: "https://www.windfinder.com/forecast/cabo_ledo",
      scraper: scraperA,
    },
  },
  benguela: {
    regionId: "benguela",
    sourceA: {
      url: "https://www.windfinder.com/forecast/caota",
      scraper: scraperA,
    },
  },
  "gabon-coast": {
    regionId: "gabon-coast",
    sourceA: {
      url: "https://www.windfinder.com/forecast/cocobeach_estuaire_gabon",
      scraper: scraperA,
    },
  },
  liberia: {
    regionId: "liberia",
    sourceA: {
      url: "https://www.windfinder.com/forecast/monrovia_montserrado_liberia",
      scraper: scraperA,
    },
  },
  bali: {
    regionId: "bali",
    sourceA: {
      url: "https://www.windfinder.com/forecast/bali_uluwatu",
      scraper: scraperA,
    },
  },
  "puntarenas-province": {
    regionId: "puntarenas-province",
    sourceA: {
      url: "https://www.windfinder.com/forecast/puntarenas",
      scraper: scraperA,
    },
  },
  queensland: {
    regionId: "queensland",
    sourceA: {
      url: "https://www.windfinder.com/forecast/noosa_main_beach",
      scraper: scraperA,
    },
  },
  waikato: {
    regionId: "waikato",
    sourceA: {
      url: "https://www.windfinder.com/forecast/raglan_waikato_new_zealand",
      scraper: scraperA,
    },
  },
  "san-salvador": {
    regionId: "san-salvador",
    sourceA: {
      url: "https://www.windfinder.com/forecast/san_salvador_san_salvador_el_salvador",
      scraper: scraperA,
    },
  },
  "costa-del-balsamo": {
    regionId: "costa-del-balsamo",
    sourceA: {
      url: "https://www.windfinder.com/forecast/el_zonte",
      scraper: scraperA,
    },
  },
  chicama: {
    regionId: "chicama",
    sourceA: {
      url: "https://www.windfinder.com/forecast/chicama",
      scraper: scraperA,
    },
  },
  andalucia: {
    regionId: "andalucia",
    sourceA: {
      url: "https://www.windfinder.com/forecast/fuentes_de_andalucia",
      scraper: scraperA,
    },
  },
  granada: {
    regionId: "granada",
    sourceA: {
      url: "https://www.windfinder.com/forecast/paripé",
      scraper: scraperA,
    },
  },
  california: {
    regionId: "california",
    sourceA: {
      url: "https://www.windfinder.com/forecast/california_maryland_usa",
      scraper: scraperA,
    },
  },
  "new-south-wales": {
    regionId: "new-south-wales",
    sourceA: {
      url: "https://www.windfinder.com/forecast/bondi_beach",
      scraper: scraperA,
    },
  },
  scotland: {
    regionId: "scotland",
    sourceA: {
      url: "https://www.windfinder.com/forecast/oban_airport",
      scraper: scraperA,
    },
  },
  suðuroy: {
    regionId: "suðuroy",
    sourceA: {
      url: "https://www.windfinder.com/forecast/vagur_suduroy_faroe_islands",
      scraper: scraperA,
    },
  },
  streymoy: {
    regionId: "streymoy",
    sourceA: {
      url: "https://www.windfinder.com/forecast/torshavn",
      scraper: scraperA,
    },
  },
  sandoy: {
    regionId: "sandoy",
    sourceA: {
      url: "https://www.windfinder.com/forecast/kollafjordhur_streymoy_faroe_islands",
      scraper: scraperA,
    },
  },
  "central-morocco": {
    regionId: "central-morocco",
    sourceA: {
      url: "https://www.windfinder.com/forecast/taghazout",
      scraper: scraperA,
    },
  },
  morocco: {
    regionId: "morocco",
    sourceA: {
      url: "https://www.windfinder.com/forecast/taghazout",
      scraper: scraperA,
    },
  },
};
