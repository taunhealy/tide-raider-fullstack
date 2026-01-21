import { BaseForecastData } from "../types";
import { scraperA } from "./scraperA";
import { scraperB } from "./scraperB";
import { scraperC } from "./scraperC";

interface RegionSourceConfig {
  regionId: string;
  sourceA: {
    url: string;
    scraper: (url: string, regionId: string) => Promise<BaseForecastData[]>;
  };
  sourceB?: {
    url: string;
    scraper: (url: string, regionId: string) => Promise<BaseForecastData[]>;
  };
  sourceC?: {
    url: string;
    scraper: (url: string, regionId: string) => Promise<BaseForecastData[]>;
  };
}

export const REGION_CONFIGS: Record<string, RegionSourceConfig> = {
  "western-cape": {
    regionId: "western-cape",
    sourceA: {
      url: "https://www.windfinder.com/forecast/muizenberg_beach",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/95115",
      scraper: scraperB,
    },
    sourceC: {
      url: "https://windy.app/forecast2/spot/89110/Muizenberg+South+Africa",
      scraper: scraperC,
    },
  },
  "eastern-cape": {
    regionId: "eastern-cape",
    sourceA: {
      url: "https://www.windfinder.com/forecast/jeffreys_bay",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/68531", // TODO: Find Windguru spot ID for Jeffreys Bay
      scraper: scraperB,
    },
    sourceC: {
      url: "https://windy.app/forecast2/spot/200805/Jeffreys+Bay+South+Africa",
      scraper: scraperC,
    },
  },
  "kwazulu-natal": {
    regionId: "kwazulu-natal",
    sourceA: {
      url: "https://www.windfinder.com/forecast/durban_bluff",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/4865", // TODO: Find Windguru spot ID for Durban Bluff
      scraper: scraperB,
    },
    sourceC: {
      url: "https://windy.app/forecast2/spot/30655/Durban", // TODO: Verify WINDY spot ID for Durban Bluff
      scraper: scraperC,
    },
  },
  "northern-cape": {
    regionId: "northern-cape",
    sourceA: {
      url: "https://www.windfinder.com/forecast/port_nolloth",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/74885", // TODO: Find Windguru spot ID for Port Nolloth
      scraper: scraperB,
    },
  },
  swakopmund: {
    regionId: "swakopmund",
    sourceA: {
      url: "https://www.windfinder.com/forecast/swakopmund",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/88901", // TODO: Find Windguru spot ID for Swakopmund
      scraper: scraperB,
    },
  },
  "inhambane-province": {
    regionId: "inhambane-province",
    sourceA: {
      url: "https://www.windfinder.com/forecast/tofo",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/335490", // TODO: Find Windguru spot ID for Tofo
      scraper: scraperB,
    },
  },
  "ponta-do-ouro": {
    regionId: "ponta-do-ouro",
    sourceA: {
      url: "https://www.windfinder.com/forecast/ponta_do_ouro",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/207022", // TODO: Find Windguru spot ID for Ponta do Ouro
      scraper: scraperB,
    },
  },
  "madagascar-south": {
    regionId: "madagascar-south",
    sourceA: {
      url: "https://www.windfinder.com/forecast/anakao",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/75831", // TODO: Find Windguru spot ID for Anakao
      scraper: scraperB,
    },
  },
  "madagascar-west": {
    regionId: "madagascar-west",
    sourceA: {
      url: "https://www.windfinder.com/forecast/anakao",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/55902", // TODO: Find Windguru spot ID for Anakao (west)
      scraper: scraperB,
    },
  },
  "madagascar-east": {
    regionId: "madagascar-east",
    sourceA: {
      url: "https://www.windfinder.com/forecast/farafangana",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/325685", // TODO: Find Windguru spot ID for Farafangana
      scraper: scraperB,
    },
  },
  mozambique: {
    regionId: "mozambique",
    sourceA: {
      url: "https://www.windfinder.com/forecast/maputo_costa_do_sol",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/335490", // TODO: Find Windguru spot ID for Maputo Costa do Sol
      scraper: scraperB,
    },
    sourceC: {
      url: "https://windy.app/forecast2/spot/175672/Tofo+Beach+Praia+Tofo",
      scraper: scraperC,
    },
  },
  zambia: {
    regionId: "zambia",
    sourceA: {
      url: "https://www.windfinder.com/forecast/livingstone",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/960923", // TODO: Find Windguru spot ID for Livingstone
      scraper: scraperB,
    },
  },
  "luanda-province": {
    regionId: "luanda-province",
    sourceA: {
      url: "https://www.windfinder.com/forecast/cabo_ledo",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/50205", // TODO: Find Windguru spot ID for Cabo Ledo
      scraper: scraperB,
    },
    sourceC: {
      url: "https://windy.app/forecast2/spot/326137/Luanda+Ilha+de+Luanda",
      scraper: scraperC,
    },
  },
  benguela: {
    regionId: "benguela",
    sourceA: {
      url: "https://www.windfinder.com/forecast/caota",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/960923", // TODO: Find Windguru spot ID for Caota
      scraper: scraperB,
    },
  },
  "gabon-coast": {
    regionId: "gabon-coast",
    sourceA: {
      url: "https://www.windfinder.com/forecast/cocobeach_estuaire_gabon",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/1170270", // TODO: Find Windguru spot ID for Cocobeach
      scraper: scraperB,
    },
  },
  liberia: {
    regionId: "liberia",
    sourceA: {
      url: "https://www.windfinder.com/forecast/monrovia_montserrado_liberia",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/SPOT_ID", // TODO: Find Windguru spot ID for Monrovia
      scraper: scraperB,
    },
  },
  bali: {
    regionId: "bali",
    sourceA: {
      url: "https://www.windfinder.com/forecast/bali_uluwatu",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/185336", // TODO: Find Windguru spot ID for Bali Uluwatu
      scraper: scraperB,
    },
    sourceC: {
      url: "https://windy.app/forecast2/spot/63559/Uluwatu+Beach+Indonesia+Pantai+Uluwatu",
      scraper: scraperC,
    },
  },
  "puntarenas-province": {
    regionId: "puntarenas-province",
    sourceA: {
      url: "https://www.windfinder.com/forecast/puntarenas",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/SPOT_ID", // TODO: Find Windguru spot ID for Puntarenas
      scraper: scraperB,
    },
  },
  queensland: {
    regionId: "queensland",
    sourceA: {
      url: "https://www.windfinder.com/forecast/noosa_main_beach",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/1093348", // TODO: Find Windguru spot ID for Noosa
      scraper: scraperB,
    },
  },
  waikato: {
    regionId: "waikato",
    sourceA: {
      url: "https://www.windfinder.com/forecast/raglan_waikato_new_zealand",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/64804", // TODO: Find Windguru spot ID for Raglan
      scraper: scraperB,
    },
  },
  "san-salvador": {
    regionId: "san-salvador",
    sourceA: {
      url: "https://www.windfinder.com/forecast/san_salvador_san_salvador_el_salvador",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/50288", // TODO: Find Windguru spot ID for San Salvador
      scraper: scraperB,
    },
  },
  "costa-del-balsamo": {
    regionId: "costa-del-balsamo",
    sourceA: {
      url: "https://www.windfinder.com/forecast/el_zonte",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/18277",
      scraper: scraperB,
    },
  },
  chicama: {
    regionId: "chicama",
    sourceA: {
      url: "https://www.windfinder.com/forecast/chicama",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/209091", // TODO: Find Windguru spot ID for Chicama
      scraper: scraperB,
    },
  },
  andalucia: {
    regionId: "andalucia",
    sourceA: {
      url: "https://www.windfinder.com/forecast/fuentes_de_andalucia",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/234338",
      scraper: scraperB,
    },
  },
  granada: {
    regionId: "granada",
    sourceA: {
      url: "https://www.windfinder.com/forecast/paripé",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/208971", // TODO: Find Windguru spot ID for Paripé
      scraper: scraperB,
    },
  },
  california: {
    regionId: "california",
    sourceA: {
      url: "https://www.windfinder.com/forecast/california_maryland_usa",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/234338",
      scraper: scraperB,
    },
  },
  "new-south-wales": {
    regionId: "new-south-wales",
    sourceA: {
      url: "https://www.windfinder.com/forecast/bondi_beach",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/234338",
      scraper: scraperB,
    },
  },
  scotland: {
    regionId: "scotland",
    sourceA: {
      url: "https://www.windfinder.com/forecast/oban_airport",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/826134", // TODO: Find Windguru spot ID for Oban
      scraper: scraperB,
    },
  },
  suðuroy: {
    regionId: "suðuroy",
    sourceA: {
      url: "https://www.windfinder.com/forecast/vagur_suduroy_faroe_islands",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/SPOT_ID", // TODO: Find Windguru spot ID for Vagur
      scraper: scraperB,
    },
  },
  streymoy: {
    regionId: "streymoy",
    sourceA: {
      url: "https://www.windfinder.com/forecast/torshavn",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/SPOT_ID", // TODO: Find Windguru spot ID for Torshavn
      scraper: scraperB,
    },
  },
  sandoy: {
    regionId: "sandoy",
    sourceA: {
      url: "https://www.windfinder.com/forecast/kollafjordhur_streymoy_faroe_islands",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/SPOT_ID", // TODO: Find Windguru spot ID for Kollafjordhur
      scraper: scraperB,
    },
  },
  "central-morocco": {
    regionId: "central-morocco",
    sourceA: {
      url: "https://www.windfinder.com/forecast/taghazout",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/SPOT_ID", // TODO: Find Windguru spot ID for Taghazout
      scraper: scraperB,
    },
  },
  morocco: {
    regionId: "morocco",
    sourceA: {
      url: "https://www.windfinder.com/forecast/taghazout",
      scraper: scraperA,
    },
    sourceB: {
      url: "https://www.windguru.cz/549853", // TODO: Find Windguru spot ID for Taghazout
      scraper: scraperB,
    },
  },
};
