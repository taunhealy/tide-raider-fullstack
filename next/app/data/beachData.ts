import { Beach } from "../types/beaches";

// Beach data array should be declared FIRST
export const beachData: Beach[] = [
  {
    id: "muizenberg-beach",
    name: "Muizenberg Beach",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "False Bay",
    distanceFromCT: 25,
    optimalWindDirections: ["NW", "N", "NE"],
    optimalSwellDirections: {
      min: 120,
      max: 150,
    }, // single closing brace for optimalSwellDirections
    bestSeasons: ["winter"], // continue with the rest of the properties
    optimalTide: "ALL",
    description: "Gentle beach break, perfect for beginners",
    difficulty: "BEGINNER",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.4,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 20,
      winter: 15,
    },
    hazards: ["Rip currents", "Crowds", "Sharks"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: true,
      incidents: [
        {
          date: "2014-03-29",
          outcome: "Non-fatal",
          details: "Bite to surfboard, surfer unharmed",
        },
        {
          date: "2008-11-15",
          outcome: "Non-fatal",
          details: "Minor injury to surfer's leg",
        },
      ],
    },
    image:
      "https://images.unsplash.com/photo-1576913959343-420023e37b55?q=80&w=2626&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    coordinates: {
      lat: -34.1083,
      lng: 18.4702,
    },
    shaper: [
      {
        name: "Wawa Waves",
        url: "https://www.wawawave.com/index.html",
      },
    ],
    videos: [
      {
        url: "https://www.youtube.com/watch?v=2uqps13F8WU&ab_channel=021DRONE",
        title: "Surfing Muizenberg",
        platform: "youtube",
      },
    ],
    profileImage: "/images/profile/hero-cover.jpg", // Removed /public prefix
    coffeeShop: [{ name: "Harvest Café, Muizenberg" }],
    beer: [
      {
        name: "Jack Black Beer",
        url: "https://jackblackbeer.com/?srsltid=AfmBOorD3plPrF2vmxOr_MrbqSaLxAMnslwC99syTmtfU15O-_OXQBlS",
      },
    ],
  },
  {
    id: "long-beach",
    name: "Long Beach",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Kommetjie",
    distanceFromCT: 40,
    optimalWindDirections: ["SE", "SSE", "S"],
    optimalSwellDirections: {
      min: 225,
      max: 245,
      cardinal: "SW",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description: "Consistent waves, good for intermediate/advanced surfers",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.8,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: [
      "Strong currents",
      "Crowds",
      "Dangerous shorey",
      "Rocks on the inside",
    ],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image:
      "https://images.unsplash.com/photo-1552842256-2b5a9e2d3659?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGtvbW1ldGppZXxlbnwwfHwwfHx8MA%3D%3D",
    coordinates: {
      lat: -34.1361,
      lng: 18.3278,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=uSNalo_DZpc&pp=ygUcbG9uZyBiZWFjaCBrb21tZXRqaWUgc3VyZmluZw%3D%3D",
        title: "Morning Session",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=vzNZR3j5G54&ab_channel=taichesselet",
        title: "Pebbles, Long Beach",
        platform: "youtube",
      },
    ],
    coffeeShop: [{ name: "Good Riddance Coffee Co." }],
    advertisingPrice: 1000,
  },

  {
    id: "llandudno",
    name: "Llandudno",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Llandudno",
    distanceFromCT: 30,
    optimalWindDirections: ["SE", "E"],
    optimalSwellDirections: {
      min: 225,
      max: 245,
      cardinal: "SW",
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW_TO_MID",
    description:
      "Powerful beach break with multiple peaks along boulder-strewn beach for advanced surfers unless it's small. Main A-frame peak offers hollow right-handers and longer left walls. Best performance on SW swell with SE winds and mid tide. Wave size ranges from 2-12ft, ideal at 4-8ft. Strong currents between peaks - use southern rip for paddle out. Often crowded on good days. Limited parking requires early arrival. Summer afternoons typically blown out by SE winds. No shark attacks reported. Spectacular setting in affluent suburb.",
    difficulty: "ADVANCED",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.3,
      max: 4,
    },
    idealSwellPeriod: {
      min: 13,
      max: 24,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: ["Strong currents", "powerful waves"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "/images/beaches/td-llands.jpg",
    coordinates: {
      lat: -34.0058,
      lng: 18.3397,
    },
    videos: [
      {
        url: "hhttps://www.youtube.com/watch?v=5uCat78yUzU&pp=ygUObGxhbmR1ZG5vIHN1cmY%3D",
        title: "Jordy Smith | Llanduno",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=L_3Cl3Ae4oQ&ab_channel=PsychedOut",
        title:
          "A Quick surf at Llandudno: Mikey February, Eli Beukes, Luke Slijpen, Dylan Muhlenburg, Benjy Oliver and more scoring some fun waves at Llandudno ",
        platform: "youtube",
      },
    ],
    coffeeShop: [{ name: "Sentinel Cafe" }],
    advertisingPrice: 1000,
  },
  {
    id: "big-bay",
    name: "Big Bay",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Bloubergstrand",
    distanceFromCT: 35,
    optimalWindDirections: ["SE", "SSE", "ESE"],
    optimalSwellDirections: {
      min: 225,
      max: 245,
    },
    bestSeasons: ["winter"],
    optimalTide: "MID",
    description:
      "Expansive beach break with multiple peaks across 1.5km stretch. Three distinct areas: 'Big Rock' (southern end) offers longer right-handers up to 150m with occasional barrels on bigger swells, 'Middle Peak' provides consistent A-frame waves ideal for intermediate surfers, and 'Kite Beach' (northern end) reserved for kitesurfing. Wave mechanics vary significantly with tide - low tide exposes rock shelf creating hollow, punchy waves especially at Big Rock, while high tide offers fuller, more forgiving walls better for longboarding and beginners. Best performance on 4-6ft SW swell with 12-15 second period and SE-SSE winds under 15 knots. Morning sessions (before 11am) typically glassy with light offshore conditions before the Cape Doctor kicks in. Multiple rip channels between sandbars provide easy paddle-outs but create strong lateral currents - use landmarks to maintain position. Peak hierarchy strictly observed at Big Rock, while beach breaks offer more relaxed vibe. Winter (May-August) brings bigger swells and cleaner conditions with NW winds, while summer offers reliable 2-4ft waves perfect for learning. Shark spotters present during daylight hours. Facilities include showers, toilets, restaurants, and surf shops. Parking can be challenging on weekends - arrive early. Watch for bluebottles in summer months and seal activity near rocks. Wave quality highly dependent on sand movement - banks shift significantly after big storms.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.2,
      max: 4,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Rip currents", "Wind chop", "Kitesurfers"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image:
      "https://images.unsplash.com/photo-1563656157432-67560011e209?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8QmxvdWJlcmdzdHJhbmR8ZW58MHx8MHx8fDA%3D",
    coordinates: {
      lat: -33.7947,
      lng: 18.4553,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=W5IOP63ALvE&ab_channel=CapeTownSurf",
        title: "Big Bay Surf Report - 3 June 2021",
        platform: "youtube",
      },
    ],
    coffeeShop: [{ name: "The Surf Cafe" }],
  },
  {
    id: "dunes",
    name: "Dunes",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Noordhoek",
    distanceFromCT: 40,
    optimalWindDirections: ["ESE", "SE", "E"],
    optimalSwellDirections: {
      min: 225.5,
      max: 275.5,
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW",
    description:
      "Fast waves with hollow sections make Dunes in Cape Peninsula a standout surf spot. This fairly exposed beach break delivers consistent surf, with winter being the prime season. Ideal offshore winds blow from the east-southeast, while the best swells roll in from the southwest, often as distant groundswells. The beach break provides both lefts and rights, offering variety for surfers. It's rarely crowded, but caution is advised due to strong and potentially dangerous rips and theft.",
    difficulty: "ADVANCED",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 2.1,
      max: 5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: [
      "Rip currents",
      "Strong currents",
      "Shallow sandbanks",
      "Sharks",
      "Theft",
    ],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image:
      "https://images.unsplash.com/photo-1537045864092-892b7de76421?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bm9vcmRob2VrfGVufDB8fDB8fHww",
    coordinates: {
      lat: -34.1012,
      lng: 18.4987,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=jhb5kM51q2g&ab_channel=Billabong",
        title:
          "The Cape | Billabong Adventure Division: Taj Burrow, Shaun Manners, Jaleesa Vincent and South African charger Matt Bromley test their staying power in this newest Adventure Division strike mission.",
        platform: "youtube",
      },
    ],
    coffeeShop: [{ name: "Aegir Project Brewery" }],
  },
  {
    id: "scarborough",
    name: "Scarborough",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Scarborough",
    distanceFromCT: 35,
    optimalWindDirections: ["SE", "E", "NE"],
    optimalSwellDirections: {
      min: 225,
      max: 315,
    },
    bestSeasons: ["winter"],
    optimalTide: "MID_TO_HIGH",
    description:
      "Powerful beach break with multiple peaks along 2km stretch. Main peak offers hollow lefts and rights, especially punchy on low tide. Outside bank holds bigger swells, creating long walls and occasional barrels. Best on SW swell with light easterly winds. Morning sessions crucial as wind typically picks up by 11am. Strong rips provide good paddle-out channels but create hazardous currents. Remote location means uncrowded sessions but bring all supplies. Watch for hidden rocks on inside section at low tide.",
    difficulty: "ADVANCED",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.8,
      max: 6,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Rip currents", "Strong currents", "Sharks", "Remote location"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1123,
      lng: 18.4876,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=fX_E3_QsHWI&ab_channel=GeoffHautman",
        title: "Scarborough Cape Town Windsurf RAW 2nd Jan 2023 Aerials galore",
        platform: "youtube",
      },
    ],
    coffeeShop: [{ name: "Whole Earth Cafe" }],
  },
  {
    id: "dungeons",
    name: "Dungeons 💀",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Hout Bay",
    distanceFromCT: 40,
    optimalWindDirections: ["SE", "SSE"],
    optimalSwellDirections: {
      min: 157.5,
      max: 247.5,
    },
    bestSeasons: ["winter"],
    optimalTide: "HIGH",
    description:
      "Legendary big wave spot breaking over three distinct reef sections. Outside peak ('The Ridge') starts working at 15ft and holds up to 60ft faces, producing steep drops into massive walls. Middle section ('The Bowl') creates perfect giant barrels, while inside section ('The Finger') offers slightly smaller but still challenging waves. Needs minimum 15ft SW-WSW groundswell with 15+ second period to break properly. SE winds under 15 knots provide best conditions. Deep-water channel allows boat access but extremely challenging paddle-out (30+ minutes) even for elite surfers. Multiple boils and ledges create unpredictable wave behavior - extensive local knowledge essential. Strong currents can sweep surfers kilometers out to sea. Only attempt with proper big wave equipment, safety team, and serious experience. Best during winter months (June-August) when large groundswells are most consistent.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 3.5,
      max: 20.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: [
      "Big waves",
      "Strong currents",
      "Sharks",
      "Rocks",
      "Remote location",
    ],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.0576,
      lng: 18.3497,
    },
  },
  {
    id: "hout-bay-harbour-wedge",
    name: "Hout Bay Harbour Wedge",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Hout Bay",
    distanceFromCT: 40,
    optimalWindDirections: ["SE", "SSE"],
    optimalSwellDirections: {
      min: 225,
      max: 240,
    },
    bestSeasons: ["winter"],
    optimalTide: "HIGH",
    description: "Rarely works.",
    difficulty: "ADVANCED",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 3.2,
      max: 20.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: ["Potential theft."],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 0,
      lng: 0,
    },
  },
  {
    id: "glen-beach",
    name: "Glen Beach",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Camps Bay",
    distanceFromCT: 7,
    optimalWindDirections: ["E"],
    optimalSwellDirections: {
      min: 200,
      max: 245,
    },
    bestSeasons: ["winter"],
    optimalTide: "MID",
    description:
      "Wedgy peaks between Camps Bay and Clifton, works best with bigger swells",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.6,
      max: 4,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Rip currents", "Rocks", "Wind chop"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image:
      "https://images.unsplash.com/photo-1519941459598-a1588781b56e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2FtcHMlMjBiYXl8ZW58MHx8MHx8fDA%3D",
    coordinates: {
      lat: -33.9397,
      lng: 18.3775,
    },
  },
  {
    id: "kalk-bay-reef",
    name: "Kalk Bay Reef",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Kalk Bay",
    distanceFromCT: 35,
    optimalWindDirections: ["WNW", "NW"], // Simplified to primary optimal wind
    optimalSwellDirections: {
      min: 120,
      max: 160,
      cardinal: "SE", // Keeping the cardinal direction as SE
    },
    bestSeasons: ["winter"],
    optimalTide: "HIGH",
    description:
      "Right-hand reef break that handles size well. Can get very hollow and powerful, especially on bigger swells. Best performance on mid to high tide with SE swell and WNW winds. Wave face heights can range from 3-12ft, with optimal conditions producing fast, barreling sections over shallow reef. Advanced surfers only on bigger days. Rarely breaks with optimal conditions.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.6,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: ["Rocks", "Strong currents", "Sharks", "Shallow reef"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: true,
      incidents: [
        {
          date: "2013-07-14",
          outcome: "Non-fatal",
          details: "Surfer bitten on foot while surfing",
        },
      ],
    },
    image:
      "https://images.unsplash.com/photo-1631733515300-14f788f68e16?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8a2FsayUyMGJheSUyMHJlZWZ8ZW58MHx8MHx8fDA%3D",
    coordinates: {
      lat: -34.1275,
      lng: 18.4486,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=POA2k1wADxA&pp=ygUVa2FsayBiYXkgcmVlZiBzdXJmaW5n",
        title: "Kalk Bay Reef, Cape Town, South Africa",
        platform: "youtube",
      },
    ],
    coffeeShop: [{ name: "Chardonnay Deli Kalk Bay" }],
  },
  {
    id: "crayfish-factory",
    name: "Crayfish Factory",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Witsand",
    distanceFromCT: 30,
    optimalWindDirections: ["SE", "E"],
    optimalSwellDirections: {
      min: 150,
      max: 180,
    },
    bestSeasons: ["winter"],
    optimalTide: "MID",
    description:
      "Long right-hander that works best on bigger swells, relatively consistent",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 2.3,
      max: 8.6,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Rocks", "Strong currents", "Remote location"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1123,
      lng: 18.4876,
    },
  },
  {
    id: "betty's-bay",
    name: "Betty's Bay",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Betty's Bay",
    distanceFromCT: 95,
    optimalWindDirections: ["W", "NW"],
    optimalSwellDirections: {
      min: 137.5,
      max: 180.5,
      cardinal: "S",
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW",
    description:
      "Series of beach and reef breaks along 3km stretch. Main peak ('Die Plaat') offers powerful rights over reef, while beach breaks provide mellower options. Works best on winter SW swells with NW winds. Multiple takeoff zones spread crowds but watch for strong currents between peaks. Deep channels between reefs create strong rips - good for paddle outs but dangerous for inexperienced surfers. Known shark territory, luckily not Great Whites - stay alert and avoid dawn/dusk sessions.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.3,
      max: 0.6,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Sharks", "Rip currents", "Remote location"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=QEm65Je_5LY&ab_channel=NicoJooste",
        title: "This is why Betty's bay is my favorite place in South Africa!",
        platform: "youtube",
      },
    ],
  },
  {
    id: "pringle-bay",
    name: "Pringle Bay",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Pringle Bay",
    distanceFromCT: 85,
    optimalWindDirections: ["SE", "SSE"],
    optimalSwellDirections: {
      min: 215,
      max: 235,
      cardinal: "SW",
    },
    bestSeasons: ["sumer"],
    optimalTide: "MID",
    description:
      "Protected right-hand point break that works best when surrounding spots are too big. Wave wraps around headland creating long, tapering walls perfect for carving. Three main sections depending on size: outside peak (hollow), middle (long walls), inside reform (good for longboarding). Best on mid to high tide with SW swell. Morning offshores typically clean but watch for strong side-shore winds by midday. Rocky bottom requires careful entry point selection.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.3,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Rip currents", "Strong currents", "Remote location", "Sharks"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=KblHPXpvJmo&ab_channel=WilliamEveleigh",
        title: "Pringle Bay Surf",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=8Tt3UD9E6Zs&ab_channel=Bodyboarding4Fun",
        title:
          "Bodyboarding 4Fun - Pringle Bay, Offshore and spectacular [4 May 22]",
        platform: "youtube",
      },
    ],
  },
  {
    id: "elands-bay-the-point",
    name: "Elands Bay The Point",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Elands Bay",
    distanceFromCT: 220,
    optimalWindDirections: ["SE"],
    optimalSwellDirections: {
      min: 225,
      max: 270,
      cardinal: "SW",
    },
    bestSeasons: ["winter"],
    optimalTide: "HIGH",
    description:
      "World-class left-hand point break. Long walls and barrel sections on bigger swells.",
    difficulty: "ADVANCED",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.6,
      max: 3.8,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: ["Rocks", "Strong currents", "Remote location", "Sharks"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -32.3127,
      lng: 18.3331,
    },
  },
  {
    id: "derdesteen",
    name: "Derdesteen",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Bloubergstrand",
    distanceFromCT: 30,
    optimalWindDirections: ["ENE", "NE", "E"],
    optimalSwellDirections: {
      min: 225,
      max: 270,
      cardinal: "SW",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Consistent beach break with multiple peaks. Good for all tides. Popular with locals.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.3,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Rip currents", "Strong currents", "Wind chop"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1012,
      lng: 18.4987,
    },
  },
  {
    id: "melkbos",
    name: "Melkbos",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Melkbosstrand",
    distanceFromCT: 35,
    optimalWindDirections: ["NE", "E"],
    optimalSwellDirections: {
      min: 195,
      max: 225,
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW",
    description:
      "Long beach break with multiple peaks over 3km stretch. Northern end offers better shape with both lefts and rights. Sand bottom creates shifting peaks - scout banks before paddling out. Works well in summer when south spots are blown out. Best on SW swell with SE winds. Waves typically fuller on high tide, punchier on low. Good learner spot on smaller days but can handle size in winter. Strong currents run parallel to beach - stay in front of access point.",
    difficulty: "BEGINNER",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.3,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Rip currents", "Wind chop", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1123,
      lng: 18.4876,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=Vvra_KSQNQc&ab_channel=BirdsEyeViewZA",
        title: "Melkbos Surfing May 2024",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=JfeDzDN1toM&ab_channel=SimonDowdles",
        title: "Surfing Winter Swell At Melkbosstrand, Cape Town, South Africa",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=qaZ2xS8x1Xo&ab_channel=DylanKrause",
        title: "Surfing POV / Cape Town Melkbos",
        platform: "youtube",
      },
    ],
  },
  {
    id: "kogel-bay",
    name: "Kogel Bay",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Gordons Bay",
    distanceFromCT: 75,
    optimalWindDirections: ["NW", "W"],
    optimalSwellDirections: {
      min: 225,
      max: 315,
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW",
    description:
      "Powerful beach break with multiple peaks along curved bay. 'Caves' section offers hollow rights, while beach breaks provide both lefts and rights. Wave quality highly dependent on sandbank conditions. Best on SW swell with NW winds. Deep water behind breaks creates strong currents - use rip channels for paddle out but stay alert. Notorious shark territory - spotters often present but exercise caution. Early morning sessions recommended before winds increase.",
    difficulty: "ADVANCED",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.6,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: ["Sharks", "Strong currents", "Rip currents", "Remote location"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: true,
      incidents: [
        {
          date: "2013-04-19",
          outcome: "Fatal",
          details:
            "David Lilienfeld (20) was attacked while bodyboarding at Caves section. Fatal attack by ~15ft great white",
        },
      ],
    },
    image: "",
    coordinates: {
      lat: -34.1012,
      lng: 18.4987,
    },
  },
  {
    id: "strand",
    name: "Strand",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Strand",
    distanceFromCT: 50,
    optimalWindDirections: ["W", "NW"],
    optimalSwellDirections: {
      min: 225,
      max: 315,
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW",
    description:
      "Long beach with multiple peaks. Protected from summer SE winds. Good for learners.",
    difficulty: "BEGINNER",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.3,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Rip currents", "Wind chop", "Crowds"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1123,
      lng: 18.4876,
    },
  },
  {
    id: "langebaan",
    name: "Langebaan",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Langebaan",
    distanceFromCT: 120,
    optimalWindDirections: ["S", "SW"],
    optimalSwellDirections: {
      min: 285, // WNW
      max: 300, // WNW
      cardinal: "WNW", // More precise single direction
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW",
    description:
      "Lagoon waves, perfect for beginners. Only works on big WNW swells pushing into the lagoon.",
    difficulty: "BEGINNER",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 2.8,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Wind chop", "Kitesurfers", "Shallow sandbanks"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1012,
      lng: 18.4987,
    },
  },
  {
    id: "bruce's-beauties",
    name: "Bruce's Beauties",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "Cape St Francis",
    distanceFromCT: 750,
    optimalWindDirections: ["ESE"],
    optimalSwellDirections: {
      min: 100,
      max: 120,
      cardinal: "E",
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW",
    description:
      "Legendary point break with multiple sections: 'The Cauldron', 'The Bowl', 'The Tubes', and 'The Wall'. Best performance on ESE swell with low tide. Wave quality varies by section - 'The Cauldron' offers fast, hollow barrels, 'The Bowl' provides long walls, 'The Tubes' offers mellow sections, and 'The Wall' offers powerful, long rights. Rarely breaks with optimal conditions. Remote location means uncrowded sessions but bring all supplies. Watch for hidden rocks and strong currents.",
    difficulty: "ADVANCED",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.2,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 22,
      winter: 18,
    },
    hazards: ["Rocks", "Strong currents", "Remote location", "Sharks"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.0507,
      lng: 24.9281,
    },
  },
  {
    id: "seal-point",
    name: "Seal Point",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "Cape St Francis",
    distanceFromCT: 750,
    optimalWindDirections: ["NW"],
    optimalSwellDirections: {
      min: 135, // Changed from 200 to 135 (SE)
      max: 180, // Changed from 220 to 180 (S)
      cardinal: "S/SE", // Changed from "SSW" to "S/SE"
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW",
    description:
      "Consistent point break with multiple sections: 'The Cove', 'The Bowl', 'The Tubes', and 'The Wall'. Best performance on SSE swell with low tide. Wave quality varies by section - 'The Cove' offers fast, hollow barrels, 'The Bowl' provides long walls, 'The Tubes' offers mellow sections, and 'The Wall' offers powerful, long rights. Year-round reliability. Watch for strong currents and hidden rocks.",
    difficulty: "ADVANCED",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.2,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 22,
      winter: 18,
    },
    hazards: ["Rocks", "Strong currents", "Sharks"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.0507,
      lng: 24.9281,
    },
  },
  {
    id: "clapton's-coils",
    name: "Clapton's Coils",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "Eastern Cape (South)",
    distanceFromCT: 750,
    optimalWindDirections: ["NW"],
    optimalSwellDirections: {
      min: 90,
      max: 110,
      cardinal: "E",
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW",
    description:
      "Quality point break with multiple sections: 'The Cove', 'The Bowl', 'The Tubes', and 'The Wall'. Best performance on E swell with low tide. Wave quality varies by section - 'The Cove' offers fast, hollow barrels, 'The Bowl' provides long walls, 'The Tubes' offers mellow sections, and 'The Wall' offers powerful, long rights. Inconsistent but high-quality waves. Watch for strong currents and hidden rocks.",
    difficulty: "ADVANCED",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.2,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 22,
      winter: 18,
    },
    hazards: ["Rocks", "Strong currents", "Sharks"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.0507,
      lng: 24.9281,
    },
  },
  {
    id: "jeffreys-bay",
    name: "Jeffreys Bay",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "Jeffreys Bay",
    distanceFromCT: 750,
    optimalWindDirections: ["WNW", "W", "NW"], // Added WNW as primary optimal wind
    optimalSwellDirections: {
      min: 220, // S
      max: 240, // SSW
      cardinal: "S", // Updated to South as primary direction
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW_TO_MID",
    description:
      "World-class right-hand point break consisting of several sections: Kitchen Windows, Magnatubes, Boneyards, Supertubes, Impossibles, and Point. Supertubes section considered one of the best waves globally, offering perfect barrels over reef. Wave quality varies by section - Supertubes most hollow and fast, Point more manageable. Best performance on 4-8ft south swell with WNW winds. Handles all sizes while maintaining shape. Strong currents between sections require good fitness. Extremely competitive lineup - strict priority system observed. Winter brings consistent groundswells and optimal winds. Popular international destination - expect crowds during peak season.",
    difficulty: "ADVANCED",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.5,
      max: 3,
    },
    idealSwellPeriod: {
      min: 14,
      max: 18,
    },
    waterTemp: {
      summer: 22,
      winter: 18,
    },
    hazards: ["Rocks", "Strong currents", "Crowds", "Sharks"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: true,
      incidents: [
        {
          date: "2013-10-11",
          outcome: "Fatal",
          details:
            "Burgert van der Westhuizen (74) attacked while swimming at Lower Point",
        },
        {
          date: "2015-07-01",
          outcome: "Non-fatal",
          details:
            "Mick Fanning attacked during J-Bay Open final, escaped unharmed",
        },
        {
          date: "2024-05-03",
          outcome: "Non-fatal",
          details:
            "2024: A surfer was bitten but survived at Jeffrey's Bay, a popular surfing location in the Eastern Cape ",
        },
      ],
    },
    image: "/images/beaches/td-jbay.jpg",
    coordinates: {
      lat: -34.0507,
      lng: 24.9281,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=DcsMk4NYAkY&pp=ygURamVmZnJleXMgYmF5IHN1cmY%3D",
        title: "J-Bay's Surfer Boat Rides Supertubes. Rider: Oliver Tonkin",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=RrgWj1uYyhE&ab_channel=Surfline",
        title: "Visiting Pros and Locals Score Best Jeffrey's Bay in Years!",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=Kw8G7qugOJk&ab_channel=NextOffshoreAdventure",
        title: "J BAY XXXL SWELL TOUCHDOWN !! ITS FIRING!!",
        platform: "youtube",
      },
    ],
  },
  {
    id: "witsand",
    name: "Witsand",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Kommetjie",
    distanceFromCT: 30,
    optimalWindDirections: ["N", "NE"],
    optimalSwellDirections: {
      min: 220,
      max: 247.5,
      cardinal: "SW",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Consistent beach break offering multiple peaks across 1km stretch. Main peak provides powerful A-frames with both left and right options up to 100m long. Wave shape varies significantly with tide - steeper on low, more forgiving on high. Best performance on 4-6ft SW swell with SE winds under 15 knots. Morning sessions typically offer cleanest conditions before thermal winds increase. Multiple rip channels between sandbars aid paddle-outs but create strong currents - maintain position using land markers. Winter brings bigger swells and better winds, while summer offers reliable smaller waves. Popular local spot - respect peak hierarchy especially on good days. Limited parking near beach access. Watch for exposed rocks at low tide on southern end. Strong currents can develop with outgoing tide.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.4,
      max: 4.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Rip currents", "Wind chop", "Strong currents"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=XdDFfXcaCGU&pp=ygUNd2l0c2FuZHMgc3VyZg%3D%3D",
        title: "Witsands Surf....a wintery dip",
        platform: "youtube",
      },
    ],
  },
  {
    id: "hermanus",
    name: "Hermanus",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Hermanus",
    distanceFromCT: 120,
    optimalWindDirections: ["NW", "W"],
    optimalSwellDirections: {
      min: 225,
      max: 315,
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW",
    description:
      "Several spots including reef and beach breaks. Best during winter months.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.3,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Sharks", "Rocks", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1123,
      lng: 18.4876,
    },
  },
  {
    id: "sandy-bay",
    name: "Sandy Bay （人 人）",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Cape Peninsula",
    distanceFromCT: 25,
    optimalWindDirections: ["SE"],
    optimalSwellDirections: {
      min: 225,
      max: 270,
      cardinal: "SW to W",
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW_TO_MID",
    description:
      "Powerful beach break known for its punchy shore break barrels. Multiple peaks offer waves that break for up to 50 meters over sand bottom. Wave quality varies from hollow barrels to more manageable shoulders depending on swell size and sand configuration. Consistent (7/10) with moderate crowds during prime conditions (5/10). Best performance in SE winds with SW to W swells. Watch for strong rips and sudden size increases during large swells.",
    difficulty: "All Levels",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 2.2,
      max: 6,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: ["Rip currents", "Shore break", "Remote location"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1012,
      lng: 18.4987,
    },
  },
  {
    id: "outer-kom",
    name: "Outer Kom",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Kommetjie",
    distanceFromCT: 40,
    optimalWindDirections: ["NE"],
    optimalSwellDirections: {
      min: 260.5,
      max: 280.5,
    },
    bestSeasons: ["winter"],
    optimalTide: "HIGH",
    description:
      "Powerful right-hand reef break with three distinct sections over 300m ride. Outside peak ('The Bowl') offers steep drops and critical barrel sections, middle ('The Wall') provides powerful canvas for turns, while inside ('The Run') offers softer reform for finish. Needs minimum 4ft to start working, handles up to 15ft. Best on SE-ESE winds with SW swell and 12-15 second period. 15-20 minute paddle out through channel - good fitness essential. Deep water channel on outside but extremely shallow reef on takeoff zone and inside sections. Local knowledge crucial for safe navigation and wave selection. Strong localism - respect peak hierarchy. Best early morning before onshore flow develops. Winter brings consistent groundswells but also more cleanup sets. Summer sessions possible on bigger swells but typically inconsistent. Serious wave for experienced surfers only - heavy consequences for mistakes.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.5,
      max: 3,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: ["Rocks", "Strong currents", "Big waves", "Sharks"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1123,
      lng: 18.4876,
    },
  },
  {
    id: "inner-kom",
    name: "Inner Kom",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Kommetjie",
    distanceFromCT: 40,
    optimalWindDirections: ["ESE"], // Corrected to East-southeast
    optimalSwellDirections: {
      min: 270, // W
      max: 270, // W
      cardinal: "W",
    },
    bestSeasons: ["winter"],
    optimalTide: "HIGH",
    description:
      "Left-point break characterized by boulders on the bottom, offering fun waves primarily at high tide during rising tide conditions. Located within a 5-minute walk from parking. Can handle decent-sized swells and popular among experienced surfers. While generally consistent, wave quality varies. Gets crowded, especially on weekends with seasoned local surfers. Watch for strengthening rips away from the harbor and be prepared for rogue sets. Rewards those who can read the often shifting conditions. Works best with west swell and ESE winds.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 0.6,
      max: 3.0, // Was 2.0
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 16,
      winter: 13,
    },
    hazards: ["Rocks", "Rip currents", "Rogue sets", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    sheltered: true,
    image: "",
    coordinates: {
      lat: -34.1012,
      lng: 18.4987,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=AO0z4J5WSmA&ab_channel=LiseWessels",
        title: "BEST SURF SPOTS | POWER HOUR",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=7wxGPK_AL30&ab_channel=TristanLock",
        title: "BEST SURF SPOTS | POWER HOUR",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=NOxjaX9-j3o&ab_channel=cape%7Cdoctor",
        title: "BEST SURF SPOTS | POWER HOUR",
        platform: "youtube",
      },
    ],
  },
  {
    id: "noordhoek",
    name: "Noordhoek",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Noordhoek",
    distanceFromCT: 30,
    optimalWindDirections: ["SE"],
    optimalSwellDirections: {
      min: 225.5,
      max: 275.5,
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW",
    description:
      "Long beach with multiple peaks. Best on bigger swells. Watch out for rips.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 2.2,
      max: 4.0, // Was 4.0 - accurate
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Rip currents", "Strong currents", "Remote location", "Sharks"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: true,
      incidents: [
        {
          date: "2009-01-15",
          outcome: "Non-fatal",
          details: "Surfer sustained minor injuries",
        },
      ],
    },
    image: "",
    coordinates: {
      lat: -34.1012,
      lng: 18.4987,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=Q8NjWeBXrAU&ab_channel=Let%27sGoSakhubuntu%21",
        title: "POV WEDGE SURFING NOORDHOEK CAPE TOWN (3-4FT) / EP4",
        platform: "youtube",
      },
      {
        url: "https://youtu.be/vjSgpkuZbY8",
        title: "POV CRYSTAL clear cape town beach break (SURFING)",
        platform: "youtube",
      },
    ],
  },
  {
    id: "clovelly",
    name: "Clovelly",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Clovelly",
    distanceFromCT: 35,
    optimalWindDirections: ["NW", "W"],
    optimalSwellDirections: {
      min: 120,
      max: 160,
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW",
    description:
      "Right-hand point break in False Bay. Works best in winter with NW winds.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.6,
      max: 3.0, // Was 0.6
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Rocks", "Rip currents", "Wind chop"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: true,
      incidents: [
        {
          date: "2004-09-13",
          outcome: "Fatal",
          details: "Fatal attack on spearfisherman",
        },
      ],
    },
    image: "",
    coordinates: {
      lat: -34.1123,
      lng: 18.4876,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=EtuL36D_2lY&ab_channel=RobbiePOV",
        title: "RAW BODYBOARD POV: MICROWEDGE",
        platform: "youtube",
      },
    ],
  },

  {
    id: "misty-cliffs",
    name: "Misty Cliffs",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Misty Cliffs",
    distanceFromCT: 30,
    optimalWindDirections: ["NE", "E"],
    optimalSwellDirections: {
      min: 220,
      max: 230,
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW_TO_MID",
    description:
      "Best at low to mid tide. Strong currents. Theft area, be careful.",
    difficulty: "ADVANCED",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.1,
      max: 3.0, // Was 0.6
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: ["Strong currents", "Rocks", "Remote location", "Sharks"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1012,
      lng: 18.4987,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=xYZPvEYotgM&ab_channel=Taun",
        title: "MISTY CLIFFS SURFING | Jono Leader",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=rVfEISz30yw&pp=ygUUbWlzdHkgY2xpZmZzIHN1cmZpbmc%3D&ab_channel=Taun",
        title: "Best surf spots. Cape Town - Misty's 2020 03 21",
        platform: "youtube",
      },
    ],
  },
  {
    id: "buffels-bay",
    name: "Buffels Bay",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Cape Point",
    distanceFromCT: 35,
    optimalWindDirections: ["NW", "W"],
    optimalSwellDirections: {
      min: 225,
      max: 315,
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW",
    description:
      "Protected bay with gentle waves. Good for beginners and longboarding.",
    difficulty: "BEGINNER",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.3,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Rip currents", "Rocks", "Remote location"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1123,
      lng: 18.4876,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=4rUJTyOOkE8&ab_channel=CAMPBELLTV",
        title: "SURFING ON THE WILDSIDE OF BUFFELSBAY (Vlog 02)",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=ALpwacrc40I&ab_channel=cape%7Cdoctor",
        title: "SURFING CAPE of STORMS AFRICA | Buffels 2023 09 16 ",
        platform: "youtube",
      },
    ],
  },

  {
    id: "yzerfontein",
    name: "Yzerfontein",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "West Coast",
    distanceFromCT: 30,
    optimalWindDirections: ["E"], // Changed from ["SE", "E"]
    optimalSwellDirections: {
      min: 247.5, // WSW
      max: 270, // W
      cardinal: "WSW", // Changed from "S to SW"
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Beach break with multiple peaks. Can handle big swells. Best in morning offshore.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.3,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: [
      "Rip currents",
      "Wind chop",
      "Strong currents",
      "Remote location",
    ],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?app=desktop&v=N-y_UZWMinU&ab_channel=ZacKruyer",
        title:
          "Surfing Winter West Coast of South Africa 2020 - Riders: @adinmasencamp @ducky_staples @dietakhaarman @mafooslombard @iaincampbell_ @robbie_berman @mark_reitz @teegan_c @jordy_maree @jordysmith88 ",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=0fKS4ZLIH6Q&ab_channel=TheRegularGuy",
        title:
          "West Kegs - Perfect Tubes on South Africa's West Coast with Surfers, Dale Staples, Davey Van Zyl, Shane Sykes, Justin Sykes, Brian Furcy, Calvin Goor, Llewellyn Whittaker, Robbie Schofield and photographers, Alan van Gysen & Ian Thurtel",
        platform: "youtube",
      },
    ],
  },
  {
    id: "horse-trails",
    name: "Horse Trails",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Noordhoek",
    distanceFromCT: 30,
    optimalWindDirections: ["SE", "E"],
    optimalSwellDirections: {
      min: 225.5,
      max: 275.5,
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW",
    description:
      "Right-hand point break near Noordhoek. Works on bigger swells. Long walk required.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 2.1,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Remote location", "Rocks", "Strong currents"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1012,
      lng: 18.4987,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=jEoPsP3yW9s&ab_channel=MaderChod",
        title: "POV Surfing Horse Trails, Cape Town at Dawn",
        platform: "youtube",
      },
    ],
  },
  {
    id: "cemetery",
    name: "Cemetery",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Kalk Bay",
    distanceFromCT: 30,
    optimalWindDirections: ["NW"],
    optimalSwellDirections: {
      min: 135,
      max: 165,
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW",
    description:
      "Right-hand point break in Kalk Bay offering rides up to 200m in ideal conditions. Three distinct sections: outside peak ('The Point') provides steep drops and occasional barrels, middle section offers long walls perfect for carving, inside section ('The Reef') reforms for finish. Best performance on SW-W swells with light NW winds. Needs minimum 3ft to start working properly, handles up to 12ft. Wave quality highly tide-dependent - low tide exposes hazardous reef sections while high tide can swamp the break. Key takeoff zone is small and competitive - local hierarchy strictly enforced. Watch for strong backwash bouncing off harbor wall during bigger swells. Deep channel along harbor wall provides paddle-out option but creates dangerous current on bigger days. Early morning sessions recommended before onshore flow develops. Winter brings consistent groundswells and ideal wind conditions. Summer sessions possible but typically smaller and more inconsistent. Parking available at harbor but watch for break-ins. Local knowledge essential for navigating rocks and currents.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 0.6,
      max: 3.5, // Was 0.6
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Rocks", "Strong currents", "Shallow reef"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1012,
      lng: 18.4987,
    },
  },
  {
    id: "the-hoek",
    name: "The Hoek",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Noordhoek",
    distanceFromCT: 30,
    optimalWindDirections: ["SE", "E"],
    optimalSwellDirections: {
      min: 220,
      max: 247.5,
      cardinal: "SW", // Added cardinal direction
    },
    bestSeasons: ["autumn", "winter"], // Updated seasons
    optimalTide: "LOW", // Updated tide
    description:
      "Exposed beach break offering both left and right-handers. Wave quality is inconsistent and highly dependent on conditions. Best performance comes from SW groundswell combined with SE offshore winds. Can get crowded when working, making surfing potentially hazardous. Despite inconsistency, can produce quality waves during autumn and winter months when conditions align. Watch for strong currents and rips between sandbars.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK", // Updated to match info
    swellSize: {
      min: 2.1,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Rocks", "Strong currents", "Rip currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1012,
      lng: 18.4987,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=6GSV3qg_3IU&ab_channel=DCShoesAfrica",
        title: "The Hoek DC Edit.mp4",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=T67RYh6k2a4&ab_channel=MrCapediver",
        title: "Noordhoek Vibes",
        platform: "youtube",
      },
    ],
  },
  {
    id: "silverstroom",
    name: "Silverstroom",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Melkbosstrand",
    distanceFromCT: 35,
    optimalWindDirections: ["SE", "E"],
    optimalSwellDirections: {
      min: 225,
      max: 315,
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW",
    description:
      "Remote beach break with multiple peaks spanning 2km of coastline. Main peak offers A-frame waves with both left and right options up to 150m long. Wave quality highly dependent on sandbank configuration - best banks typically form after winter storms. Handles swells from 3-8ft, but excels at 4-6ft. Works best on SW swell with SE winds under 12 knots. Early sessions crucial as wind typically ruins it by 10am. Deep channels between banks create strong rips - good for paddle outs but dangerous for swimmers. Outside peaks handle bigger swells and offer longer rides, while inside reforms provide shorter but cleaner waves. Limited facilities - bring all supplies. Watch for exposed rocks at low tide near southern end. Less crowded alternative to Big Bay but requires more swell to work.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.6,
      max: 3.5, // Was 0.6
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Rip currents", "Remote location", "Strong currents"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },
  {
    id: "boneyards",
    name: "Boneyards",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Boneyards",
    distanceFromCT: 40,
    optimalWindDirections: ["ESE"],
    optimalSwellDirections: {
      min: 265,
      max: 275,
      cardinal: "W",
    },

    bestSeasons: ["winter"],
    optimalTide: "HIGH",
    description:
      "Heavy right-hand reef break that requires precise positioning. Fast, shallow takeoff leads into barrel section before wall section. Only breaks properly on low to mid tide with solid swell (6ft+). Best on SE winds with SW swell direction. Extremely shallow reef creates perfect shape but poses serious hazard - not suitable for inexperienced surfers. Local knowledge essential for safe navigation. Strong currents on outside require good fitness level. Early morning sessions recommended before wind shift.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 0.3,
      max: 3.4, // Was 0.6
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: ["Rocks", "Shallow reef", "Strong currents", "Sharks"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1123,
      lng: 18.4876,
    },
  },
  {
    id: "nine-miles",
    name: "Nine Miles",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Nine Miles",
    distanceFromCT: 40,
    optimalWindDirections: ["N", "NW"],
    optimalSwellDirections: {
      min: 157.5,
      max: 180.5,
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Remote beach break with multiple peaks. Long drive and walk required.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.6,
      max: 3.0, // Was 0.6
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Remote location", "Rip currents", "Strong currents"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },
  {
    id: "crons",
    name: "Crons",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Kommetjie",
    distanceFromCT: 35,
    optimalWindDirections: ["SE", "ESE"],
    optimalSwellDirections: {
      min: 330,
      max: 345,
      cardinal: "SW", // Updated to just SW as primary direction
    },
    bestSeasons: ["winter"],
    optimalTide: "HIGH",
    description:
      "Exposed beach break offering both lefts and rights. Best performance on SW groundswell with ESE winds. While fairly consistent, summer tends to be mostly flat. Wave quality varies with sandbank conditions. Watch out for dangerous rips, especially during bigger swells. Can get crowded when conditions are good.",
    difficulty: "ADVANCED",
    waveType: "BEACH_BREAK", // Confirmed as Beach Break
    swellSize: {
      min: 1.5,
      max: 8.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: [
      "Rocks",
      "Strong currents",
      "Shallow sandbanks",
      "Remote location",
    ],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1012,
      lng: 18.4987,
    },
  },
  {
    id: "rivermouth",
    name: "Rivermouth",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "East London",
    distanceFromCT: 1000,
    optimalWindDirections: ["SW", "W"],
    optimalSwellDirections: {
      min: 135,
      max: 225,
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Exposed beach break that provides consistent waves year-round, though summer tends to be mostly flat. Located at the Buffalo River mouth, this spot offers reliable waves when other spots aren't working.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.3,
      max: 4.6,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 22,
      winter: 18,
    },
    hazards: ["Rip currents", "Strong currents", "River mouth hazards"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },
  {
    id: "paranoia",
    name: "Paranoia",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Koeel Baai, Overberg",
    distanceFromCT: 40,
    optimalWindDirections: ["ESE"],
    optimalSwellDirections: {
      min: 180.5,
      max: 183.5,
    },
    bestSeasons: ["winter"],
    optimalTide: "HIGH",
    description:
      "Hidden reef break requiring specific conditions and local knowledge. Works on SW groundswell from 6-15ft with precise SE wind angle. Wave breaks over shallow rock shelf creating fast, hollow rights up to 150m long. Three sections: steep takeoff zone leading into barrel section, followed by wall, ending in inside bowl. Only breaks properly on mid to low tide. Extremely location-sensitive - slight wind or swell direction changes can render it unsurfable. Multiple hazards including exposed rocks, strong rips, and sudden closeouts. Access requires long paddle or boat trip. Rarely crowded due to fickle nature and difficult access, but locals protective of spot information. Best during winter months when conditions align. Not suitable for inexperienced surfers - consequences for mistakes severe.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.7,
      max: 5.1,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: [
      "Big waves",
      "Rocks",
      "Strong currents",
      "Remote location",
      "Sharks",
    ],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1123,
      lng: 18.4876,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=ypvKKEGyB9M&ab_channel=CJ%27scinema",
        title: "Adin Masencamp // Overberg surf",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=nr2xjbn-2c8&ab_channel=zlipperyEEL",
        title: "Paranoia overberg surfing clarence drive",
        platform: "youtube",
      },
    ],
  },

  {
    id: "platboom",
    name: "Platboom",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Cape Point",
    distanceFromCT: 35,
    optimalWindDirections: ["NW"],
    optimalSwellDirections: {
      min: 255,
      max: 285,
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW",
    description:
      "Remote beach break in Cape Point Reserve offering multiple peaks across 3km of pristine coastline. Wave quality varies with constantly shifting sandbanks - scout before paddling out. Main peak provides powerful A-frames, with rights typically offering longer rides. Handles all swell sizes but excels in 4-8ft SW groundswell with 12+ second period. Best conditions with light NW-NE winds early morning. Strong currents and multiple rip channels require good ocean knowledge. Extremely isolated location - bring all supplies and never surf alone. Notable wildlife activity including seals, sharks, and occasional whales. Access requires Cape Point Reserve entry fee and 20-minute drive on dirt road. Best during winter months when groundswells are most consistent. No facilities or cell reception - emergency assistance far away. Watch for sudden weather changes typical of peninsula location.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.2,
      max: 3.2,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Remote location", "Rip currents", "Strong currents", "Sharks"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1123,
      lng: 18.4876,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=bY1Gopk-oSw&ab_channel=JordyMaree",
        title: "Scoring at Heavy Slab in Cape Town",
        platform: "youtube",
      },
    ],
  },
  {
    id: "dias-beach",
    name: "Dias Beach",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Cape Point",
    distanceFromCT: 40,
    optimalWindDirections: ["N", "NE"],
    optimalSwellDirections: {
      min: 160.5,
      max: 200.5,
      cardinal: "S to SW",
    },
    bestSeasons: ["winter"],
    optimalTide: "HIGH",
    description:
      "Secluded break at Cape Point. Long stairs access. Works on bigger swells.",
    difficulty: "ADVANCED",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.3,
      max: 3.6,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: [
      "Remote location, entry fee to Cape Point Reserve",
      "Difficult access",
      "Strong currents",
      "Sharks",
    ],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1012,
      lng: 18.4987,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=TaPts0L_Af0&pp=ygUSZGlhcyBiZWFjaCBzdXJmaW5n",
        title: "Pumping Surf at Dias Beach",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=Tzzo84OPrYY&ab_channel=MatthewOrnellas",
        title: "Cape Point Nature Reserve / Dias Beach",
        platform: "youtube",
      },
    ],
  },
  {
    id: "cape-st-francis",
    name: "Cape St Francis",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "Cape St Francis",
    distanceFromCT: 730,
    optimalWindDirections: ["WNW", "W", "NW"], // Added WNW as primary optimal wind
    optimalSwellDirections: {
      min: 90, // Changed to E (90°)
      max: 135, // To SE (135°)
      cardinal: "E to SE", // Updated cardinal directions
    },
    bestSeasons: ["winter", "summer"], // Added summer as it works year-round
    optimalTide: "ALL",
    description:
      "World-class right-hand point break made famous by The Endless Summer. Offers perfect, peeling waves with multiple sections along a 300m ride. Best performance comes from east swell with WNW winds. Consistent year-round with good wave quality. Popular spot that can get crowded, especially during peak conditions. Protected from south winds by headland. Watch for strong currents around point.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.3,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 22,
      winter: 17,
    },
    hazards: ["Rocks", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.2044,
      lng: 24.8366,
    },
  },
  {
    id: "glencairn",
    name: "Glencairn",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "False Bay",
    distanceFromCT: 35,
    optimalWindDirections: ["WNW", "NW", "W"], // Added WNW as it's offshore here
    optimalSwellDirections: {
      min: 225,
      max: 315,
    },
    bestSeasons: ["winter"],
    optimalTide: "MID",
    description:
      "Protected beach break in False Bay, works best with NW winds. Good for beginners on smaller days.",
    difficulty: "BEGINNER",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 2.1,
      max: 5.6,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Rip currents", "Rocks", "Sharks"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image:
      "https://images.unsplash.com/photo-1666022392607-2890a8b85b8f?q=80&w=2574&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    coordinates: {
      lat: -34.1123,
      lng: 18.4876,
    },
  },

  {
    id: "fish-hoek",
    name: "Fish Hoek",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "False Bay",
    distanceFromCT: 35,
    optimalWindDirections: ["WNW", "NW", "W"], // Added WNW as it's offshore here
    optimalSwellDirections: {
      min: 120,
      max: 155,
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Long beach break with multiple peaks. Protected from SE winds. Good for beginners.",
    difficulty: "BEGINNER",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.8,
      max: 5.6,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Rip currents", "Sharks"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: true,
      incidents: [
        {
          date: "2011-09-28",
          outcome: "Fatal",
          details:
            "Fatal attack on swimmer despite shark spotters' warning flags",
        },
        {
          date: "2004-11-13",
          outcome: "Non-fatal",
          details: "Swimmer survived attack in shallow water",
        },
      ],
    },
    image: "",
    coordinates: {
      lat: -34.1123,
      lng: 18.4876,
    },
  },
  {
    id: "second-beach",
    name: "Second Beach",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "Port St Johns",
    distanceFromCT: 1200,
    optimalWindDirections: ["W", "SW"],
    optimalSwellDirections: {
      min: 135,
      max: 225,
    },
    bestSeasons: ["summer"],
    optimalTide: "MID",
    description:
      "Powerful beach break known for its consistent waves and unfortunately, frequent shark activity. Multiple peaks along the beach with both lefts and rights. Best on SW swell with light offshore winds.",
    difficulty: "ADVANCED",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.6,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 22,
      winter: 18,
    },
    hazards: ["Sharks", "Strong currents", "Rip currents"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: true,
      incidents: [
        {
          date: "2012-01-15",
          outcome: "Fatal",
          details: "Lungisani Msungubana (25) attacked in waist-deep water",
        },
        {
          date: "2011-01-15",
          outcome: "Fatal",
          details: "Zama Ndamase (16) fatal attack while surfing",
        },
        {
          date: "2009-12-18",
          outcome: "Fatal",
          details: "Tshintshekile Nduva (22) attacked while paddle boarding",
        },
        {
          date: "2009-01-24",
          outcome: "Fatal",
          details: "Sikhanyiso Bangilizwe (27) fatal attack while swimming",
        },
        {
          date: "2007-01-14",
          outcome: "Fatal",
          details: "Sibulele Masiza (24) disappeared while bodyboarding",
        },
      ],
    },
    image: "",
    coordinates: {
      lat: -31.6271,
      lng: 29.5444,
    },
  },
  {
    id: "plettenberg-bay",
    name: "Plettenberg Bay",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "Plettenberg Bay",
    distanceFromCT: 520,
    optimalWindDirections: ["W", "SW"],
    optimalSwellDirections: {
      min: 180,
      max: 225,
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Multiple beach breaks and point breaks offering various wave types. Popular surf destination with consistent waves.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.3,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 16,
    },
    waterTemp: {
      summer: 21,
      winter: 17,
    },
    hazards: ["Sharks", "Rip currents", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: true,
      incidents: [
        {
          date: "2022-09-25",
          outcome: "Fatal",
          details:
            "Kimon Bisogno (39) attacked by great white shark while swimming",
        },
        {
          date: "2022-06-28",
          outcome: "Fatal",
          details:
            "Bruce Wolov (63) attacked by great white shark while swimming",
        },
      ],
    },
    image: "",
    coordinates: {
      lat: -34.0527,
      lng: 23.3716,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=BotuctY6XzI&ab_channel=PsychedOut",
        title: "Bodyboarding // Plett Wedge // Plettenberg Bay",
        platform: "youtube",
      },
    ],
  },
  {
    id: "nahoon-reef",
    name: "Nahoon Reef",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "East London",
    distanceFromCT: 1000,
    optimalWindDirections: ["SW", "W"],
    optimalSwellDirections: {
      min: 135,
      max: 225,
    },
    bestSeasons: ["winter", "summer"],
    optimalTide: "MID",
    description:
      "Premier right-hand reef break. Powerful waves breaking over shallow reef. Best on SW swell with offshore winds.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.6,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 22,
      winter: 18,
    },
    hazards: ["Rocks", "Sharks", "Strong currents"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: true,
      incidents: [
        {
          date: "1994-07-09",
          outcome: "Fatal",
          details: "Bruce Corby (22) fatal attack while surfing at Nahoon Reef",
        },
      ],
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },
  {
    id: "mossel-bay",
    name: "Mossel Bay",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Mossel Bay",
    distanceFromCT: 400,
    optimalWindDirections: ["NW", "W", "SW"],
    optimalSwellDirections: {
      min: 90,
      max: 120,
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Various reef and beach breaks offering different wave types. Inner Pool and Outer Pool provide good right-handers.  The local surfing community is known for its welcoming nature, making it an ideal destination for surfers of all skill levels. Whether you're a seasoned pro or just starting out, Mossel Bay offers a supportive environment to hone your skills and enjoy the waves.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.3,
      max: 5.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 20,
      winter: 16,
    },
    hazards: ["Rocks", "Strong currents", "Sharks"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: true,
      incidents: [
        {
          date: "1990-06-24",
          outcome: "Fatal",
          details:
            "Monique Price (21) attacked while diving to recover an anchor",
        },
      ],
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=WnYnXiONb_U&ab_channel=StokedTheBrand",
        title: "Stoked Sessions • Surfing Mossel Bay - Stoked X Kane Johnstone",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=D3BJLfvuf3g&pp=ygUPbW9zc2VsIGJheSBzdXJm",
        title: "RAW: Mossel Bay, 5 July 2021 (Featuring Adin Masencamp)",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=vqSUqsLv1HA&ab_channel=SandyMarwick",
        title: "Surfing at Outer Pool, Mossel Bay",
        platform: "youtube",
      },
    ],
  },
  {
    id: "stilbaai",
    name: "Stilbaai",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Stilbaai",
    distanceFromCT: 350,
    optimalWindDirections: ["N", "W", "NW"],
    optimalSwellDirections: {
      min: 90,
      max: 150,
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Long right-hand point break with multiple sections. Works best on SW swell with offshore winds.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.3,
      max: 4.2,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 21,
      winter: 17,
    },
    hazards: ["Rocks", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: true,
      incidents: [
        {
          date: "1999-07-15",
          outcome: "Fatal",
          details: "Hercules Pretorius (15) attacked while body boarding",
        },
      ],
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=Fuv6jdUOK-U&ab_channel=BonzovanRooyen",
        title: "Stilbaai March 2018",
        platform: "youtube",
      },
    ],
  },
  {
    id: "wilderness",
    name: "Wilderness",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Wilderness",
    distanceFromCT: 440,
    optimalWindDirections: ["SW", "W"],
    optimalSwellDirections: {
      min: 180,
      max: 270,
    },
    bestSeasons: ["summer", "winter"],
    optimalTide: "ALL",
    description:
      "Long stretch of beach break with multiple peaks. Best known for its consistent waves and beautiful setting within the Garden Route. Works in most conditions but excels with SW swell and light offshore winds. Multiple peaks spread crowds well. Good for all skill levels depending on conditions. Beach access is easy with multiple parking areas and facilities nearby. Watch for strong rip currents, especially during bigger swells.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.3,
      max: 3.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 16,
    },
    waterTemp: {
      summer: 21,
      winter: 17,
    },
    hazards: ["Rip currents", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: true,
      incidents: [
        {
          date: "1996-05-28",
          outcome: "Non-fatal",
          details:
            "Donovan Kohne (17) attacked by great white shark while surfing",
        },
      ],
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },
  {
    id: "coffee-bay",
    name: "Coffee Bay",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "Transkei",
    distanceFromCT: 1200,
    optimalWindDirections: ["SW", "W"],
    optimalSwellDirections: {
      min: 135,
      max: 225,
    },
    bestSeasons: ["summer", "winter"],
    optimalTide: "MID",
    description:
      "Remote point break in the heart of the Wild Coast. Multiple surf spots including the main beach break and right-hand point. Best on SW swell with offshore winds. Warm water and uncrowded waves, but remote location requires planning. Beautiful setting with traditional Xhosa villages nearby. Access requires 4x4 or long walk. Basic accommodations available in town.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.6,
      max: 3.2,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 23,
      winter: 19,
    },
    hazards: [
      "Remote location",
      "Strong currents",
      "Rocks",
      "Limited facilities",
    ],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=lcCVkBHMq5k&ab_channel=StokedForTravel",
        title:
          "Welcome To The Wild Coast - Surfing In Coffee Bay, South Africa | Stoked For Travel",
        platform: "youtube",
      },
    ],
  },
  {
    id: "mdumbi",
    name: "Mdumbi",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "Transkei",
    distanceFromCT: 1220,
    optimalWindDirections: ["SW", "W"],
    optimalSwellDirections: {
      min: 135,
      max: 225,
    },
    bestSeasons: ["summer", "winter"],
    optimalTide: "ALL",
    description:
      "Perfect right-hand point break considered one of South Africa's best waves. Long, peeling walls offer multiple sections. Works best on SW swell with light offshore winds. Remote location and basic facilities, but consistent quality waves. Strong local community presence with eco-lodge accommodation. Access requires 4x4 vehicle.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.6,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 23,
      winter: 19,
    },
    hazards: [
      "Remote location",
      "Strong currents",
      "Limited facilities",
      "Sharks",
    ],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: true,
      incidents: [
        {
          date: "2024-01-15",
          outcome: "Non-fatal",
          details:
            "Local freediver in his 40s sustained lacerations from shark bite, airlifted to hospital in stable condition",
        },
      ],
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=DhrP6Koc_vI&ab_channel=Cars.co.za",
        title:
          "Road Trip South Africa: 4x4 surf adventure through Transkei - Mdumbi, Coffee Bay, Hole in the wall",
        platform: "youtube",
      },
    ],
  },
  {
    id: "ntlonyane-breezy-point",
    name: "Ntlonyane (Breezy Point)",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "Transkei",
    distanceFromCT: 1150,
    optimalWindDirections: ["SW", "W"],
    optimalSwellDirections: {
      min: 135,
      max: 225,
    },
    bestSeasons: ["summer", "winter"],
    optimalTide: "MID_TO_HIGH",
    description:
      "World-class right-hand point break producing long, perfect waves. Multiple sections offering barrels and walls. Requires solid swell to break properly. Very remote location with minimal facilities - camping or basic accommodation only. Access difficult without 4x4. Local guide recommended for first visit.",
    difficulty: "ADVANCED",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 0.9,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 23,
      winter: 19,
    },
    hazards: [
      "Remote location",
      "Rocks",
      "Strong currents",
      "Limited facilities",
    ],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },
  {
    id: "hole-in-the-wall",
    name: "Hole in the Wall",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "Transkei",
    distanceFromCT: 1180,
    optimalWindDirections: ["SW", "W"],
    optimalSwellDirections: {
      min: 135,
      max: 225,
    },
    bestSeasons: ["summer", "winter"],
    optimalTide: "MID",
    description:
      "Powerful right-hand point break next to iconic rock formation. Works best on SW swell with offshore winds. Multiple sections including hollow inside bowl. Remote location requires planning. Basic accommodation available nearby. Strong currents and rocky bottom demand respect.",
    difficulty: "ADVANCED",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 0.6,
      max: 2.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 23,
      winter: 19,
    },
    hazards: [
      "Remote location",
      "Rocks",
      "Strong currents",
      "Limited facilities",
    ],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=DhrP6Koc_vI&ab_channel=Cars.co.za",
        title:
          "Road Trip South Africa: 4x4 surf adventure through Transkei - Mdumbi, Coffee Bay, Hole in the wall",
        platform: "youtube",
      },
    ],
  },

  {
    id: "lamberts-bay",
    name: "Lamberts Bay",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Lamberts Bay",
    distanceFromCT: 280,
    optimalWindDirections: ["E"],
    optimalSwellDirections: {
      min: 225,
      max: 270,
    },
    bestSeasons: ["winter"],
    optimalTide: "MID",
    description:
      "Long right-hand point break with multiple sections. Works best on SW swell with SE winds. Known for its consistency and quality during winter months. Protected from summer SE winds by headland. Multiple take-off zones spread crowds. Watch for local territorial vibes.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.6,
      max: 5.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: ["Rocks", "Strong currents", "Remote location", "Sharks"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },
  {
    id: "doring-bay",
    name: "Doring Bay",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Doring Bay",
    distanceFromCT: 300,
    optimalWindDirections: ["SE", "E"],
    optimalSwellDirections: {
      min: 240.5,
      max: 285.5,
    },
    bestSeasons: ["winter"],
    optimalTide: "MID_TO_HIGH",
    description:
      "Powerful right-hand point break that handles big swells well. Multiple sections including hollow inside bowl. Best on SW swell with SE winds. Remote location means uncrowded sessions but bring all supplies. Strong currents and rocky bottom require experience.",
    difficulty: "ADVANCED",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.6,
      max: 4.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: ["Rocks", "Strong currents", "Remote location", "Sharks"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },
  {
    id: "paternoster",
    name: "Paternoster",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Paternoster",
    distanceFromCT: 155,
    optimalWindDirections: ["SE", "E"],
    optimalSwellDirections: {
      min: 340.5,
      max: 345.5,
    },
    bestSeasons: ["winter"],
    optimalTide: "MID",
    description:
      "Beach break with multiple peaks along scenic West Coast beach. Works best on SW swell with SE winds. Relatively consistent year-round but excels in winter. Good for all skill levels depending on conditions. Watch for strong currents and seasonal bluebottles.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 3.3,
      max: 7.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: ["Rip currents", "Strong currents", "Remote location"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },
  {
    id: "famous",
    name: "Famous",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Elands Bay",
    distanceFromCT: 220,
    optimalWindDirections: ["E"],
    optimalSwellDirections: {
      min: 225,
      max: 270,
    },
    bestSeasons: ["winter"],
    optimalTide: "MID_TO_HIGH",
    description:
      "Powerful A-frame beach break just south of Elands Bay's main point. Known for producing hollow barrels, especially on bigger swells. Multiple peaks along the beach, with the main peak offering both left and right options. Works best on SW-W swell with SE winds. Wave quality highly dependent on sandbank conditions. Early morning sessions recommended before onshore winds develop. Strong rips provide good paddle-out channels but create hazardous currents.",
    difficulty: "ADVANCED",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 2.9,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: ["Strong currents", "Rip currents", "Remote location", "Sharks"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1123,
      lng: 18.4876,
    },
  },
  {
    id: "britannia-bay",
    name: "Britannia Bay",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "St Helena Bay",
    distanceFromCT: 175,
    optimalWindDirections: ["SE", "S"],
    optimalSwellDirections: {
      min: 135.5,
      max: 180.5,
    },
    bestSeasons: ["winter"],
    optimalTide: "MID",
    description:
      "Series of right-hand point breaks along rocky coastline. Main point offers long walls on bigger swells. Multiple take-off zones spread crowds. Best on SW swell with SE winds. Remote location means uncrowded sessions. Watch for strong currents around headlands.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.6,
      max: 3.7,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: ["Rocks", "Strong currents", "Remote location"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=BFumTBHAOwo&pp=ygUPZWxhbmRzIGJheSBzdXJm",
        title: "Surfing the best Elands Bay in Years!",
        platform: "youtube",
      },
    ],
  },
  {
    id: "tietiesbaai",
    name: "Tietiesbaai",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Paternoster",
    distanceFromCT: 160,
    optimalWindDirections: ["NE", "E"],
    optimalSwellDirections: {
      min: 180.5,
      max: 247.5,
    },
    bestSeasons: ["winter"],
    optimalTide: "MID_TO_HIGH",
    description:
      "Right-hand point break in scenic Cape Columbine Nature Reserve. Works best on solid SW swell with SE winds. Multiple sections including hollow inside bowl. Remote location requires planning. Basic camping facilities nearby. Rocky entry/exit requires careful timing.",
    difficulty: "ADVANCED",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.6,
      max: 5.0, // Was 2.0
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: [
      "Rocks",
      "Strong currents",
      "Remote location",
      "Limited facilities",
    ],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },
  {
    id: "hondeklip-bay",
    name: "Hondeklip Bay",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Northern Cape",
    location: " Namakwa district",
    distanceFromCT: 515,
    optimalWindDirections: ["SE", "E"],
    optimalSwellDirections: {
      min: 220.5,
      max: 260.5,
    },
    bestSeasons: ["winter"],
    optimalTide: "MID_TO_HIGH",
    description:
      "Hondeklip Bay is a coastal village in the Namakwa district of the Northern Cape province of South Africa. It lies about 95 km south west of the district capital Springbok.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.6,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 14,
      winter: 10,
    },
    hazards: ["Cold water", "Remote location", "Strong currents", "Fog"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=_G-o3tPliek&ab_channel=AmandlaSurfFoundation",
        title: "Help bring surfing to Hondeklip Bay Kids",
        platform: "youtube",
      },
    ],
  },
  {
    id: "port-nolloth",
    name: "Port Nolloth",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Northern Cape",
    location: "Port Nolloth",
    distanceFromCT: 770,
    optimalWindDirections: ["SE", "E"],
    optimalSwellDirections: {
      min: 220.5,
      max: 280.5,
    },
    bestSeasons: ["winter"],
    optimalTide: "MID_TO_HIGH",
    description:
      "Port Nolloth is a coastal village in the Northern Cape province of South Africa. It lies about 770 km north of the provincial capital, Kimberley.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.6,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 14,
      winter: 10,
    },
    hazards: ["Cold water", "Remote location", "Strong currents", "Fog"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },
  {
    id: "heaven",
    name: "Heaven",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "West Coast",
    distanceFromCT: 230,
    optimalWindDirections: ["S"], // Updated: offshore winds from the south
    optimalSwellDirections: {
      min: 222.5, // WSW swell direction
      max: 270,
    },
    bestSeasons: ["summer"], // Updated: best in summer, particularly January
    optimalTide: "ALL", // Updated: surfable at all stages of tide
    description:
      "Reasonably exposed reef and point break that's inconsistent but can produce quality waves. Best conditions occur with WSW swell and offshore southerly winds. Can handle light onshore winds. Groundswells more frequent than windswells. Take care of rocks in the lineup. Rarely crowded. Clean surfable waves found 69% of the time in January.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK", // Updated: it's primarily a reef break with point characteristics
    swellSize: {
      min: 1.6,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 15, // Updated based on current reading
      winter: 12,
    },
    hazards: ["Rocks", "Inconsistent waves", "Remote location"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1123,
      lng: 18.4876,
    },
  },
  {
    id: "baboon-point",
    name: "Baboon Point",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Elands Bay",
    distanceFromCT: 220,
    optimalWindDirections: ["E"], // Best wind direction is from the east
    optimalSwellDirections: {
      min: 240, // WSW swell direction
      max: 270, // Changed from 220 to 240 (S)
      cardinal: "S/SE", // Changed from "SSW" to "S/SE"
    },
    bestSeasons: ["winter"], // Best in winter, particularly July
    optimalTide: "ALL", // No specific tide mentioned, assuming works at all tides
    description:
      "Exposed reef break that's fairly consistent throughout the year. Left-breaking reef that works best with WSW groundswell and easterly winds. Can get crowded when conditions are good. Clean surfable waves found 39% of the time in July, though can be frequently blown out (60% of the time in peak season).",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 2.2,
      max: 4.0, // Was 2.5
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 15, // Based on current reading
      winter: 12,
    },
    hazards: ["Rocks", "Crowds", "Strong winds", "Petrol Price"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1123,
      lng: 18.4876,
    },
  },
  {
    id: "donkin-bay",
    name: "Donkin Bay",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "West Coast",
    distanceFromCT: 240, // Approximate distance, please adjust if needed
    optimalWindDirections: ["ESE"], // Best wind direction is from the east-southeast
    optimalSwellDirections: {
      min: 202.5, // SW swell direction
      max: 247.5,
    },
    bestSeasons: ["winter"], // Assuming winter based on SW swell direction
    optimalTide: "ALL", // No specific tide mentioned
    description:
      "Fairly consistent reef and point break combination. Works best with Southwest swell and ESE offshore winds. Multiple sections offering different wave characteristics due to the mixed reef and point setup.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK", // Listed as both reef and point, but primary characteristic seems to be reef
    swellSize: {
      min: 2.1,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 16, // Based on current reading
      winter: 12,
    },
    hazards: ["Rocks", "Strong currents", "Remote location"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },
  {
    id: "strandfontein",
    name: "Strandfontein",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "West Coast",
    distanceFromCT: 300, // Approximate distance, please adjust if needed
    optimalWindDirections: ["E"], // Best wind direction is from the east
    optimalSwellDirections: {
      min: 227.5, // SW swell direction
      max: 270.5,
    },
    bestSeasons: ["winter"], // Assuming winter based on SW swell direction
    optimalTide: "ALL", // No specific tide mentioned
    description:
      "Inconsistent beach break that can produce quality waves when conditions align. Works best with Southwest swell and easterly offshore winds. Multiple peaks along the beach offering different wave options.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 2.1,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 16, // Based on current reading
      winter: 12,
    },
    hazards: ["Rip currents", "Strong currents", "Remote location"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },
  {
    id: "hangklip-lighthouse",
    name: "Hangklip Lighthouse",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Pringle Bay",
    distanceFromCT: 250, // Approximate distance, please adjust if needed
    optimalWindDirections: ["NW"], // Best wind direction is from the northwest
    optimalSwellDirections: {
      min: 180, // W swell direction
      max: 230,
    },
    bestSeasons: ["winter"], // Assuming winter based on W swell direction
    optimalTide: "ALL", // No specific tide mentioned
    description:
      "Consistent reef break offering reliable conditions when other spots might not be working.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 2.1,
      max: 3.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 20, // Based on current reading
      winter: 15,
    },
    hazards: ["Rocks", "Strong currents", "Remote location"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },
  {
    id: "moonlight-bay",
    name: "Moonlight Bay",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Betty's Bay",
    distanceFromCT: 90, // Approximate distance from Cape Town in km
    optimalWindDirections: ["E", "NE", "SE"],
    optimalSwellDirections: {
      min: 180, // S
      max: 200, // SW
      cardinal: "S to SW",
    },
    bestSeasons: ["winter"], // Added based on swell direction preference
    optimalTide: "ALL",
    description:
      "Right-hand reef break in Betty's Bay offering waves suitable for intermediate surfers. Works on all tides but conditions vary. Multiple sections with rocky bottom require careful navigation. Local knowledge beneficial due to strong local surf community presence.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 2.1,
      max: 4.6,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Rocks", "Rip currents", "Localism"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },
  {
    id: "harold-porter",
    name: "Harold Porter",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Betty's Bay",
    distanceFromCT: 90, // Approximate distance from Cape Town in km
    optimalWindDirections: ["N", "NE", "NW"],
    optimalSwellDirections: {
      min: 150, // S
      max: 200, // SW
      cardinal: "S to SW",
    },
    bestSeasons: ["winter"], // Added based on swell direction preference
    optimalTide: "MID",
    description:
      "Incredible reef break that breaks rarely, only on massive swell.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 3,
      max: 4.6,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Rocks", "Rip currents", "Sharks", "Remote location"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },
  {
    id: "thermopylae",
    name: "Thermopylae",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Cape Peninsula",
    distanceFromCT: 40, // Approximate distance, please adjust if needed
    optimalWindDirections: ["SE"],
    optimalSwellDirections: {
      min: 225, // SW
      max: 247.5, // WSW
      cardinal: "SW to WSW",
    },
    bestSeasons: ["winter"], // Added based on big swell requirement
    optimalTide: "MID_TO_HIGH",
    description:
      "Powerful left-hand reef break that works only on big to massive swells. Wave wraps around and creates powerful sections along its 200m length. Located just inside a shipwreck with a critical takeoff. Despite being more protected than exposed breaks, experiences very strong currents. Inconsistent (3/10) but moderately crowded (5/10) when working. Requires solid swell to break but offers quality waves when conditions align.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.8, // Chest high
      max: 4.7, // Double overhead
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: ["Rocks", "Strong currents", "Shipwreck", "Critical takeoff"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1012,
      lng: 18.4987,
    },
  },
  {
    id: "virgin-point",
    name: "Virgin Point",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Cape Peninsula",
    distanceFromCT: 40, // Approximate distance, please adjust if needed
    optimalWindDirections: ["SE"],
    optimalSwellDirections: {
      min: 225, // SW
      max: 247.5, // WSW
      cardinal: "SW to WSW",
    },
    bestSeasons: ["winter"], // Added based on big swell requirement
    optimalTide: "MID_TO_HIGH",
    description:
      "Quality left-hand point break offering heavy barrels and performance walls along a 200m stretch. Wave breaks over boulder-covered bottom. Extremely difficult access requiring steep mountain descent and rock hop to reach lineup. Return climb equally challenging. Despite heavy conditions, spot maintains moderate consistency (5/10) and relatively uncrowded (3/10) due to access difficulty. Handles large swells well but demands advanced skill level.",
    difficulty: "ADVANCED",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 2.0, // Head high
      max: 5.5, // Triple overhead
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: ["Rocks", "Difficult access", "Heavy waves", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1012,
      lng: 18.4987,
    },
  },
  {
    id: "bellows",
    name: "Bellows 💀", // Added skull emoji
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Cape Peninsula",
    distanceFromCT: 45, // Approximate distance to offshore location
    optimalWindDirections: ["N", "NE", "NW"],
    optimalSwellDirections: {
      min: 135, // SE
      max: 225, // SW
      cardinal: "SE to SW",
    },
    bestSeasons: ["winter"], // Added based on big swell requirement
    optimalTide: "ALL",
    description:
      "Offshore big wave break located southwest of Seal Island. Offers both left and right options with the left being superior, capable of producing quality barrels. Boat access only and extremely sharky due to proximity to Seal Island's large Great White population. Wave consistency is moderate (4/10) but spot remains virtually empty (1/10) due to location and hazards. Best surfed on calm days due to unpredictable offshore winds. Requires significant experience and proper big wave equipment.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 3.0, // Double overhead
      max: 12.0, // Was 5.5
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: ["Sharks", "Remote location", "Boat access only", "Big waves"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false, // While shark population is high, no recorded attacks at this specific break
    },
    image: "",
    coordinates: {
      lat: -34.1012,
      lng: 18.4987,
    },
  },
  {
    id: "i&js",
    name: "I&J's",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Cape Peninsula",
    distanceFromCT: 40, // Approximate distance
    optimalWindDirections: ["NE"],
    optimalSwellDirections: {
      min: 225, // SW
      max: 247.5, // WSW
      cardinal: "SW to WSW",
    },
    bestSeasons: ["winter"], // Added based on SW swell requirement
    optimalTide: "LOW_TO_MID",
    description:
      "High-performance right-hand reef break offering multiple sections along a 300m stretch. Main peak provides long, rippable walls with good reform section inside. Several distinct takeoff zones spread across interconnected reef systems. Wave quality ranges from performance walls to more forgiving reform sections, making it suitable for varying skill levels. Relatively consistent (6/10) with moderate crowd levels (3/10). Rock bottom requires careful navigation, especially on lower tides. Best performance on SW swell with clean NE winds. Location near K365 offers alternative options when conditions align.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.6, // Waist high
      max: 3.7, // Double overhead
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: ["Rocks", "Reef", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },

  {
    id: "yellow-sands",
    name: "Yellow Sands",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "Amatola Coastal",
    distanceFromCT: 950, // Approximate distance
    optimalWindDirections: ["SW", "W"], // Based on regional patterns
    optimalSwellDirections: {
      min: 135, // SE
      max: 225, // SW
      cardinal: "SE to SW",
    },
    bestSeasons: ["winter", "summer"], // Works year-round with right conditions
    optimalTide: "LOW_TO_MID",
    description:
      "Classic right-hand point break in the Eastern Cape offering long, peeling waves over a rock and reef bottom. Known for its consistency and quality when conditions align. Multiple sections provide opportunities for both barrel sections and performance surfing. Remote location helps keep crowds moderate despite quality waves. Local knowledge valuable for navigating rocks and optimal tide timing. Watch for sea urchins on rocks during entry/exit.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.6, // Shoulder high
      max: 3.5, // Double overhead
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 21,
      winter: 17,
    },
    hazards: ["Rocks", "Sharks", "Urchins", "Localism"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false, // No recorded incidents at this specific break
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },
  {
    id: "365s",
    name: "365s",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Kommetjie",
    distanceFromCT: 25,
    optimalWindDirections: ["NE"],
    optimalSwellDirections: {
      min: 270, // Changed: West swell (270°)
      max: 280, // Allowing some variation
      cardinal: "W", // Updated to match description
    },
    bestSeasons: ["winter", "autumn"], // Updated: works year-round but summer tends to be flat
    optimalTide: "LOW_TO_MID",
    description:
      "Exposed reef break offering both left and right options. Fairly consistent waves except during summer months. Best conditions occur with west swell and northeast winds, though can handle light onshore conditions. Clean groundswells prevail. Usually uncrowded even with good waves. Access requires careful navigation of rocks and kelp beds.",
    difficulty: "INTERMEDIATE", // Changed from "All Levels" given reef break nature
    waveType: "REEF_BREAK", // Changed from "Beach Break" to match description
    swellSize: {
      min: 1.6, // Adjusted to more typical reef break minimums
      max: 3.0, // Adjusted based on typical conditions
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 19, // Updated based on current reading of 18.8°C
      winter: 12,
    },
    hazards: ["Rocks", "Sharks", "Kelp"], // Updated to match description
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },
  {
    id: "olifants-bos",
    name: "Olifants Bos",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Cape Peninsula",
    distanceFromCT: 40, // Approximate distance, please adjust if needed
    optimalWindDirections: ["SE"],
    optimalSwellDirections: {
      min: 247.5, // WSW
      max: 270, // W
      cardinal: "WSW to W",
    },
    bestSeasons: ["winter"], // Added based on typical swell patterns
    optimalTide: "ALL", // No specific tide information provided
    description:
      "Fairly consistent reef and point break combination offering quality waves when conditions align. Works best with WSW swell and SE offshore winds. Multiple sections available due to mixed reef and point setup. Despite good rating, rarely crowded.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK", // Listed as both reef and point, but primary characteristic seems to be reef
    swellSize: {
      min: 1.6,
      max: 2.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 19, // Based on current reading of 18.9°C
      winter: 14,
    },
    hazards: ["Rocks", "Strong currents", "Remote location"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },
  {
    id: "extensions",
    name: "Extensions",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Cape Peninsula",
    distanceFromCT: 35, // Approximate distance, please adjust if needed
    optimalWindDirections: ["E"],
    optimalSwellDirections: {
      min: 270, // W
      max: 280, // Allowing some variation
      cardinal: "W",
    },
    bestSeasons: ["winter"], // Added based on typical Cape Peninsula patterns
    optimalTide: "ALL", // No specific tide information provided
    description:
      "Mixed beach and reef break setup offering fairly consistent waves. Best performance comes from west swell combined with easterly offshore winds. Multiple peak options available due to combined beach and reef configuration. Despite good rating, typically uncrowded.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK", // Listed as both beach and reef
    swellSize: {
      min: 1.6,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 20, // Based on current reading of 19.9°C
      winter: 14,
    },
    hazards: ["Rocks", "Rip currents", "Strong currents"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },
  {
    id: "bikini-beach",
    name: "Bikini Beach",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Gordon's Bay",
    distanceFromCT: 50, // Approximate distance in km
    optimalWindDirections: ["ESE"], // Wind coming FROM ESE (offshore)
    optimalSwellDirections: {
      min: 225, // SW
      max: 247.5, // Allowing some variation towards WSW
      cardinal: "SW",
    },
    bestSeasons: ["winter"], // SW swell typically more common in winter
    optimalTide: "ALL", // No specific tide information provided
    description:
      "Point break in Gordon's Bay that rarely breaks but can produce quality waves when conditions align. Best performance comes from SW swell with ESE offshore winds.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 2.8,
      max: 4.6,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 20, // Based on current reading of 19.9°C
      winter: 16,
    },
    hazards: ["Inconsistent waves", "Rocks"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },
  {
    id: "second-beach-port-st-johns",
    name: "Second Beach 💀", // Added skull emoji due to multiple fatal shark attacks
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "Port St Johns",
    distanceFromCT: 1200,
    optimalWindDirections: ["W", "SW"],
    optimalSwellDirections: {
      min: 135,
      max: 225,
    },
    bestSeasons: ["summer"],
    optimalTide: "MID",
    description:
      "Powerful beach break known for its consistent waves and unfortunately, frequent shark activity. Multiple peaks along the beach with both lefts and rights. Best on SW swell with light offshore winds.",
    difficulty: "ADVANCED",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.6,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 22,
      winter: 18,
    },
    hazards: ["Sharks", "Strong currents", "Rip currents"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: true,
      incidents: [
        {
          date: "2012-01-15",
          outcome: "Fatal",
          details: "Lungisani Msungubana (25) attacked in waist-deep water",
        },
        {
          date: "2011-01-15",
          outcome: "Fatal",
          details: "Zama Ndamase (16) fatal attack while surfing",
        },
        {
          date: "2009-12-18",
          outcome: "Fatal",
          details: "Tshintshekile Nduva (22) attacked while paddle boarding",
        },
        {
          date: "2009-01-24",
          outcome: "Fatal",
          details: "Sikhanyiso Bangilizwe (27) fatal attack while swimming",
        },
        {
          date: "2007-01-14",
          outcome: "Fatal",
          details: "Sibulele Masiza (24) disappeared while bodyboarding",
        },
      ],
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },
  {
    id: "black-rocks",
    name: "Black Rocks",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Cape Peninsula",
    distanceFromCT: 40,
    optimalWindDirections: ["W"], // Changed from NE to W based on new info
    optimalSwellDirections: {
      min: 135, // SE
      max: 157.5, // SSE
      cardinal: "SE", // Changed from S-SW to SE based on new info
    },
    bestSeasons: ["winter"],
    optimalTide: "MID_TO_HIGH",
    description:
      "Fairly exposed reef break rated 2/5 with inconsistent waves. Works best with Southeast groundswells meeting westerly offshore winds. Offers both right (preferred) and left reef breaks. Despite unreliable conditions, spot can get crowded when working. Winter brings optimal conditions. Watch for sharks and navigate carefully around rocks.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 2.0,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 21, // Based on current reading of 18.9°C
      winter: 16,
    },
    hazards: [
      "Rocks",
      "Heavy waves",
      "Shallow reef",
      "Strong localism",
      "Sharks", // Added sharks as hazard
    ],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1012,
      lng: 18.4987,
    },
  },
  {
    id: "sunset-reef",
    name: "Sunset Reef 💀", // Added skull emoji due to big wave conditions and shark presence
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Kommetjie",
    distanceFromCT: 40,
    optimalWindDirections: ["SE", "SSE"],
    optimalSwellDirections: {
      min: 220.5,
      max: 247.5,
    },
    bestSeasons: ["winter"],
    optimalTide: "HIGH",
    description:
      "Legendary big wave reef break located off Long Beach. Starts working at 12ft and holds up to 40ft faces. Three distinct sections: 'The Peak' (main outside bowl), 'The Wall' (middle section), and 'The Inside' (end section). Requires solid SW-WSW groundswell with 15+ second period and light SE winds under 12 knots. Deep water channel on south side aids boat access, but paddle-outs extremely challenging (45+ minutes) and recommended only for elite surfers. Wave faces pitch steeply over reef creating critical takeoff zone - precise positioning essential. Multiple boils indicate shallow sections. Strong currents can push surfers far outside lineup - boat support strongly recommended. Best during winter months (June-August) when large groundswells coincide with favorable winds. Heavy localism - respect established hierarchy. Only attempt with proper big wave equipment, safety team, and significant experience. Known great white shark territory - multiple encounters reported.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 3.5,
      max: 6,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 16,
      winter: 12,
    },
    hazards: ["Rocks", "Strong currents", "Big waves"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=9ITLxvOHLaE&ab_channel=TonyLindeque%28LearntoDiveToday%29",
        title: "Swell at Sunset Reef, Kommetjie",
        platform: "youtube",
      },
    ],
  },
  {
    id: "gabathan",
    name: "Gabathan",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Muizenberg",
    distanceFromCT: 26,
    optimalWindDirections: ["NW", "N", "NE", "WNW"], // Removed WNW as it's more cross-shore
    optimalSwellDirections: {
      min: 112.5, // ESE
      max: 157.5, // SSE
      cardinal: "SE", // Keeping the cardinal direction as SE
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Second circle toward Baden Powell Drive from Muizenberg beach, opposite the bottle store. Consistent beach break offering both lefts and rights. Similar wave mechanics to main Muizenberg but typically less crowded. Wave quality varies with sand bank conditions. Best early morning before wind picks up. Popular with locals who want to avoid main beach crowds.",
    difficulty: "BEGINNER",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.8,
      max: 4.6,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 20,
      winter: 15,
    },
    hazards: ["Potential theft", "Sharks"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234,
      lng: 18.4567,
    },
  },

  {
    id: "herolds-bay",
    name: "Herolds Bay",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Garden Route",
    distanceFromCT: 430, // Approximate distance
    optimalWindDirections: ["NNW", "N"], // North-northwest as specified
    optimalSwellDirections: {
      min: 112.5, // ESE is approximately 112.5°
      max: 135, // SE is 135°
      cardinal: "ESE",
    },
    bestSeasons: ["winter"], // Typical for Western Cape
    optimalTide: "MID", // Using mid tide as default since not specified
    description:
      "Protected bay break that works best with East-southeast swell and North-northwest winds. Offers both lefts and rights depending on swell direction and sand banks.",
    difficulty: "All Levels",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 2,
      max: 4.2,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 21, // Typical for this region
      winter: 17,
    },
    hazards: ["Rocks", "Rip currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234, // Please update with actual coordinates
      lng: 18.4567,
    },
  },
  {
    id: "reunion",
    name: "Reunion",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "KwaZulu-Natal",
    location: "Durban South",
    distanceFromCT: 1600,
    optimalWindDirections: ["NE"],
    optimalSwellDirections: {
      min: 180, // S
      max: 202.5, // SSW
      cardinal: "S",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Consistent beach break located along Durban's Golden Mile. Multiple peaks offering both lefts and rights. Protected by shark nets and regular lifeguard patrols. Best performance on southerly swells with offshore NE winds. Wave quality ranges from punchy closeouts to longer workable walls depending on sandbank configuration. Works year-round but winter brings cleaner conditions. Popular spot that can get crowded during peak times. Good facilities including parking, showers, and restaurants nearby. Reunion Beach is located south of Durban, near Isipingo in KwaZulu-Natal, South Africa. It is further down the coast and is known for its less crowded and tranquil environment. It's a favorite among locals for fishing and relaxing away from the hustle of Durban's central beaches.",
    difficulty: "All Levels",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.6,
      max: 5.5,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 24,
      winter: 20,
    },
    hazards: ["Crowds", "Rip currents", "Strong currents"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false, // Protected by shark nets
    },
    image: "",
    coordinates: {
      lat: -29.8584,
      lng: 31.0384,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=sDGlPLtHhk0",
        title:
          "Finding waves in KwaZulu-Natal, South Africa. Billabong team riders Emma Smith, Zoe Steyn, Crystal Hulett and Tanika Hoffman show us life on their side of the pond in South Africa. ",
        platform: "youtube",
      },
    ],
  },
  {
    id: "north-beach",
    name: "North Beach",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "KwaZulu-Natal",
    location: "Durban South",
    distanceFromCT: 1600,
    optimalWindDirections: ["W"], // Changed from NE to W based on new info
    optimalSwellDirections: {
      min: 112.5, // SE is approximately 112.5°
      max: 135, // SE is 135°
      cardinal: "SE", // Changed from S to SE based on new info
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "North Beach in Durban is an exposed beach and pier break known for its reliable surf conditions. The ideal wind direction is from the west, with swells coming equally from windswells and groundswells. The optimal swell direction is from the southeast. The beach features right-hand breaks, and when the waves are good, the area can become crowded with surfers. Be cautious of potential hazards such as sharks, rocks, and jellyfish. Additionally, North Beach is a popular spot for both locals and tourists, offering a vibrant atmosphere with nearby amenities such as restaurants, shops, and lifeguard services. It's a great destination for surfers of varying skill levels, though beginners should be mindful of the crowd and potential hazards. The beach is also well-maintained, making it a pleasant place to relax when you're not in the water. Always check local surf reports and conditions before heading out, and respect the lineup etiquette to ensure a safe and enjoyable experience for everyone.",
    difficulty: "All Levels",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.6,
      max: 5.5,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 26, // Updated based on current reading of 26.2°C
      winter: 20,
    },
    hazards: ["Rocks", "Sharks", "Strong currents"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -29.8584,
      lng: 31.0384,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=aI-hU1md3vk&ab_channel=ESCAPESCOUT",
        title: "Surfing Durban's North Coast",
        platform: "youtube",
      },
    ],
  },
  {
    id: "ansteys",
    name: "Ansteys",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "KwaZulu-Natal",
    location: "Durban",
    distanceFromCT: 1600,
    optimalWindDirections: ["NW"],
    optimalSwellDirections: {
      min: 90, // E
      max: 112.5, // ESE
      cardinal: "E",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Beach break with a rating of 4/5, known for its inconsistent but quality waves when conditions align. Requires specific east swell direction with northwest winds to work properly. Part of Durban's beach break system, protected by shark nets and regular lifeguard patrols. Wave quality can vary significantly depending on swell direction and sandbank configuration. Despite inconsistency, can produce excellent waves during ideal conditions. Good facilities including parking, showers, and restaurants nearby.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.6,
      max: 5.5,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 24,
      winter: 20,
    },
    hazards: ["Crowds", "Rip currents", "Strong currents"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false, // Protected by shark nets
    },
    image: "",
    coordinates: {
      lat: -29.8622,
      lng: 31.0389,
    },
  },
  {
    id: "baggies",
    name: "Baggies",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "KwaZulu-Natal",
    location: "Umkomaas",
    distanceFromCT: 1650,
    optimalWindDirections: ["NW"],
    optimalSwellDirections: {
      min: 135, // SE
      max: 157.5, // SSE
      cardinal: "SE",
    },
    bestSeasons: ["winter"],
    optimalTide: "MID",
    description:
      "Fairly consistent point break rated 3/5, located south of Durban. Right-hand wave that works best with southeast swell and northwest winds. Protected by shark nets. Wave offers multiple sections with both hollow and wall sections depending on size and direction. While not as famous as some nearby breaks, provides reliable waves when conditions align. Popular with locals and can get crowded on good days. Access via stairs from parking area. Watch for strong currents around point.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.6,
      max: 5.5,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 24,
      winter: 20,
    },
    hazards: ["Rocks", "Strong currents", "Crowds"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false, // Protected by shark nets
    },
    image: "",
    coordinates: {
      lat: -30.2066,
      lng: 30.8026,
    },
  },
  {
    id: "salt-rock",
    name: "Salt Rock",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "KwaZulu-Natal",
    location: "Salt Rock",
    distanceFromCT: 1700,
    optimalWindDirections: ["NW"],
    optimalSwellDirections: {
      min: 180, // S
      max: 202.5, // SSW
      cardinal: "S",
    },
    bestSeasons: ["winter"],
    optimalTide: "MID",
    description:
      "Reef break rated 2/5, offering fairly consistent waves north of Durban. Works best with south swell and northwest winds. Despite lower rating, provides reliable options when conditions align. Wave breaks over shallow reef creating both lefts and rights. Protected by shark nets. Popular with local surfers and can get crowded on weekends. Good facilities including parking, showers, and nearby restaurants. Watch for exposed reef at low tide.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.6,
      max: 5.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 25,
      winter: 21,
    },
    hazards: ["Shallow reef", "Rocks", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false, // Protected by shark nets
    },
    image: "",
    coordinates: {
      lat: -29.4974,
      lng: 31.2337,
    },
  },
  {
    id: "scottburgh-point",
    name: "Scottburgh Point",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "KwaZulu-Natal",
    location: "Scottburgh",
    distanceFromCT: 1630,
    optimalWindDirections: ["WSW"],
    optimalSwellDirections: {
      min: 180, // S
      max: 202.5, // SSW
      cardinal: "S",
    },
    bestSeasons: ["winter"],
    optimalTide: "MID",
    description:
      "Fairly consistent point break rated 3/5, located south of Durban. Right-hand wave that works best with south swell and west-southwest winds. Protected by shark nets. Wave offers multiple sections that can link up on good days, providing long rides. Popular spot that can handle size while remaining relatively manageable. Gets crowded on weekends and during good conditions. Good facilities including parking, lifeguards, and nearby amenities. Watch for strong currents around the point and rocks at low tide.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 0.6,
      max: 5.5,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 24,
      winter: 20,
    },
    hazards: ["Rocks", "Strong currents", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false, // Protected by shark nets
    },
    image: "",
    coordinates: {
      lat: -30.2853,
      lng: 30.7544,
    },
  },
  {
    id: "skeleton-bay",
    name: "Skeleton Bay",
    continent: "Africa",
    countryId: "Namibia", // Changed from South Africa to Namibia
    regionId: "Swakopmund",
    location: "Skeleton Coast",
    distanceFromCT: 1800,
    optimalWindDirections: ["NE", "ENE", "E"],
    optimalSwellDirections: {
      min: 205.5, // SSW
      max: 232.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW_TO_MID",
    description:
      "World-renowned left-hand point break producing incredibly long barrels. One of the longest waves in the world, offering rides up to 2km long. Extremely challenging wave that breaks over a sand bottom. Works best with large SW swells and offshore NE winds. Very consistent during winter months but highly sensitive to conditions. Remote location requires careful planning.",
    difficulty: "EXPERT",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 2.5,
      max: 5.5,
    },
    idealSwellPeriod: {
      min: 15,
      max: 20,
    },
    waterTemp: {
      summer: 16,
      winter: 14,
    },
    hazards: [
      "Remote location",
      "Strong currents",
      "Long paddle back",
      "Desert environment",
      "No easy access to hospitals or surf rescue",
      "Strong currents & heavy paddle back",
      "Extremely fast and powerful",
    ],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "/images/beaches/td-skeleton.jpg",
    coordinates: {
      lat: -22.6847,
      lng: 14.5267,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=5QVedTOKVyE&pp=ygUbbmFtaWJpYSBza2VsZXRvbiBjb2FzdCBzdXJm",
        title: "Mirage: The ever-changing story of Skeleton Bay",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=nokOsu_jaf4&pp=ygUbbmFtaWJpYSBza2VsZXRvbiBjb2FzdCBzdXJm",
        title: "Surfing Skeleton Bay, Namibia",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=g_iS1VM8dFc&pp=ygUbbmFtaWJpYSBza2VsZXRvbiBjb2FzdCBzdXJm",
        title: "Koa Smith Skeleton Bay 2018: POV GoPro angle",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=A9_ylHhkzdw&pp=ygUZbWF0dCBicm9tbGV5IHNrZWxldG9uIGJheQ%3D%3D",
        title: "Kite Surfer tows Matt Bromley into Donkey Bay Namibia",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=F7JuK1d5Zvg&ab_channel=BillabongSouthAfrica",
        title: "The Donkey | Unleashed",
        platform: "youtube",
      },
    ],
  },

  {
    id: "off-the-wall",
    name: "Off The Wall",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Sea Point",
    distanceFromCT: 5,
    optimalWindDirections: ["SE", "ESE"],
    optimalSwellDirections: {
      min: 245, // SW
      max: 270, // W
      cardinal: "SW",
    },
    bestSeasons: ["winter"],
    optimalTide: "MID_TO_HIGH",
    description:
      "Powerful reef break located along Sea Point's promenade. Wave quality highly dependent on swell size and direction - needs significant swell to break properly. Best performance comes from SW groundswell combined with SE winds. Creates intense peaks and occasional barrels during bigger swells. Popular spot for experienced surfers during winter storms. Watch for exposed rocks and strong currents. Easy access from promenade but challenging paddle-out.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 2.1,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Rocks", "Strong currents", "Shallow reef"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -33.9144,
      lng: 18.3879,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=7wTdB-5o1F4&pp=ygUjc2VhIHBvaW50IHN1cmZpbmcgaGFyYm9yIHdlZGdlIHRhdW4%3D",
        title: "ALL IS SWELL - Harbour Wedge & Sea Point Surfing | Cape Town",
        platform: "youtube",
      },
    ],
  },
  {
    id: "guns",
    name: "Guns",
    continent: "Africa",
    countryId: "Namibia", // Changed from South Africa to Namibia
    regionId: "Swakopmund",
    location: "Skeleton Coast",
    distanceFromCT: 1800,
    optimalWindDirections: ["ENE", "E", "NE"],
    optimalSwellDirections: {
      min: 247.5, // WSW
      max: 270, // W
      cardinal: "WSW",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Powerful point break located along Namibia's remote Skeleton Coast. Offers long, hollow right-handers that can reach exceptional sizes. Best performance comes from WSW groundswells with ENE winds. Wave provides multiple barrel sections over a 300m+ ride. Extremely isolated location requires careful planning and permits. Handles large swells while maintaining shape. Strong currents demand excellent fitness. Early morning sessions typically offer cleanest conditions. Watch for strong rip currents and shifting sandbanks. Remote location means bringing all supplies essential. Winter brings most consistent conditions with powerful groundswells.",
    difficulty: "ADVANCED",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 2.2,
      max: 8.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 20,
    },
    waterTemp: {
      summer: 17,
      winter: 14,
    },
    hazards: [
      "Remote location",
      "Strong currents",
      "Rocks",
      "No facilities",
      "Desert environment",
    ],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -22.6792,
      lng: 14.5272,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=2qVJuzh1TQU&ab_channel=ShannonVolschenk",
        title: "29 - 01 - 2016 Surfing Guns, Namibia *dolphins included!",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=ika_dV3KUT8&ab_channel=DamienLackey",
        title: "namibia surfing 2014 guns",
        platform: "youtube",
      },
    ],
  },
  {
    id: "anchor-point",
    name: "Anchor Point",
    continent: "Africa",
    countryId: "Morocco",
    regionId: "Morocco",
    location: "Taghazout",
    distanceFromCT: 7500, // Approximate distance from Cape Town in km
    optimalWindDirections: ["NE"],
    optimalSwellDirections: {
      min: 292.5, // NW
      max: 315, // NNW
      cardinal: "NW",
    },
    bestSeasons: ["winter"], // October to March
    optimalTide: "MID_TO_HIGH",
    description:
      "World-class right-hand point break producing long, perfect waves. Multiple sections offering steep drops, barrels, and walls over 500m rides. Best performance on NW groundswell with NE winds. Handles all sizes while maintaining shape. Very consistent during winter months. Rock bottom creates perfect shape but demands respect. Popular international destination - expect crowds during peak season.",
    difficulty: "ADVANCED",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.0,
      max: 5.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 20,
    },
    waterTemp: {
      summer: 21,
      winter: 18,
    },
    hazards: ["Rocks", "Strong currents", "Crowds", "Urchins"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 30.5453,
      lng: -9.7097,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=Pq7jVrmRLWI&ab_channel=SurfRawFiles",
        title:
          "Anchor Point - Morocco - RAWFILES - Anchor Point is located in Central Morocco, the north side of the small surf town, Taghazout. Its probably the best wave in Morocco and one of the best in Africa!",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=CucTAx7eRro&ab_channel=TheAdventureLocker",
        title: "Surfing in Africa 🏄🗺️ #surf #surffilm",
        platform: "youtube",
      },
    ],
  },
  {
    id: "koeel-bay",
    name: "Koeel Bay",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Boland",
    distanceFromCT: 45, // Approximate distance
    optimalWindDirections: ["NE", "E"],
    optimalSwellDirections: {
      min: 180, // S
      max: 240, // S
      cardinal: "S",
    },
    bestSeasons: ["winter"], // Added based on typical Western Cape patterns
    optimalTide: "ALL",
    description:
      "Quite exposed beach break offering fairly consistent waves. Works best with South swell and ESE winds. Multiple peaks provide both lefts and rights. Wave quality highly dependent on swell direction and sand bank conditions. Can get crowded when working. Watch for strong rips.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 2.0,
      max: 5.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 21, // Based on current reading of 21.3°C
      winter: 17,
    },
    hazards: ["Rip currents", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234, // Please update with actual coordinates
      lng: 18.4567,
    },
  },
  {
    id: "jongensfontein",
    name: "Jongensfontein",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Overberg",
    distanceFromCT: 330, // Approximate distance
    optimalWindDirections: ["NW"],
    optimalSwellDirections: {
      min: 170, // S
      max: 190, // S
      cardinal: "S",
    },
    bestSeasons: ["winter"], // Typical for Western Cape reef breaks
    optimalTide: "ALL",
    description:
      "Consistent reef break rated 4/5 stars. Works best with South swell and Northwest offshore winds. Multiple sections offering quality waves when conditions align. Protected location helps maintain wave quality across various conditions.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 0.6,
      max: 5.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 23, // Based on current reading of 22.9°C
      winter: 17,
    },
    hazards: ["Rocks", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234, // Please update with actual coordinates
      lng: 18.4567,
    },
  },
  {
    id: "dolphin-point",
    name: "Dolphin Point",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Overberg",
    distanceFromCT: 330, // Approximate distance, similar to nearby Jongensfontein
    optimalWindDirections: ["W"],
    optimalSwellDirections: {
      min: 170, // S
      max: 190, // S
      cardinal: "S",
    },
    bestSeasons: ["winter"], // Typical for Western Cape point breaks
    optimalTide: "ALL",
    description:
      "Consistent point break rated 4/5 stars. Works best with South swell and West offshore winds. Protected location helps maintain quality waves across various conditions. Multiple sections offering different wave characteristics depending on swell size and direction.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.6,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 23, // Based on current reading of 22.9°C
      winter: 17,
    },
    hazards: ["Rocks", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234, // Please update with actual coordinates
      lng: 18.4567,
    },
  },
  {
    id: "kanon",
    name: "Kanon",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Mossel Bay",
    distanceFromCT: 450, // Approximate distance based on region
    optimalWindDirections: ["WNW"],
    optimalSwellDirections: {
      min: 135, // SE
      max: 157.5, // SSE
      cardinal: "SE",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL", // "Surfable at all stages of the tide"
    description:
      "Sheltered reef break that rarely breaks but offers excellent quality waves when conditions align. Works best with Southeast groundswell and WNW offshore winds. Provides both left and right options over reef bottom. Despite high quality potential (5/5 rating), wave's rarity keeps crowds minimal. Location known for significant shark presence.",
    difficulty: "ADVANCED", // Given shark hazards and reef break nature
    waveType: "REEF_BREAK",
    swellSize: {
      min: 2.2, // Higher minimum due to "rarely breaks"
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 23, // Based on current reading of 23.1°C
      winter: 17,
    },
    hazards: ["Sharks", "Reef", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false, // While sharks are a major hazard, no specific attacks mentioned
    },
    image: "",
    coordinates: {
      lat: -34.1234, // Please update with actual coordinates
      lng: 18.4567,
    },
  },
  {
    id: "outer-pool",
    name: "Outer Pool",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Mossel Bay",
    distanceFromCT: 450, // Approximate distance
    optimalWindDirections: ["W"],
    optimalSwellDirections: {
      min: 157.5, // SSE
      max: 167.5, // SSE
      cardinal: "SSE",
    },
    bestSeasons: ["winter", "autumn", "spring"], // "Summer tends to be mostly flat"
    optimalTide: "LOW_TO_MID", // "Best around low tide when the tide is rising"
    description:
      "Fairly exposed reef and point break combination offering reliable right-hand waves. Works best with SSE groundswell and westerly offshore winds. Despite consistent conditions, spot remains relatively uncrowded. Multiple sections available due to mixed reef and point setup. Summer months typically too small to surf. Careful navigation required due to urchins and rocks.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK", // Listed as both reef and point, but primary characteristic seems to be reef
    swellSize: {
      min: 1.9,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 23, // Based on current reading of 23.2°C
      winter: 17,
    },
    hazards: ["Rocks", "Urchins", "Rip currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234, // Please update with actual coordinates
      lng: 18.4567,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=WnYnXiONb_U&ab_channel=StokedTheBrand",
        title: "Stoked Sessions • Surfing Mossel Bay - Stoked X Kane Johnstone",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=D3BJLfvuf3g&pp=ygUPbW9zc2VsIGJheSBzdXJm",
        title: "RAW: Mossel Bay, 5 July 2021 (Featuring Adin Masencamp)",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=vqSUqsLv1HA&ab_channel=SandyMarwick",
        title: "Surfing at Outer Pool, Mossel Bay",
        platform: "youtube",
      },
    ],
  },
  {
    id: "ding-dangs",
    name: "Ding Dangs",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Garden Route",
    distanceFromCT: 450, // Approximate distance based on Mossel Bay location
    optimalWindDirections: ["SW"],
    optimalSwellDirections: {
      min: 135, // SE
      max: 157.5, // SSE
      cardinal: "SE",
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW", // "Best around low tide"
    description:
      "Sheltered reef break offering fairly consistent waves with both left and right options. Works best with Southeast groundswell and Southwest offshore winds. Protected location helps maintain clean conditions. Despite good quality (4/5 rating), spot remains uncrowded. Careful navigation required due to urchins and rocks.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 2.1,
      max: 7.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 23, // Based on current reading of 23.1°C
      winter: 17,
    },
    hazards: ["Rocks", "Urchins", "Rip currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234, // Please update with actual coordinates
      lng: 18.4567,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=WnYnXiONb_U&ab_channel=StokedTheBrand",
        title: "Stoked Sessions • Surfing Mossel Bay - Stoked X Kane Johnstone",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=D3BJLfvuf3g&pp=ygUPbW9zc2VsIGJheSBzdXJm",
        title: "RAW: Mossel Bay, 5 July 2021 (Featuring Adin Masencamp)",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=vqSUqsLv1HA&ab_channel=SandyMarwick",
        title: "Surfing at Outer Pool, Mossel Bay",
        platform: "youtube",
      },
    ],
  },
  {
    id: "victoria-bay",
    name: "Victoria Bay",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Garden Route",
    distanceFromCT: 450, // Approximate distance
    optimalWindDirections: ["NNW"],
    optimalSwellDirections: {
      min: 170, // S
      max: 190, // S
      cardinal: "S",
    },
    bestSeasons: ["winter", "summer"], // Very consistent year-round
    optimalTide: "ALL",
    description:
      "Very consistent reef and point break combination rated 3/5. Works best with South swell and North-northwest offshore winds. Protected location helps maintain quality waves across various conditions. Multiple sections offering different wave characteristics. Popular spot that can get crowded during peak season.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 2.1,
      max: 7.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 23, // Based on current reading of 23.3°C
      winter: 17,
    },
    hazards: ["Rocks", "Strong currents", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234, // Please update with actual coordinates
      lng: 18.4567,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=mW4g6PQ9LcY&ab_channel=daboys",
        title: "Massive waves at Victoria Bay: 4 brothers explore Grom comp!!",
        platform: "youtube",
      },
    ],
  },
  {
    id: "ferme-aux-cochons",
    name: "Ferme aux Cochons 🦛",
    continent: "Africa",
    countryId: "Gabon",
    regionId: "Gabon Coast",
    location: "Gabon Coast",
    distanceFromCT: 3500, // Approximate distance from Cape Town
    optimalWindDirections: ["ENE"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL", // "Good surf at all stages of the tide"
    description:
      "Exposed beach break rated 5/5 for wave quality but known for inconsistent conditions. Works best with Southwest groundswell and East-northeast offshore winds. Beach offers both left and right options. Despite excellent wave quality when working, spot remains uncrowded. Poor performance in light onshore conditions. Remote location and shark presence require careful consideration.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.6,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 29, // Based on current reading of 28.6°C
      winter: 25,
    },
    hazards: ["Sharks", "Remote location", "Inconsistent waves"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false, // While sharks are present, no specific attacks mentioned
    },
    image: "",
    coordinates: {
      lat: 0.0, // Please update with actual coordinates
      lng: 0.0,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=mH9JoE0IrR4&ab_channel=ErwanSimon",
        title: "Gabon - Surfing Hippos",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=nQJkdq5gF80&ab_channel=SamBleakley",
        title: "Sam Bleakley surfEXPLORE© Gabon",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=fUpxoItNkZE&ab_channel=Lostintheswell",
        title: "Lost in the swell - Season 3.2 - Episode 0 - Paradise Lost",
        platform: "youtube",
      },
    ],
  },
  {
    id: "petit-loango",
    name: "Petit Loango 🦛",
    continent: "Africa",
    countryId: "Gabon",
    regionId: "Gabon Coast",
    location: "Gabon Coast",
    distanceFromCT: 3500, // Approximate distance from Cape Town
    optimalWindDirections: ["ENE"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Exposed beach break rated 5/5 for wave quality but highly inconsistent. Works best with Southwest groundswell and East-northeast offshore winds. Beach offers both left and right options. Despite excellent wave quality when working, spot remains uncrowded due to remote location and wildlife hazards. Unique hazard of hippos in addition to sharks requires extreme caution. Receives primarily distant groundswells. Hippos: https://www.youtube.com/watch?v=mnHG290CS70&ab_channel=GabonUntouched",
    difficulty: "ADVANCED", // Due to wildlife hazards and remote location
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.2,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 28, // Based on current reading of 28.4°C
      winter: 25,
    },
    hazards: ["Sharks", "Hippos", "Remote location", "Inconsistent waves"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false, // While sharks are present, no specific attacks mentioned
    },
    image: "",
    coordinates: {
      lat: 0.0, // Please update with actual coordinates
      lng: 0.0,
    },
  },
  {
    id: "mussels",
    name: "Mussels",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Mossel Bay",
    distanceFromCT: 1800, // Approximate distance from Cape Town
    optimalWindDirections: ["ENE"],
    optimalSwellDirections: {
      min: 247.5, // WSW
      max: 270, // W
      cardinal: "WSW",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL", // No specific tide information provided
    description:
      "Exposed reef break that works inconsistently but offers quality waves (4/5) when conditions align. Best performance comes from WSW groundswell with ENE offshore winds. Reef provides both left and right options. Despite good rating, rarely crowded due to remote location. Watch for local wildlife including seals. Groundswells more common than windswells.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 19, // Based on current reading of 17.3°C, allowing for seasonal variation
      winter: 15,
    },
    hazards: ["Rocks", "Sharks", "Seals", "Inconsistent waves"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -22.6792, // Approximate for Swakopmund
      lng: 14.5272,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=q8q_A6r4dh0&ab_channel=SamBleakley",
        title: "surfEXPLORE© Gabon - Sam Bleakley",
        platform: "youtube",
      },
    ],
  },
  {
    id: "farmer-burgers",
    name: "Farmer Burgers",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "West Coast",
    distanceFromCT: 200, // Approximate distance, please adjust if needed
    optimalWindDirections: ["E", "ENE"],
    optimalSwellDirections: {
      min: 225,
      max: 270,
    },
    bestSeasons: ["spring", "summer"], // Notably different from most spots which favor winter
    optimalTide: "ALL", // No specific tide mentioned
    description:
      "Exposed reef break offering fairly consistent right-hand waves rated 4/5. Works best with WSW groundswell and ENE offshore winds. Clean groundswells are typical here. Despite being a quality wave, the spot can get crowded during optimal conditions. Careful navigation of rocks required.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 5.5,
    },

    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 16, // Based on current reading of 13.9°C
      winter: 12,
    },
    hazards: ["Rocks", "Strong currents", "Remote location"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234, // Please update with actual coordinates
      lng: 18.4567,
    },
  },
  {
    id: "tofinho",
    name: "Tofinho",
    continent: "Africa",
    countryId: "Mozambique",
    regionId: "Inhambane Province",
    location: "Tofo Beach",
    distanceFromCT: 2800, // Approximate distance from Cape Town
    optimalWindDirections: ["SSW"],
    optimalSwellDirections: {
      min: 112.5, // SE
      max: 157.5, // SSE
      cardinal: "SE",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Fairly exposed reef and point break combination rated 4/5 with reliable conditions. Works best with Southeast swell and South-southwest offshore winds. Offers predominantly right-hand waves over reef. Despite quality waves, rarely gets crowded. Location provides consistent waves but requires careful navigation of reef sections. Watch out for sharks and rocks.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 29, // Based on current reading
      winter: 24,
    },
    hazards: ["Sharks", "Rocks", "Strong currents", "Remote location"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -23.8516,
      lng: 35.5472,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=f93I2SR9YVI&ab_channel=TheSardineNewsbySeanLange",
        title: "013 Tofinho Diaries 2",
        platform: "youtube",
      },
    ],
  },
  {
    id: "shipwreck-liberia",
    name: "Shipwreck",
    continent: "Africa",
    countryId: "Liberia",
    regionId: "Liberia",
    location: "Robertsport", // Generic location since specific area wasn't provided
    distanceFromCT: 5500, // Approximate distance from Cape Town
    optimalWindDirections: ["NE"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["summer", "winter"], // Works all year round
    optimalTide: "HIGH", // "Best around high tide when the tide is falling"
    description:
      "Very consistent exposed reef break rated 3/5. Works best with Southwest groundswell and Northeast offshore winds. Wave quality remains reliable throughout the year. Remote location ensures uncrowded conditions. Best surfed on falling high tide. Careful navigation required due to rocks and strong rips.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 29, // Based on current reading of 29.0°C
      winter: 26,
    },
    hazards: [
      "Rocks",
      "Rip currents",
      "Remote location",
      "Poor infrastructure",
    ],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 0.0, // Please update with actual coordinates
      lng: 0.0,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=_dyrA2KZu5g&ab_channel=RamiRamitto",
        title: "RobertsPort Shipwreck",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=jUoNQ_KsAd0&ab_channel=ShannonAinslie",
        title:
          "African Surf Adventure | West Africa Surfing | Post War Surf Trip",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=IATNNE_SH48&ab_channel=AFPNewsAgency",
        title: "Tide turns for Liberia's secret surf spot",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=2HtCZNPwYjg&ab_channel=Rusty%27sOn",
        title: "Liberia's Robertsport Surf Club - October 2022",
        platform: "youtube",
      },
    ],
  },

  {
    id: "plage-du-dahu",
    name: "Plage du Dahu",
    continent: "Africa",
    countryId: "Gabon", // Based on location and characteristics similar to other Gabon spots
    regionId: "Gabon Coast",
    location: "Gabon Coast",
    distanceFromCT: 3500, // Approximate distance from Cape Town
    optimalWindDirections: ["ENE"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL", // "Good surf at all stages of the tide"
    description:
      "Exposed beach break rated 5/5 for wave quality but works only occasionally. Best performance comes from Southwest groundswell with ENE offshore winds. Beach offers both left and right options. Clean groundswells are typical. Despite excellent wave quality when working, spot remains uncrowded due to remote location. Watch for shark activity.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.2,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 29, // Based on current reading of 28.5°C
      winter: 25,
    },
    hazards: ["Sharks", "Remote location", "Inconsistent waves"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false, // While sharks are present, no specific attacks mentioned
    },
    image: "",
    coordinates: {
      lat: 0.0, // Please update with actual coordinates
      lng: 0.0,
    },
  },
  {
    id: "ambriz-point",
    name: "Ambriz Point",
    continent: "Africa",
    countryId: "Angola",
    regionId: "Luanda Province",
    location: "Ambriz",
    distanceFromCT: 3200, // Approximate distance from Cape Town
    optimalWindDirections: ["NE"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL", // No specific tide information provided
    description:
      "Fairly consistent and quite exposed point break rated 4/5. Works best with Southwest swell (both wind and groundswells) and Northeast offshore winds. No shelter from cross-shore breezes. Remote location ensures uncrowded conditions. Note that despite the name, there is no actual point break formation - wave breaks over rocks.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.2,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 28, // Based on current reading of 28.0°C
      winter: 24,
    },
    hazards: ["Rocks", "Remote location", "Cross-shore winds"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 0.0, // Please update with actual coordinates
      lng: 0.0,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=uvygYXDiCvw&ab_channel=DavidClancy",
        title: "ANGOLA WAVES - Professional Surfer: Tomas Valente",
        platform: "youtube",
      },
    ],
  },
  {
    id: "cabo-ledo",
    name: "Cabo Ledo",
    continent: "Africa",
    countryId: "Angola",
    regionId: "Luanda Province",
    location: "Cabo Ledo",
    distanceFromCT: 3000, // Approximate distance from Cape Town
    optimalWindDirections: ["NE"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL", // "The quality of the surf isn't affected by the tide"
    description:
      "Very consistent exposed point break rated 4/5. Works best with Southwest groundswell and Northeast offshore winds. Offers quality left-hand waves. Despite reliable conditions, spot remains relatively uncrowded due to remote location. Wave quality maintains consistency across all tide levels.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.2,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 27, // Based on current reading of 26.3°C
      winter: 23,
    },
    hazards: ["Rip currents", "Remote location"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "/images/beaches/td-cabo-ledo.webp",

    coordinates: {
      lat: 0.0, // Please update with actual coordinates
      lng: 0.0,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=pRju2Vkss-o&ab_channel=TAAGAngolaAirlines",
        title: "Surf Angola - Cabo Ledo",
        platform: "youtube",
      },
    ],
  },
  {
    id: "praia-do-buraco",
    name: "Praia do Buraco",
    continent: "Africa",
    countryId: "Angola",
    regionId: "Luanda Province",
    location: "Ramiros",
    distanceFromCT: 3200, // Approximate distance from Cape Town
    optimalWindDirections: ["SSE"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL", // No specific tide information provided
    description:
      "Quite exposed point break rated 3/5 that rarely breaks. Works best with Southwest swell (mix of ground and windswells) and South-southeast offshore winds. Offers left-hand waves when working. Despite inconsistent conditions, spot remains uncrowded. Shark presence reported in the area.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.2,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 28, // Based on current reading of 27.5°C
      winter: 24,
    },
    hazards: ["Sharks", "Remote location", "Inconsistent waves"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false, // While sharks are reported, no specific attacks mentioned
    },
    image: "",
    coordinates: {
      lat: 0.0, // Please update with actual coordinates
      lng: 0.0,
    },
  },
  {
    id: "bocock's-bay",
    name: "Bocock's Bay",
    continent: "Africa",
    countryId: "Namibia",
    regionId: "Swakopmund",
    location: "Mile 108",
    distanceFromCT: 1800, // Approximate distance from Cape Town
    optimalWindDirections: ["SSE"],
    optimalSwellDirections: {
      min: 247.5, // WSW
      max: 270, // W
      cardinal: "WSW",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL", // "Good surf at all stages of the tide"
    description:
      "Fairly consistent and exposed break rated 4/5. Works best with WSW groundswell and SSE offshore winds, with some protection from southerly winds. Despite being labeled as a point break, note that there is no actual point formation. Wave quality remains consistent across all tide levels. Remote location ensures uncrowded conditions.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK", // Keeping type as listed in spot info despite description contradiction
    swellSize: {
      min: 1.2,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 20, // Based on current reading of 18.0°C
      winter: 16,
    },
    hazards: ["Sharks", "Remote location"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false, // While sharks are present, no specific attacks mentioned
    },
    image: "",
    coordinates: {
      lat: -22.6792, // Approximate for Swakopmund
      lng: 14.5272,
    },
  },
  {
    id: "vredenberg-point",
    name: "Vredenberg Point",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "West Coast",
    distanceFromCT: 150, // Approximate distance from Cape Town
    optimalWindDirections: ["ENE"],
    optimalSwellDirections: {
      min: 225.5, // SW
      max: 255.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["summer"], // Notably different from most Western Cape spots
    optimalTide: "HIGH",
    description:
      "Fairly consistent exposed point break rated 4/5. Works best with Southwest groundswell and East-northeast offshore winds. Offers left-peeling waves off the point. Wave quality suffers in light onshore conditions. Clean groundswells are typical here. Can get crowded during optimal conditions. Best surfed around high tide.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.2,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 16, // Based on current reading of 14.5°C
      winter: 13,
    },
    hazards: ["Rocks", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -32.9046, // Please verify coordinates
      lng: 17.9891,
    },
  },
  {
    id: "jacobs-bay",
    name: "Jacobs Bay",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "West Coast",
    distanceFromCT: 140, // Approximate distance from Cape Town
    optimalWindDirections: ["E"],
    optimalSwellDirections: {
      min: 247.5, // WSW
      max: 270, // W
      cardinal: "WSW",
    },
    bestSeasons: ["summer", "winter"], // "can work at any time of the year"
    optimalTide: "ALL", // "The quality of the surf isn't affected by the tide"
    description:
      "Fairly consistent exposed beach break rated 4/5. Works best with WSW groundswell and easterly offshore winds, but can handle light onshore conditions. Offers both left and right-breaking waves. Wave quality maintains consistency across all tide levels. Can get crowded during good conditions. Known for strong, dangerous rip currents.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.2,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 18, // Based on current reading of 15.9°C
      winter: 14,
    },
    hazards: ["Rip currents", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -32.971, // Please verify coordinates
      lng: 17.8931,
    },
  },
  {
    id: "treskostraal",
    name: "Treskostraal",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "West Coast",
    distanceFromCT: 160, // Approximate distance from Cape Town
    optimalWindDirections: ["ESE"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["summer", "winter"], // "no particular seasonal pattern"
    optimalTide: "ALL", // No specific tide information provided
    description:
      "Exposed point break rated 4/5 but works inconsistently with no seasonal preference. Best performance comes from Southwest groundswell with ESE offshore winds, though can handle light onshore conditions. Groundswells more common than windswells. Remote location ensures uncrowded conditions. Rocky break requires careful navigation.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.2,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 16, // Based on current reading of 14.4°C
      winter: 13,
    },
    hazards: ["Rocks", "Inconsistent waves", "Remote location"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -32.9046, // Please verify coordinates
      lng: 17.9891,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=c0oormvmT-U&ab_channel=PsychedOut",
        title: "Surfing // West Coast South Africa",
        platform: "youtube",
      },
    ],
  },
  {
    id: "cape-st-martin",
    name: "Cape St Martin",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "West Coast",
    distanceFromCT: 180, // Approximate distance from Cape Town
    optimalWindDirections: ["SSE", "S"],
    optimalSwellDirections: {
      min: 240, // WSW
      max: 260, // W
      cardinal: "WSW",
    },
    bestSeasons: ["summer", "winter"], // "can work at any time of the year"
    optimalTide: "ALL", // No specific tide information provided
    description:
      "Consistent exposed reef break rated 4/5. Works best with WSW groundswell and SSE offshore winds, though remains surfable in onshore conditions. Offers left-breaking waves over reef. Clean groundswells are typical here. Despite reliable conditions, spot remains uncrowded. Kelp beds and rocky sections require careful navigation.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 16, // Based on current reading of 14.3°C
      winter: 13,
    },
    hazards: ["Rocks", "Kelp", "Remote location"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -32.7031, // Please verify coordinates
      lng: 17.9891,
    },
  },
  {
    id: "pastures",
    name: "Pastures",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "West Coast",
    distanceFromCT: 170, // Approximate distance from Cape Town
    optimalWindDirections: ["SE"],
    optimalSwellDirections: {
      min: 247.5, // WSW
      max: 270, // W
      cardinal: "WSW",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL", // "Surfable at all stages of the tide"
    description:
      "Reasonably exposed combination beach and reef break rated 4/5, though works inconsistently. Best performance in winter with WSW groundswell and SE offshore winds. Can handle onshore breezes. Despite being described as both beach and reef, offers primarily left-hand point waves. Can get crowded when working. Strong rip currents present significant hazard.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK", // Listed as both beach and reef, but description mentions point break
    swellSize: {
      min: 1.2,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 16, // Based on current reading of 14.2°C
      winter: 13,
    },
    hazards: ["Rip currents", "Rocks", "Inconsistent waves"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -32.8046, // Please verify coordinates
      lng: 17.9891,
    },
  },
  {
    id: "holbaai",
    name: "Holbaai",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Melkbosstrand",
    distanceFromCT: 35,
    optimalWindDirections: ["E"], // Changed to be more specific
    optimalSwellDirections: {
      min: 225,
      max: 250,
      cardinal: "SW", // Updated to match the reported optimal direction
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW",
    description:
      "Holbaai, located in the Western Cape, is an exposed beach break known for its consistent surf conditions. The best time for surfing is during the summer, when the conditions are optimal. The ideal wind direction comes from the east, while the best swell direction is from the southwest, often provided by distant groundswells.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.8,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Remote location", "Rip currents", "Strong currents", "Sharks"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1123,
      lng: 18.4876,
    },
  },
  {
    id: "beachroad",
    name: "Beach Road",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Melkbosstrand",
    distanceFromCT: 35,
    optimalWindDirections: ["SE"], // Changed to be more specific
    optimalSwellDirections: {
      min: 225,
      max: 250,
      cardinal: "SW", // Updated to match the reported optimal direction
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW",
    description:
      "Beach Road, located in the Western Cape, is an exposed point break known for its consistent surf conditions. The prime surfing season here is during winter, when the waves are at their best. The ideal wind direction comes from the southeast, while the most favorable swell direction is from the southwest, typically generated by distant groundswells.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.8,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Remote location", "Rip currents", "Strong currents", "Sharks"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1123,
      lng: 18.4876,
    },
  },
  {
    id: "vanriebeek",
    name: "Van Riebeek",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Van Riebeek",
    distanceFromCT: 40,
    optimalWindDirections: ["NE"],
    optimalSwellDirections: {
      min: 240,
      max: 255,
      cardinal: "WSW",
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW",
    description:
      "Van Riebeek offers variable conditions in June, with a mix of opportunities for surfers of different skill levels.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.6,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Strong currents", "Sharks"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1123,
      lng: 18.4876,
    },
  },
  {
    id: "kreefte-reef",
    name: "Kreefte Reef",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "West Coast",
    distanceFromCT: 150, // Approximate distance from Cape Town
    optimalWindDirections: ["ENE"],
    optimalSwellDirections: {
      min: 247.5, // WSW
      max: 270, // W
      cardinal: "WSW",
    },
    bestSeasons: ["winter"], // Typical for West Coast spots
    optimalTide: "ALL", // No specific tide information provided
    description:
      "Fairly consistent beach break rated 4/5. Works best with WSW swell and ENE offshore winds. Despite being named as a reef, spot is classified as a beach break. Location on West Coast provides reliable conditions when swell direction and winds align.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.2,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 17, // Based on current reading of 15.5°C
      winter: 14,
    },
    hazards: ["Rocks", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -33.1046, // Please verify coordinates
      lng: 18.0891,
    },
  },
  {
    id: "pointe-dimessouane",
    name: "Pointe d'Imessouane",
    continent: "Africa",
    countryId: "Morocco",
    regionId: "Central Morocco",
    location: "Central Morocco",
    distanceFromCT: 7500, // Approximate distance from Cape Town
    optimalWindDirections: ["ENE", "NE"], // Both mentioned in descriptions
    optimalSwellDirections: {
      min: 292.5, // WNW
      max: 337.5, // NNW
      cardinal: "NW",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL", // No specific tide information provided
    description:
      "Consistent exposed point break rated 4/5. Works best with Northwest groundswell and ENE/NE offshore winds. Groundswells more common than windswells. Despite quality waves, spot remains relatively uncrowded. Strong rip currents require attention.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.2,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 20, // Based on current reading of 18.5°C
      winter: 17,
    },
    hazards: ["Rip currents", "Remote location"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 30.8384, // Please verify coordinates
      lng: -9.8183,
    },
  },
  {
    id: "dracula",
    name: "Dracula",
    continent: "Africa",
    countryId: "Morocco",
    regionId: "Central Morocco",
    location: "Central Morocco",
    distanceFromCT: 7500, // Approximate distance from Cape Town
    optimalWindDirections: ["E"],
    optimalSwellDirections: {
      min: 270, // W
      max: 292.5, // WNW
      cardinal: "W",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL", // No specific tide information provided
    description:
      "Very consistent exposed reef break rated 5/5. Works best with West groundswell and easterly offshore winds. Groundswells predominate over windswells. Despite remote location, can get crowded during optimal conditions. High quality waves but requires careful navigation of rocks and rip currents.",
    difficulty: "ADVANCED", // Based on 5/5 rating and hazards
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 20, // Based on current reading of 18.4°C
      winter: 17,
    },
    hazards: ["Rocks", "Rip currents", "Remote location"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 30.8384, // Please verify coordinates
      lng: -9.8183,
    },
  },
  {
    id: "the-wedge",
    name: "The Wedge",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Cape Town",
    distanceFromCT: 20, // Approximate distance, please adjust if needed
    optimalWindDirections: ["E"],
    optimalSwellDirections: {
      min: 270, // W
      max: 280, // Allowing some variation
      cardinal: "W",
    },
    bestSeasons: ["winter"],
    optimalTide: "MID",
    description:
      "Very sheltered beach break that has reasonably consistent surf. Needs very large swell to work properly. Best performance comes from west swell with easterly offshore winds. Offers left-hand waves. Despite being sheltered, can get crowded when working. Watch for pollution in the area.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 3,
      max: 9.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 19,
      winter: 15,
    },
    hazards: ["Crowds", "Pollution"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234, // Please update with actual coordinates
      lng: 18.4567,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=7wTdB-5o1F4&t=1s",
        title: "The Wedge Surfing",
        platform: "youtube",
      },
    ],
  },
  {
    id: "ilha-do-cabo",
    name: "Ilha do Cabo",
    continent: "Africa",
    countryId: "Angola",
    regionId: "Luanda Province",
    location: "Luanda",
    distanceFromCT: 3200,
    optimalWindDirections: ["W", "WNW"],
    optimalSwellDirections: {
      min: 210, // SSW
      max: 240, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["winter", "summer"],
    optimalTide: "ALL",
    description:
      "Popular beach break in Luanda offering consistent waves year-round. Protected location provides good conditions even when other spots are blown out. Best on SW swells with light westerly winds.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.9,
      max: 2.5,
    },
    idealSwellPeriod: {
      min: 10,
      max: 16,
    },
    waterTemp: {
      summer: 28,
      winter: 24,
    },
    hazards: ["Crowds", "Rip currents"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -8.8147,
      lng: 13.2302,
    },
  },
  {
    id: "palmeirinhas",
    name: "Palmeirinhas",
    continent: "Africa",
    countryId: "Angola",
    regionId: "Luanda Province",
    location: "Luanda",
    distanceFromCT: 3200,
    optimalWindDirections: ["W", "NW"],
    optimalSwellDirections: {
      min: 210,
      max: 250,
      cardinal: "SW to WSW",
    },
    bestSeasons: ["winter"],
    optimalTide: "MID",
    description:
      "Long stretch of beach south of Luanda offering multiple peaks. Works best with SW-WSW swells and offshore morning winds. Less crowded than city beaches.",
    difficulty: "All Levels",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.0,
      max: 3.0,
    },
    idealSwellPeriod: {
      min: 11,
      max: 16,
    },
    waterTemp: {
      summer: 28,
      winter: 24,
    },
    hazards: ["Rip currents", "Remote location"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -9.0679,
      lng: 13.1969,
    },
  },
  {
    id: "ngor-right",
    name: "Ngor Right",
    continent: "Africa",
    countryId: "Senegal",
    regionId: "Dakar",
    location: "Ngor Island",
    distanceFromCT: 6800, // Approximate distance from Cape Town
    optimalWindDirections: ["NE"],
    optimalSwellDirections: {
      min: 315, // NW
      max: 337.5, // NNW
      cardinal: "NW",
    },
    bestSeasons: ["winter"], // Northern Hemisphere winter (Nov-Mar)
    optimalTide: "MID",
    description:
      "World-class right-hand reef break off Ngor Island. Offers long, perfect waves when conditions align. Best on NW swells with NE winds. Multiple sections providing both barrels and walls. Very consistent during winter months. Popular spot that can get crowded during peak season. Access via boat from Ngor village. Watch for strong currents around reef.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 28,
      winter: 22,
    },
    hazards: ["Rocks", "Strong currents", "Crowds", "Boat access only"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 14.7507,
      lng: -17.5156,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=sBVFNw6_4UY",
        title: "Surfing Ngor Rights, Dakar, Senegal",
        platform: "youtube",
      },
    ],
  },
  {
    id: "ngor-left",
    name: "Ngor Left",
    continent: "Africa",
    countryId: "Senegal",
    regionId: "Dakar",
    location: "Ngor Island",
    distanceFromCT: 6800,
    optimalWindDirections: ["NE"],
    optimalSwellDirections: {
      min: 292.5, // WNW
      max: 315, // NW
      cardinal: "WNW",
    },
    bestSeasons: ["winter"],
    optimalTide: "MID",
    description:
      "Powerful left-hand reef break adjacent to Ngor Right. Works best with WNW swell and NE winds. Shorter but more intense than its right-hand neighbor. Handles size well while maintaining shape. Access requires boat ride from Ngor village. Popular with experienced surfers during winter swells.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 28,
      winter: 22,
    },
    hazards: ["Rocks", "Strong currents", "Boat access only"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 14.7507,
      lng: -17.5156,
    },
  },
  {
    id: "ouakam",
    name: "Ouakam",
    continent: "Africa",
    countryId: "Senegal",
    regionId: "Dakar",
    location: "Ouakam",
    distanceFromCT: 6800,
    optimalWindDirections: ["NE"],
    optimalSwellDirections: {
      min: 292.5, // WNW
      max: 315, // NW
      cardinal: "WNW",
    },
    bestSeasons: ["winter"],
    optimalTide: "MID_TO_HIGH",
    description:
      "Powerful reef break beneath the African Renaissance Monument. Long right-handers that can hold serious size. Best on WNW swell with NE winds. Multiple sections offering both barrels and walls. Very consistent during winter months. Local spot that demands respect both in and out of water.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.5,
      max: 5.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 28,
      winter: 22,
    },
    hazards: ["Rocks", "Strong currents", "Localism"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 14.7219,
      lng: -17.4994,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=1kYWWxNwAYk",
        title: "Ouakam | The Endless Winter II",
        platform: "youtube",
      },
    ],
  },
  {
    id: "club-med",
    name: "Club Med",
    continent: "Africa",
    countryId: "Senegal",
    regionId: "Dakar",
    location: "Almadies",
    distanceFromCT: 6800,
    optimalWindDirections: ["NE"],
    optimalSwellDirections: {
      min: 292.5, // WNW
      max: 315, // NW
      cardinal: "WNW",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Consistent reef break offering both lefts and rights. Works best with WNW swell and NE winds. Multiple peaks provide options for different skill levels. Popular spot that can get crowded. Good access and facilities nearby. Watch for strong currents around reef sections.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.0,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 10,
      max: 16,
    },
    waterTemp: {
      summer: 28,
      winter: 22,
    },
    hazards: ["Rocks", "Crowds", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 14.7438,
      lng: -17.5131,
    },
  },
  {
    id: "virage",
    name: "Virage",
    continent: "Africa",
    countryId: "Senegal",
    regionId: "Dakar",
    location: "Almadies",
    distanceFromCT: 6800,
    optimalWindDirections: ["NE"],
    optimalSwellDirections: {
      min: 292.5, // WNW
      max: 315, // NW
      cardinal: "WNW",
    },
    bestSeasons: ["winter"],
    optimalTide: "MID",
    description:
      "Beach break with occasional reef sections. Works best with WNW swell and NE winds. Multiple peaks offering both lefts and rights. Good spot for beginners when small. Gets more challenging as swell increases. Popular with local surf schools.",
    difficulty: "All Levels",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.8,
      max: 3.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 16,
    },
    waterTemp: {
      summer: 28,
      winter: 22,
    },
    hazards: ["Rocks", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 14.7397,
      lng: -17.5092,
    },
  },
  {
    id: "mtsanga-boueni",
    name: "Mtsanga Bouéni",
    continent: "Africa",
    countryId: "Mayotte",
    regionId: "Mayotte",
    location: "Southwest Coast",
    distanceFromCT: 3200,
    optimalWindDirections: ["NNW", "N", "NW"],
    optimalSwellDirections: {
      min: 210, // SSW
      max: 230, // SW
      cardinal: "SW",
    },
    bestSeasons: ["winter"], // Southern Hemisphere winter (May-Sept)
    optimalTide: "MID",
    description:
      "Premier reef break on Mayotte's southwest coast. Works best with SW swells and NNW winds. Multiple sections offering both hollow and wall sections. Best during southern hemisphere winter when SW swells are most consistent. Remote location requires boat access from Bouéni village.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 29,
      winter: 25,
    },
    hazards: ["Reef", "Strong currents", "Remote location", "Boat access"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -12.9167,
      lng: 45.0833,
    },
  },
  {
    id: "mtsanga-saziley",
    name: "Mtsanga Saziley",
    continent: "Africa",
    countryId: "Mayotte",
    regionId: "Mayotte",
    location: "East Coast",
    distanceFromCT: 3200,
    optimalWindDirections: ["NW", "N"],
    optimalSwellDirections: {
      min: 90, // E
      max: 112.5, // ESE
      cardinal: "E",
    },
    bestSeasons: ["summer"], // Works better with summer easterly swells
    optimalTide: "MID_TO_HIGH",
    description:
      "Left-hand reef break on Mayotte's east coast. Best during summer months when easterly swells wrap around the island. Multiple sections with both hollow and wall opportunities. Remote location with beautiful setting. Watch for strong currents and shallow reef sections.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.0,
      max: 3.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 16,
    },
    waterTemp: {
      summer: 29,
      winter: 25,
    },
    hazards: ["Reef", "Strong currents", "Remote location"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -12.9833,
      lng: 45.2,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=ApsaRk8Bfhg&ab_channel=JulieB",
        title: "MAYOTTE LA MAGNIFIQUE plongée surf choungui bivouac eps LOVE",
        platform: "youtube",
      },
    ],
  },
  {
    id: "mtsanga-mtsamoudou",
    name: "Mtsanga Mtsamoudou",
    continent: "Africa",
    countryId: "Mayotte",
    regionId: "Mayotte",
    location: "South Coast",
    distanceFromCT: 3200,
    optimalWindDirections: ["N", "NE"],
    optimalSwellDirections: {
      min: 157.5, // SSE
      max: 180, // S
      cardinal: "SSE",
    },
    bestSeasons: ["winter", "summer"], // Works year-round
    optimalTide: "ALL",
    description:
      "Versatile reef break offering multiple peaks. Works with both southern hemisphere winter swells and summer easterly swells. More accessible than other spots with good road access. Multiple take-off zones suitable for different skill levels. Watch for strong currents during bigger swells.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 0.8,
      max: 2.5,
    },
    idealSwellPeriod: {
      min: 10,
      max: 16,
    },
    waterTemp: {
      summer: 29,
      winter: 25,
    },
    hazards: ["Reef", "Currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -12.95,
      lng: 45.15,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=6MfHfIFc3uI&ab_channel=JulieBrendl%C3%A9",
        title: "SURF MAYOTTE",
        platform: "youtube",
      },
    ],
  },
  {
    id: "baia-azul",
    name: "Baia Azul",
    continent: "Africa",
    countryId: "Angola",
    regionId: "Benguela",
    location: "Benguela Coast",
    distanceFromCT: 2800,
    optimalWindDirections: ["SSW", "S"],
    optimalSwellDirections: {
      min: 337.5,
      max: 22.5,
      cardinal: "SW",
    },
    bestSeasons: ["winter"], // Southern Hemisphere winter
    optimalTide: "MID",
    description:
      "Consistent beach break in Benguela's Baia Azul (Blue Bay). Works best with SW swells and southerly winds. Multiple peaks offering both lefts and rights. Best during winter months when SW swells are most consistent. Popular spot with local surfers.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.5,
      max: 2.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 26,
      winter: 20,
    },
    hazards: ["Strong currents", "Crowds on weekends"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -12.5934,
      lng: 13.4127,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=lhyCDXX-ifA&ab_channel=FindirelaYeza",
        title:
          "BAÍA AZUL ONE OF THE MOST BEAUTIFUL BEACHES IN ANGOLA/ BENGUELA #TOURISM #Angola #Globo #Ghana",
        platform: "youtube",
      },
    ],
  },
  {
    id: "blue-ocean",
    name: "Blue Ocean",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "Kuta",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["ENE", "E"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5,
      cardinal: "SW",
    },
    bestSeasons: ["dry-season"], // May-Oct
    optimalTide: "HIGH",
    description:
      "Reliable beach break in the heart of Kuta offering consistent waves throughout Bali's dry season. Multiple peaks along the beach provide both left and right options, with wave faces typically ranging from 2-6ft. Best conditions occur with SW groundswells and ENE offshore winds. Wave quality improves significantly around high tide when rocks become less of a hazard. Popular spot among beginners and intermediates due to its forgiving nature and easy access. Gets crowded during peak season mornings before onshore winds pick up. Several surf schools operate here, making it a common learning ground. Watch for submerged rocks at lower tides and strong rips that can form between sandbars.",
    difficulty: "All Levels",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.6,
      max: 2.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 29,
      winter: 26,
    },
    hazards: ["Rocks", "Rip currents", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "/images/beaches/blue-ocean.jpg",
    coordinates: {
      lat: -8.7215,
      lng: 115.1686,
    },
  },
  {
    id: "praia-morena",
    name: "Praia Morena",
    continent: "Africa",
    countryId: "Angola",
    regionId: "Benguela",
    location: "Benguela City",
    distanceFromCT: 2800,
    optimalWindDirections: ["SE", "S"],
    optimalSwellDirections: {
      min: 270, // SW
      max: 315, // NW
      cardinal: "NW",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "City beach break offering consistent waves throughout the year. Multiple peaks with both left and right options. Wave quality varies with swell direction and size. Popular with locals and good for beginners when small. Based on swell.co.za data, typically receives 0.5-0.7m waves with periods around 11-12 seconds.",
    difficulty: "All Levels",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.5,
      max: 2.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 26,
      winter: 20,
    },
    hazards: ["Crowds", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -12.5778,
      lng: 13.4097,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=-k4ux8OsJ10&ab_channel=NomadSurfCamps",
        title: "NOMAD SURFERS: ANGOLA",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=YdvzWm8MJgU&ab_channel=VlogsdoPrimata",
        title: "PRAIA MORENA A PRAIA MAIS FAMOSA DE ANGOLA | BENGUELA",
        platform: "youtube",
      },
    ],
  },
  {
    id: "jimbaran-beach",
    name: "Jimbaran Beach",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "Kuta",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["ESE", "E"],
    optimalSwellDirections: {
      min: 270, // W
      max: 280,
      cardinal: "W",
    },
    bestSeasons: ["dry-season"], // May-Oct
    optimalTide: "ALL",
    description:
      "Sheltered beach break tucked away in Jimbaran Bay offering inconsistent but occasionally rewarding surf. Despite its protected location, requires specific west swell direction and ESE winds to work properly. When conditions align, provides both left and right peaks suitable for all tide stages. Wave faces typically range from 2-4ft when working. Less crowded than neighboring spots, making it a good option for those seeking space to practice. Popular with beginners during smaller swells, but strong rip currents demand respect and awareness. Best surfed during dry season (May-October) when groundswells are more frequent. Beach setting offers stunning sunsets and numerous seafood restaurants along the shore.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.5,
      max: 2,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 29,
      winter: 26,
    },
    hazards: ["Strong rip currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    videos: [
      {
        url: "@https://www.youtube.com/watch?v=UomvCTqZLro&pp=ygUVamltYmFyYW4gYmFsaSBzdXJmaW5n ",
        title: "Surfing Canggu, Bali || Complete Guide",
        platform: "youtube",
      },
    ],
    coordinates: {
      lat: -8.7859,
      lng: 115.1654,
    },
  },
  {
    id: "balangan",
    name: "Balangan",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "The Bukit",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["ESE", "E"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5,
      cardinal: "SW",
    },
    bestSeasons: ["dry-season"], // May-Oct
    optimalTide: "MID",
    description:
      "Exposed reef break on Bali's Bukit Peninsula delivering consistent left-handers throughout the dry season. Works best with SW groundswells and ESE offshore winds, producing long walls with occasional barrel sections. Wave faces range from 3-8ft, breaking over shallow reef. Main peak offers steep takeoffs leading into multiple sections suitable for intermediate to advanced surfers. Best surfed on mid-tide when reef coverage is optimal. Popular spot that can get crowded during prime conditions. Access via steep stairs from clifftop parking. Watch for exposed reef sections and strong currents during larger swells.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.0,
      max: 2.5,
    },
    idealSwellPeriod: {
      min: 11,
      max: 16,
    },
    waterTemp: {
      summer: 29,
      winter: 26,
    },
    hazards: ["Rocks", "Reef", "Crowds", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    videos: [
      {
        url: "@https://www.youtube.com/watch?v=HxDBRGMulUw&ab_channel=SurfRawFiles ",
        title: "BEST Balangan of 2024? - Bali - RAWFILES - 06/SEPT/2024 - 4K",
        platform: "youtube",
      },
    ],
    coordinates: {
      lat: -8.7947,
      lng: 115.1212,
    },
  },
  {
    id: "anza",
    name: "Anza",
    continent: "Africa",
    countryId: "Morocco",
    regionId: "Central Morocco",
    location: "Central Morocco",
    distanceFromCT: 7500, // Approximate distance from Cape Town
    optimalWindDirections: ["NE"],
    optimalSwellDirections: {
      min: 292.5, // NW
      max: 315, // NW
      cardinal: "NW",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL", // No specific tide information provided
    description:
      "Fairly exposed beach break offering consistent surf conditions. Works best with Northwest groundswell and Northeast offshore winds. Beach offers predominantly right-hand waves. Despite reliable conditions, spot remains uncrowded. Water quality can be questionable. Location provides good access to waves throughout winter season.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.2,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 21,
      winter: 18,
    },
    hazards: ["Water quality", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 30.4467, // Please verify coordinates
      lng: -9.6431,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=z5P_LA1NYSs",
        title: "Surfing Anza - Kale Brock",
        platform: "youtube",
      },
    ],
  },
  {
    id: "ponta-das-salinas",
    name: "Ponta Das Salinas",
    continent: "Africa",
    countryId: "Angola",
    regionId: "Benguela",
    location: "Benguela",
    distanceFromCT: 2800,
    optimalWindDirections: ["SE", "SSE", "S"],
    optimalSwellDirections: {
      min: 270, // W
      max: 360, // N
      cardinal: "NW",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Beach break in Benguela region. Works best with SE to S winds and westerly to northerly swells.",
    difficulty: "All Levels",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.7,
      max: 3.2,
    },
    idealSwellPeriod: {
      min: 9,
      max: 16,
    },
    waterTemp: {
      summer: 26,
      winter: 20,
    },
    hazards: ["Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    isHiddenGem: true,
    image: "",
    coordinates: {
      lat: -12.831711,
      lng: 12.94855,
    },
  },
  {
    id: "back-beach",
    name: "Back Beach",
    continent: "Africa",
    countryId: "Mozambique",
    regionId: "Inhambane Province",
    location: "Tofo",
    distanceFromCT: 2800, // Similar to Tofinho as they're in the same region
    optimalWindDirections: ["NW"],
    optimalSwellDirections: {
      min: 112.5, // SE
      max: 157.5, // SSE
      cardinal: "SE",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Exposed beach and reef break combination rated 4/5 with fairly consistent surf. Works best with Southeast swell and Northwest offshore winds. Features right-hand beach breaks and a left-hand reef break. Receives a mix of groundswells and windswells. Despite quality waves, spot remains relatively uncrowded even on good days. Watch out for sharks and rocks.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK", // Primary characteristic, though it has reef sections
    swellSize: {
      min: 1.2,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 29, // Based on current reading
      winter: 24,
    },
    hazards: ["Sharks", "Rocks", "Strong currents"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -23.8516, // Approximate, near Tofo Beach
      lng: 35.5472,
    },
  },
  {
    id: "dinos-left",
    name: "Dinos Left",
    continent: "Africa",
    countryId: "Mozambique",
    regionId: "Inhambane Province",
    location: "Tofo Beach",
    distanceFromCT: 2800, // Similar to other Inhambane spots
    optimalWindDirections: ["SW"],
    optimalSwellDirections: {
      min: 67.5, // ENE
      max: 112.5, // ESE
      cardinal: "E",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Quite exposed reef break rated 4/5 that works inconsistently. Works best with East swell and Southwest offshore winds. Left-hand reef break that receives both groundswells and windswells. Despite quality waves when working, spot remains very uncrowded. Watch out for sharks and rocks.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.5,
      max: 5.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 29, // Based on current reading
      winter: 24,
    },
    hazards: ["Sharks", "Rocks", "Remote location"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -23.8516, // Approximate, near Tofo Beach
      lng: 35.5472,
    },
  },
  {
    id: "ponta-do-ouro",
    name: "Ponta do Ouro",
    continent: "Africa",
    countryId: "Mozambique",
    regionId: "Ponta do Ouro", // Corrected from Inhambane to Maputo Province
    location: "Ponta do Ouro",
    distanceFromCT: 2600, // Approximate distance from Cape Town
    optimalWindDirections: ["NW"],
    optimalSwellDirections: {
      min: 112.5, // SE
      max: 157.5, // SSE
      cardinal: "SE",
    },
    bestSeasons: ["summer"],
    optimalTide: "ALL",
    description:
      "Exposed point break rated 4/5 with fairly consistent surf. Works best with Southeast groundswell and Northwest offshore winds. Predominantly groundswell-driven spot that offers quality waves. Despite good conditions, rarely gets crowded. Watch out for submerged rocks.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.2,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 28, // Based on current reading
      winter: 23,
    },
    hazards: ["Rocks", "Strong currents"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "/images/beaches/td-ponta.jpg",
    coordinates: {
      lat: -26.8496, // Actual coordinates for Ponta do Ouro
      lng: 32.8989,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=vaF4GROKAno&ab_channel=BaronMedia",
        title:
          "Surfing Mozambique Ponta do Ouro Skhanyiso ( Enlighten ) Short Film",
        platform: "youtube",
      },
    ],
  },
  {
    id: "cape-vidal",
    name: "Cape Vidal",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "KwaZulu-Natal",
    location: "KwaZulu-Natal North Coast",
    distanceFromCT: 1800, // Approximate distance from Cape Town
    optimalWindDirections: ["W"],
    optimalSwellDirections: {
      min: 67.5, // ENE
      max: 112.5, // ESE
      cardinal: "E",
    },
    bestSeasons: ["summer"],
    optimalTide: "ALL",
    description:
      "Exposed reef break rated 3/5 with very consistent waves. Works best with East swell and Westerly offshore winds. Receives both local windswells and distant groundswells. No shelter from cross-shore breezes. Despite consistent conditions, rarely gets crowded. Notable shark presence in the area.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.0,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 10,
      max: 16,
    },
    waterTemp: {
      summer: 28, // Based on current reading of 27.7°C
      winter: 22,
    },
    hazards: ["Sharks", "Cross-shore winds", "Remote location"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: true,
    },
    image: "",
    coordinates: {
      lat: -28.1269,
      lng: 32.5522,
    },
  },

  {
    id: "ambinanibe",
    name: "Ambinanibe",
    continent: "Africa",
    countryId: "Madagascar",
    regionId: "Madagascar East",
    location: "Antanosy",
    distanceFromCT: 2800, // Approximate distance from Cape Town
    optimalWindDirections: ["NNW"],
    optimalSwellDirections: {
      min: 202.5, // SSW
      max: 247.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Exposed beach break rated 2/5 with consistent surf conditions. Works best with Southwest groundswell and North-northwest offshore winds. Predominantly right-hand waves. Despite lower rating, spot can get crowded. Winter offers the best conditions. Watch out for rips, rocks, and sharks.",
    difficulty: "All Levels",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.0,
      max: 3.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 28, // Based on current reading
      winter: 24,
    },
    hazards: ["Rip currents", "Rocks", "Sharks"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -25.0419, // Approximate coordinates for Antanosy region
      lng: 46.9953,
    },
  },
  {
    id: "flamebowls",
    name: "Flame Bowls",
    continent: "Africa",
    countryId: "Madagascar",
    regionId: "Madagascar West",
    location: "Vezo Reefs",
    distanceFromCT: 2900, // Approximate distance from Cape Town
    optimalWindDirections: ["SE", "ESE", "E"],
    optimalSwellDirections: {
      min: 157.5, // SSE
      max: 202.5, // SSW
      cardinal: "S",
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW_TO_MID",
    description:
      "Fairly exposed reef break with fairly consistent surf. Predominantly groundswell-driven spot offering a left-hand reef break. Despite consistent conditions, rarely gets crowded. Reaching Flame Bowls typically involves a 30-minute boat trip from Anakao, often via Nosy Ve Island. The area is part of the Vezo Reef system, which includes other notable surf spots like Chefs, Googles, Jelly Babies, Puss Puss, and Resorts. Watch out for coral, sharks, and rocks.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.5,
      max: 3.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 30, // Based on current reading of 29.6°C
      winter: 25,
    },
    hazards: ["Sharp, jagged coral reef", "Sharks", "Rocks"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "/images/beaches/td-flame.jpg",
    coordinates: {
      lat: -20.2833, // Approximate coordinates for Vezo region
      lng: 43.6667,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=UvXFDy5fNX0&ab_channel=TheSurfer%27sJournal",
        title:
          "Notes from the Channel | Finding Waves in Madagascar - Flame Bowls",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=ZppVg6OlcoA&ab_channel=madagascarsurf",
        title: "perfect set @flameballs ~ Surf Madagascar 2012",
        platform: "youtube",
      },
    ],
  },
  {
    id: "wedge",
    name: "Wedge",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "KwaZulu-Natal",
    location: "Durban",
    distanceFromCT: 1600,
    optimalWindDirections: ["WSW"],
    optimalSwellDirections: {
      min: 112.5, // ESE
      max: 122.5, // ESE
      cardinal: "ESE",
    },
    bestSeasons: ["winter"], // Added based on typical patterns
    optimalTide: "LOW_TO_MID",
    description:
      "Consistent beach and pier break rated 4/5, offering reliable waves throughout the year. Performs best with East-southeast swell combined with West-southwest offshore winds. Wave quality benefits from both local wind swells and distant groundswells. Multiple peaks provide both left and right options. Despite quality waves, spot typically remains uncrowded. Protected location near pier creates unique wave characteristics. Best surfed on rising tide from low. Watch for marine life including sharks and jellyfish, plus scattered rocks near pier structure.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.6,
      max: 5.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 26, // Based on current reading of 26.2°C
      winter: 20,
    },
    hazards: ["Sharks", "Rocks", "Jellyfish"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false, // Protected by shark nets
    },
    image: "",
    coordinates: {
      lat: -29.8584, // Using Durban coordinates
      lng: 31.0384,
    },
  },
  {
    id: "dairy-beach",
    name: "Dairy Beach (New Pier)",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "KwaZulu-Natal",
    location: "Durban",
    distanceFromCT: 1600,
    optimalWindDirections: ["SW"],
    optimalSwellDirections: {
      min: 90, // E
      max: 100, // E
      cardinal: "E",
    },
    bestSeasons: ["winter"], // Added based on typical patterns
    optimalTide: "LOW",
    description:
      "Exposed beach and pier break rated 4/5, known for its consistent wave conditions. Peak performance comes from East swell with Southwest offshore winds. Wave quality benefits from mixed groundswell and windswell combinations. Multiple peaks around pier structure offer both left and right options. Popular surf spot that draws regular crowds during good conditions. Protected by shark nets but remain alert for marine life. Iconic Durban surf spot with reliable year-round waves. Best surfed at low tide for optimal wave shape.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.6,
      max: 5.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 26, // Based on current reading of 26.2°C
      winter: 20,
    },
    hazards: ["Sharks", "Jellyfish", "Crowds"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false, // Protected by shark nets
    },
    image: "",
    coordinates: {
      lat: -29.8584, // Using Durban coordinates
      lng: 31.0384,
    },
  },
  {
    id: "addington-south-beach",
    name: "Addington (South Beach)",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "KwaZulu-Natal",
    location: "Durban",
    distanceFromCT: 1600,
    optimalWindDirections: ["SW"],
    optimalSwellDirections: {
      min: 112.5, // ESE
      max: 135, // SE
      cardinal: "ESE",
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW_TO_MID",
    description:
      "Sheltered beach break rated 4/5, offering reliable waves in Durban's South Beach area. Performs best with East-southeast swell and Southwest offshore winds. Combines groundswell consistency with windswell accessibility for year-round surf potential. Multiple peaks provide both left and right options along the shoreline. Popular with local surfers, particularly during rising low tide when wave shape peaks. Protected by shark nets but maintain awareness of marine life. Facilities include nearby parking and lifeguard stations.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.6,
      max: 5.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 26,
      winter: 20,
    },
    hazards: ["Sharks", "Jellyfish", "Crowds"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -29.8584,
      lng: 31.0384,
    },
  },
  {
    id: "bay-of-plenty",
    name: "Bay of Plenty",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "KwaZulu-Natal",
    location: "Durban",
    distanceFromCT: 1600,
    optimalWindDirections: ["WNW"],
    optimalSwellDirections: {
      min: 135, // SE
      max: 145, // Narrow SE range
      cardinal: "SE",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Exposed beach and jetty break rated 4/5, offering reliable surf conditions year-round. Peak performance requires Southeast swell with West-northwest offshore winds. Combines both local windswells and distant groundswells for consistent wave energy. Multiple peaks around jetty structure create both left and right options. Winter months provide optimal conditions with larger swells. Protected by shark nets but remain vigilant for marine life. Can experience moderate crowds during peak swells. Rocky areas near jetty require careful navigation.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.6,
      max: 5.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 26,
      winter: 20,
    },
    hazards: ["Sharks", "Rocks", "Jellyfish"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false, // Protected by shark nets
    },
    image: "",
    coordinates: {
      lat: -29.8584, // Using Durban coordinates
      lng: 31.0384,
    },
  },
  {
    id: "snake-park",
    name: "Snake Park",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "KwaZulu-Natal",
    location: "Durban",
    distanceFromCT: 1600,
    optimalWindDirections: ["WNW"],
    optimalSwellDirections: {
      min: 135, // SE
      max: 157.5, // SSE
      cardinal: "SE",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Exposed beach break rated 4/5, offering quality waves when conditions align despite inconsistent reliability. Requires precise combination of Southeast swell and West-northwest offshore winds for optimal performance. Winter months see most consistent swells from both wind and ground sources. Multiple peaks provide left and right options along the shoreline. Popular among locals during swell events, leading to crowded lineups. Protected by shark nets but maintain awareness of marine hazards. Best for experienced surfers who can capitalize on brief optimal windows.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.6,
      max: 5.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 26,
      winter: 20,
    },
    hazards: ["Sharks", "Jellyfish", "Crowds"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false, // Protected by shark nets
    },
    image: "",
    coordinates: {
      lat: -29.8584, // Using Durban coordinates
      lng: 31.0384,
    },
  },
  {
    id: "alkantstrand",
    name: "Alkantstrand",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "KwaZulu-Natal",
    location: "Richards Bay",
    distanceFromCT: 1800,
    optimalWindDirections: ["SW"],
    optimalSwellDirections: {
      min: 135, // SE
      max: 157.5, // SSE
      cardinal: "SE",
    },
    bestSeasons: ["summer"],
    optimalTide: "ALL",
    description:
      "Exposed beach break rated 3/5, characterized by reliable groundswell conditions. Distinctive right-hand waves perform best with Southeast swell and Southwest offshore winds. Summer months provide optimal conditions, unlike many South African spots that favor winter swells. Wave quality benefits primarily from groundswell energy rather than mixed swell patterns. Moderate crowd levels during good conditions. Located in Richards Bay area with typical subtropical water temperatures. Exercise standard shark safety protocols.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.6,
      max: 4.5,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 27, // Rounded from 26.9°C
      winter: 21,
    },
    hazards: ["Sharks", "Crowds"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -28.7806, // Richards Bay coordinates
      lng: 32.0878,
    },
  },
  {
    id: "cape-infanta",
    name: "Cape Infanta",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Boland and Southern Cape",
    distanceFromCT: 280, // Approximate distance from Cape Town
    optimalWindDirections: ["W"],
    optimalSwellDirections: {
      min: 135, // SE
      max: 157.5, // SSE
      cardinal: "SE",
    },
    bestSeasons: ["summer", "winter"], // No particular seasonal pattern
    optimalTide: "ALL",
    description:
      "Quite exposed beach and point break combination rated 3/5. Despite inconsistent surf conditions, offers quality waves when Southeast swell meets West offshore winds. Primarily receives distant groundswells, creating both left and right options at the beach break sections. No distinct seasonal pattern, making it suitable year-round when conditions align. Point break adds variety to wave options. Popular spot that can draw crowds during good swells. Navigate carefully around rock formations and watch for strong rip currents.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK", // Primary characteristic, though it has point sections
    swellSize: {
      min: 1.2,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 23, // Based on current reading of 22.8°C
      winter: 19,
    },
    hazards: ["Rocks", "Rip currents", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.4167, // Cape Infanta coordinates
      lng: 20.85,
    },
  },
  {
    id: "vleesbaai",
    name: "Vleesbaai",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Boland",
    distanceFromCT: 400, // Approximate distance from Cape Town
    optimalWindDirections: ["WNW"],
    optimalSwellDirections: {
      min: 135, // SE
      max: 157.5, // SSE
      cardinal: "SE",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Exposed reef and point break rated 5/5, though rarely breaking. When conditions align, offers exceptional right-hand waves powered by Southeast groundswells and West-northwest offshore winds. Winter months provide optimal conditions with more consistent groundswells. Despite the high-quality waves, spot remains relatively uncrowded even on good days. Point and reef combination creates powerful wave formations. Watch for marine hazards including sharks and sea urchins.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK", // Primary characteristic with point break sections
    swellSize: {
      min: 1.5,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 23, // Based on current reading of 23.2°C
      winter: 19,
    },
    hazards: ["Sharks", "Sea urchins"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.25, // Vleesbaai coordinates
      lng: 21.9167,
    },
  },
  {
    id: "outer-pool-mossel-bay",
    name: "Outer Pool",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Mossel Bay, Garden Route",
    distanceFromCT: 450, // Approximate distance from Cape Town
    optimalWindDirections: ["W"],
    optimalSwellDirections: {
      min: 157.5, // SSE
      max: 167.5, // SSE
      cardinal: "SSE",
    },
    bestSeasons: ["winter", "autumn", "spring"], // Summer noted as mostly flat
    optimalTide: "LOW_TO_MID",
    description:
      "Fairly exposed reef and point break rated 4/5, known for reliable surf outside summer months. Right-hand reef break performs best with South-southeast groundswell and West offshore winds. Predominantly groundswell-driven spot with minimal windswell influence. Best conditions occur during rising tide from low. Despite consistent waves and quality rating, spot typically remains uncrowded. Located along Garden Route with good wave consistency in winter, autumn, and spring. Navigate carefully around reef sections with multiple hazards.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.4,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 23, // Based on current reading of 23.1°C
      winter: 19,
    },
    hazards: ["Sea urchins", "Rocks", "Rip currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.05, // Approximate Garden Route coordinates
      lng: 23.0,
    },
  },
  {
    id: "santos-reef",
    name: "Santos Reef",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Mossel Bay, Garden Route",
    distanceFromCT: 450, // Approximate distance from Cape Town
    optimalWindDirections: ["SW"],
    optimalSwellDirections: {
      min: 135, // SE
      max: 157.5, // SSE
      cardinal: "SE",
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW_TO_MID",
    description:
      "Sheltered reef break rated 4/5, offering reliable winter surf conditions. Protected location provides clean waves when Southeast groundswell meets Southwest offshore winds. Both left and right options available off the reef. Wave quality peaks during rising tide from low. Predominantly groundswell-driven spot with minimal windswell influence. Despite consistent conditions, spot typically remains uncrowded. Located in Mossel Bay's Garden Route area. Navigate carefully around reef sections.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 23, // Based on current reading of 23.1°C
      winter: 19,
    },
    hazards: ["Rocks"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1833, // Mossel Bay coordinates
      lng: 22.1333,
    },
  },
  {
    id: "dias-beach-mossel-bay",
    name: "Dias Beach",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Mossel Bay, Garden Route",
    distanceFromCT: 450, // Approximate distance from Cape Town
    optimalWindDirections: ["WNW"],
    optimalSwellDirections: {
      min: 135, // SE
      max: 157.5, // SSE
      cardinal: "SE",
    },
    bestSeasons: ["winter", "autumn"], // Added based on typical groundswell patterns
    optimalTide: "LOW",
    description:
      "Exposed beach break rated 4/5 despite inconsistent conditions. Clean groundswells create quality waves when Southeast swell meets West-northwest offshore winds. Multiple peaks offer both left and right options along the beach. Wave quality peaks at low tide. Strong rip currents present significant challenge but help maintain uncrowded lineup even during optimal conditions. Located in Mossel Bay's Garden Route area with good access. Exercise extreme caution with powerful rips.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.2,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 23, // Based on current reading of 23.1°C
      winter: 19,
    },
    hazards: ["Strong rip currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1833, // Mossel Bay coordinates
      lng: 22.1333,
    },
  },
  {
    id: "groenvlei",
    name: "Groenvlei",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "George",
    distanceFromCT: 430, // Approximate distance from Cape Town
    optimalWindDirections: ["NW"],
    optimalSwellDirections: {
      min: 180, // S
      max: 190, // S with slight variation
      cardinal: "S",
    },
    bestSeasons: ["summer", "winter"], // Works year-round
    optimalTide: "ALL",
    description:
      "Exposed beach break rated 3/5 with consistent year-round waves. Predominantly left-hand peeling waves work best with South groundswell and Northwest offshore winds. Groundswell-dominant spot offering reliable conditions regardless of tide state. Unique in the region for its left-hand tendency and year-round consistency. Despite reliable conditions, spot typically remains uncrowded. Located in George area with good accessibility. Strong rip currents require attention despite generally favorable conditions.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.2,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 23, // Based on current reading of 23.1°C
      winter: 19,
    },
    hazards: ["Strong rip currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.05, // George area coordinates
      lng: 22.45,
    },
  },
  {
    id: "gerickes-point",
    name: "Gerickes Point",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Garden Route",
    distanceFromCT: 450, // Approximate distance from Cape Town
    optimalWindDirections: ["E"],
    optimalSwellDirections: {
      min: 180, // S
      max: 190, // S with slight variation
      cardinal: "S",
    },
    bestSeasons: ["spring", "summer"], // Unique seasonal preference
    optimalTide: "ALL",
    description:
      "Exposed point break rated 5/5, distinguished by its unique wind requirements. Premium left-hand waves form when South groundswells meet East offshore winds. Remarkably tolerant of light onshore conditions, adding to spot reliability. Spring and summer provide optimal conditions, contrasting with typical winter preference of nearby breaks. Primarily receives distant groundswells, creating consistent quality waves. Despite exceptional rating, typically maintains uncrowded lineup. Navigate carefully around point's rock formations.",
    difficulty: "ADVANCED",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.4,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 23, // Based on current reading of 23.1°C
      winter: 19,
    },
    hazards: ["Rocks"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.05, // Garden Route coordinates
      lng: 23.0,
    },
  },
  {
    id: "goukamma-river-mouth",
    name: "Goukamma River Mouth",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Garden Route",
    distanceFromCT: 450, // Approximate distance from Cape Town
    optimalWindDirections: ["N"],
    optimalSwellDirections: {
      min: 180, // S
      max: 190, // S with slight variation
      cardinal: "S",
    },
    bestSeasons: ["summer", "winter"], // Works year-round
    optimalTide: "ALL",
    description:
      "Exposed river break rated 5/5, offering unique wave characteristics at the river mouth. Performs exceptionally with South groundswells meeting North offshore winds. Year-round consistency powered by distant groundswells. River mouth dynamics create both left and right options. Wave quality maintains across all tide states. Distinctive river break setup rare in the region. Popular spot that can draw crowds during optimal conditions. Exercise caution with river mouth rip currents.",
    difficulty: "ADVANCED",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.4,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 23, // Based on current reading of 22.9°C
      winter: 19,
    },
    hazards: ["Strong rip currents", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.05, // Garden Route coordinates
      lng: 22.95,
    },
  },
  {
    id: "murphys-buffalo-bay",
    name: "Murphys (Buffalo Bay Beach)",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Knsyna, Garden Route",
    distanceFromCT: 450, // Approximate distance from Cape Town
    optimalWindDirections: ["W"],
    optimalSwellDirections: {
      min: 135, // SE
      max: 157.5, // SSE
      cardinal: "SE",
    },
    bestSeasons: ["winter", "autumn", "spring"], // Summer noted as flat
    optimalTide: "ALL",
    description:
      "Exposed beach break rated 2/5, offering consistent waves outside summer months. Works best with Southeast distant groundswells and West offshore winds. Multiple peaks provide both left and right options along the beach. Despite modest rating, maintains regular wave frequency making it popular among locals. Located in Buffalo Bay with good accessibility. Multiple hazards require attention, particularly during larger swells. Wave quality varies but reliability makes it a regular option for area surfers.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.2,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 23, // Based on current reading of 22.9°C
      winter: 19,
    },
    hazards: ["Rocks", "Sharks", "Strong rip currents", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false, // No specific incidents mentioned
    },
    image: "",
    coordinates: {
      lat: -34.0667, // Buffalo Bay coordinates
      lng: 22.9833,
    },
  },
  {
    id: "the-heads",
    name: "The Heads",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Knysna, Garden Route",
    distanceFromCT: 450, // Approximate distance from Cape Town
    optimalWindDirections: ["N"],
    optimalSwellDirections: {
      min: 157.5, // SSE
      max: 167.5, // SSE
      cardinal: "SSE",
    },
    bestSeasons: ["winter", "autumn", "spring"], // Summer noted as flat
    optimalTide: "ALL",
    description:
      "Reasonably exposed sandbar break rated 2/5, offering fairly consistent waves outside summer months. Works best with South-southeast groundswells meeting North offshore winds. Sandbar formations create both left and right options. Despite modest rating, draws regular crowds when conditions align. Located at Knysna's iconic Heads with distinctive channel dynamics. Strong rip currents present significant challenge. Wave quality varies but location's unique setup maintains regular interest.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK", // Though sandbar type, categorized as beach break
    swellSize: {
      min: 1.2,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 23, // Based on current reading of 22.9°C
      winter: 19,
    },
    hazards: ["Strong rip currents", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    videos: [
      {
        url: "https://www.youtube.com/watch?v=UrdfhKy0mYs&ab_channel=YOUREXPLORER-4K",
        title: "The HEADS - Knysna , Garden Route , South Africa",
        platform: "youtube",
      },
    ],
    coordinates: {
      lat: -34.0833, // Knysna Heads coordinates
      lng: 23.0589,
    },
  },
  {
    id: "oyster-bay",
    name: "Oyster Bay",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "Jeffreys Bay Coast",
    distanceFromCT: 650, // Approximate distance from Cape Town
    optimalWindDirections: ["NNE"],
    optimalSwellDirections: {
      min: 135, // SE
      max: 157.5, // SSE
      cardinal: "SE",
    },
    bestSeasons: ["winter"], // Based on typical groundswell patterns
    optimalTide: "ALL",
    description:
      "Exposed beach break rated 2/5, characterized by inconsistent conditions despite clean groundswells. Performs best with Southeast swell meeting North-northeast offshore winds. Particularly sensitive to wind conditions, with poor performance in light onshore breezes. Multiple peaks offer both left and right options when working. Wave quality highly dependent on sandbar formations. Despite infrequent optimal conditions, can draw crowds when working. Multiple hazards require vigilance.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK", // Though sandbar type, categorized as beach break
    swellSize: {
      min: 1.2,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 21, // Adjusted for colder region
      winter: 19,
    },
    hazards: ["Strong rip currents", "Rocks", "Sharks", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false, // No specific incidents mentioned
    },
    image: "",
    coordinates: {
      lat: -34.1667, // Oyster Bay coordinates
      lng: 24.65,
    },
  },
  {
    id: "hullets-reef",
    name: "Hullets Reef",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "Jeffreys Bay Coast",
    distanceFromCT: 650, // Approximate distance from Cape Town
    optimalWindDirections: ["SW"],
    optimalSwellDirections: {
      min: 135, // SE
      max: 157.5, // SSE
      cardinal: "SE",
    },
    bestSeasons: ["summer", "winter"], // Works year-round
    optimalTide: "ALL",
    description:
      "Reasonably exposed reef break rated 4/5, offering consistent year-round potential. Distinguished by its left-hand reef break that performs best with Southeast groundswells and Southwest offshore winds. Primarily receives distant groundswells, creating reliable quality waves. Year-round consistency unusual for the region. Popular spot that can draw significant crowds during optimal conditions. Located along Jeffreys Bay Coast with characteristic Eastern Cape conditions. Shark presence requires standard safety protocols.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.4,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 21, // Adjusted for Eastern Cape region
      winter: 19,
    },
    hazards: ["Sharks", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false, // No specific incidents mentioned
    },
    image: "",
    coordinates: {
      lat: -34.05, // Jeffreys Bay Coast coordinates
      lng: 24.9167,
    },
  },
  {
    id: "claptons-coils",
    name: "Claptons Coils",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "Jeffreys Bay Coast",
    distanceFromCT: 650, // Consistent with Eastern Cape locations
    optimalWindDirections: ["NW"],
    optimalSwellDirections: {
      min: 80, // E
      max: 100, // E with variation
      cardinal: "E",
    },
    bestSeasons: ["autumn", "winter", "spring"], // Summer excluded
    optimalTide: "ALL",
    description:
      "Exposed point break rated 4/5 with inconsistent conditions. Rare left-hand point break requiring precise East groundswells and Northwest offshore winds. Summer months often flat despite favorable winds. Clean groundswells create quality left-hand walls when conditions align. Typically remains uncrowded even during rare good swells. Located along Jeffreys Bay Coast's rugged shoreline. Exercise caution around submerged rocks and potential shark activity.",
    difficulty: "ADVANCED",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.5,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 21, // Eastern Cape pattern
      winter: 19,
    },
    hazards: ["Sharks", "Rocks"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false, // No specific incidents
    },
    image: "",
    coordinates: {
      lat: -34.1, // Jeffreys Bay area
      lng: 24.8,
    },
  },
  {
    id: "kitchen-windows",
    name: "Kitchen Windows",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "Jeffreys Bay Coast",
    distanceFromCT: 650, // Consistent with J-Bay locations
    optimalWindDirections: ["WNW"],
    optimalSwellDirections: {
      min: 135, // SE
      max: 157.5, // SSE
      cardinal: "SE",
    },
    bestSeasons: ["autumn", "winter", "spring"], // Summer excluded
    optimalTide: "ALL",
    description:
      "Exposed beach and reef break rated 4/5, offering consistent surf outside summer months. Combines beach break versatility with reef break quality when Southeast groundswells meet West-northwest offshore winds. Distant groundswells create powerful waves that attract crowds during peak conditions. Unique seabed features including mussel beds add to local hazards. Located along Jeffreys Bay's renowned coast, providing both left and right options across different sections. Exercise caution around sharp reef formations and marine life.",
    difficulty: "ADVANCED",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.5,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 21, // Eastern Cape pattern
      winter: 19,
    },
    hazards: ["Sharks", "Rocks", "Mussel shells", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.0833, // Jeffreys Bay coordinates
      lng: 24.8833,
    },
  },
  {
    id: "magna-tubes",
    name: "Magna Tubes",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "Jeffreys Bay Coast",
    distanceFromCT: 650,
    optimalWindDirections: ["WNW"],
    optimalSwellDirections: {
      min: 135,
      max: 157.5,
      cardinal: "SE",
    },
    bestSeasons: ["autumn", "winter", "spring"],
    optimalTide: "ALL",
    description:
      "Exposed reef break rated 4/5, delivering consistent quality waves. Thrives with Southeast groundswells and West-northwest offshore winds. Features both left and right reef breaks with powerful tube formations. Clean groundswells create premium barrel opportunities. Popular spot that draws crowds during good conditions. Unique seabed composition with mussel beds adds to hazards. Located along Jeffreys Bay's famous reef systems. Exercise caution around sharp reef structures and marine life.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.5,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 21,
      winter: 19,
    },
    hazards: ["Sharks", "Rocks", "Mussel shells", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.0833,
      lng: 24.9,
    },
  },
  {
    id: "super-tubes",
    name: "Super Tubes",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "Jeffreys Bay Coast",
    distanceFromCT: 650,
    optimalWindDirections: ["WSW"],
    optimalSwellDirections: {
      min: 225, // SW
      max: 247.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["autumn", "winter", "spring"], // Summer excluded
    optimalTide: "ALL",
    description:
      "Exposed reef and point break rated 4/5, renowned for consistent powerful tubes. Thrives with Southwest groundswells and West-southwest offshore winds. Combines reef's power with point break's length, creating world-class right-hand rides. Summer flat spells contrast with reliable winter/autumn conditions. Premium barrel opportunities attract crowds despite hazards. Part of Jeffreys Bay's legendary reef system. Exercise extreme caution around shallow reef sections and marine life.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.6,
      max: 4.5,
    },
    idealSwellPeriod: {
      min: 14,
      max: 18,
    },
    waterTemp: {
      summer: 21,
      winter: 19,
    },
    hazards: ["Sharks", "Rocks", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.0833,
      lng: 24.9167,
    },
  },
  {
    id: "salad-bowls",
    name: "Salad Bowls",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "Jeffreys Bay Coast",
    distanceFromCT: 650,
    optimalWindDirections: ["WSW"],
    optimalSwellDirections: {
      min: 225, // SW
      max: 247.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["autumn", "winter", "spring"],
    optimalTide: "MID_TO_HIGH",
    description:
      "Exposed point break rated 4/5, renowned for consistent right-hand walls. Thrives with powerful Southwest groundswells and West-southwest offshore winds. Forms world-class mechanical waves that peel down the rocky point. Summer flat periods contrast with reliable autumn/winter conditions. Premium performance waves attract experienced surfers, often creating crowded lineups. Part of Jeffreys Bay's legendary reef system. Exercise extreme caution around shallow bottom and marine life.",
    difficulty: "ADVANCED",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.7,
      max: 4.2,
    },
    idealSwellPeriod: {
      min: 14,
      max: 18,
    },
    waterTemp: {
      summer: 21,
      winter: 19,
    },
    hazards: ["Sharks", "Rocks", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.09,
      lng: 24.91,
    },
  },
  {
    id: "albatross",
    name: "Albatross",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "Jeffreys Bay Coast",
    distanceFromCT: 650,
    optimalWindDirections: ["SW"],
    optimalSwellDirections: {
      min: 202.5, // SSW
      max: 213.75, // SSW
      cardinal: "SSW",
    },
    bestSeasons: ["autumn", "winter", "spring"],
    optimalTide: "MID",
    description:
      "Exposed beach and reef break rated 4/5, offering powerful consistent waves. Combines beach break accessibility with reef-generated power when South-southwest groundswells meet Southwest offshore winds. Produces both left and right-hand waves with intense barrel sections. Maintains reliability outside summer months despite exposed location. Popular among experienced surfers, often crowded during peak swells. Part of Jeffreys Bay's extended reef system. Exercise caution around submerged reef structures and marine life.",
    difficulty: "ADVANCED",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.6,
      max: 4.2,
    },
    idealSwellPeriod: {
      min: 14,
      max: 18,
    },
    waterTemp: {
      summer: 21,
      winter: 19,
    },
    hazards: ["Rocks", "Sharks", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.095,
      lng: 24.875,
    },
  },
  {
    id: "noncom-cape-recife",
    name: "Noncom (Cape Recife)",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Eastern Cape",
    location: "Eastern Cape (South)",
    distanceFromCT: 700, // Further east than J-Bay locations
    optimalWindDirections: ["NNW"],
    optimalSwellDirections: {
      min: 202.5, // SSW
      max: 213.75, // SSW
      cardinal: "SSW",
    },
    bestSeasons: ["autumn", "winter", "spring"], // Summer excluded
    optimalTide: "MID",
    description:
      "Exposed sandbar break rated 4/5, renowned for consistent powerful waves. Thrives with South-southwest groundswells meeting North-northwest offshore winds. Sandbar formations create clean left-hand walls with intense tube sections. Maintains reliability outside summer months despite exposed location. Rarely crowded despite wave quality. Part of Cape Recife's expansive sandbar system. Exercise extreme caution with strong rip currents and potential shark activity.",
    difficulty: "ADVANCED",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.4,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 14,
      max: 18,
    },
    waterTemp: {
      summer: 21, // Slightly warmer than J-Bay
      winter: 18,
    },
    hazards: ["Strong rip currents", "Sharks"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.0167, // Cape Recife coordinates
      lng: 25.4167,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=Tx36W5WpxSE&ab_channel=DawidMocke",
        title:
          "The World's longest wave on a surfski - Cape Recife, 5 Capes 2016",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=snHORxNCMp0&ab_channel=Zach%26Jerry",
        title: "Cape Recife Wave Runners",
        platform: "youtube",
      },
    ],
  },
  {
    id: "onrus",
    name: "Onrus",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Hermanus",
    distanceFromCT: 120,
    optimalWindDirections: ["NW"],
    optimalSwellDirections: {
      min: 225,
      max: 247.5,
      cardinal: "SW",
    },
    bestSeasons: ["winter"],
    optimalTide: "LOW_TO_MID",
    description:
      "Exposed beach and reef break offering predominantly right-hand waves. Wave quality is inconsistent but can produce excellent conditions when Southwest swell combines with Northwest winds. Features multiple peaks with both reef and beach break sections. Submerged rocks create hazards but also help shape better waves. Best during winter months when groundswells are more consistent. Can get crowded when working well.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 24,
    },
    waterTemp: {
      summer: 18,
      winter: 14,
    },
    hazards: ["Submerged rocks", "Rip currents", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.4169,
      lng: 19.1789,
    },
  },
  {
    id: "meerensee-beach",
    name: "Meerensee Beach",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Overberg",
    distanceFromCT: 120, // Approximate distance, please adjust if needed
    optimalWindDirections: ["NW"],
    optimalSwellDirections: {
      min: 180, // S
      max: 190, // S with slight variation
      cardinal: "S",
    },
    bestSeasons: ["winter"], // Typical for Western Cape with S swell
    optimalTide: "ALL", // No specific tide mentioned
    description:
      "An exposed river break that's very consistent and usually a safe bet. Features both left and right waves at the river mouth. The uncrowded nature of this spot is a plus, though dangerous rips require caution.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.5,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 19, // Based on current reading of 16.4°C, estimating seasonal range
      winter: 15,
    },
    hazards: ["Dangerous rips", "Cross shore breezes"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234, // Please update with actual coordinates
      lng: 18.4567,
    },
  },
  {
    id: "kleinmond",
    name: "Kleinmond",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Overberg",
    distanceFromCT: 90, // Approximate distance, please verify
    optimalWindDirections: ["NNW"],
    optimalSwellDirections: {
      min: 135, // SE
      max: 157.5, // SSE
      cardinal: "SSE",
    },
    bestSeasons: ["winter"], // Typical for Western Cape
    optimalTide: "ALL", // No specific tide mentioned
    description:
      "Exposed beach break with reasonably consistent surf. Features left-hand peeling waves when conditions align. Works best with South-southeast swells meeting North-northwest offshore winds. Receives distant groundswells creating quality waves when conditions align. Popular spot that can get crowded during good swells. Strong rip currents require caution.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 19, // Based on current reading of 16.6°C
      winter: 15,
    },
    hazards: ["Dangerous rips", "Rocks", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.3333, // Kleinmond coordinates
      lng: 19.0333,
    },
  },
  {
    id: "voelklip",
    name: "Voelklip",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Overberg",
    distanceFromCT: 120, // Approximate distance, please verify
    optimalWindDirections: ["NE"],
    optimalSwellDirections: {
      min: 202.5, // SSW
      max: 213.75, // SSW with slight variation
      cardinal: "SSW",
    },
    bestSeasons: ["winter"], // Typical for Western Cape with SSW swell
    optimalTide: "LOW",
    description:
      "Exposed reef break that's consistently reliable. Works best with South-southwest groundswells meeting Northeast offshore winds. Poor performance in light onshore conditions. Despite being labeled as a reef break, there's no actual reef formation. Popular spot that can get crowded, with notable local presence. Exercise caution around rocks and sea urchins.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 19, // Based on current reading of 16.7°C
      winter: 15,
    },
    hazards: ["Rocks", "Sea urchins", "Localism", "Cross shore breezes"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.4114, // Voelklip coordinates
      lng: 19.3039,
    },
  },
  {
    id: "de-kelders",
    name: "De Kelders",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Overberg",
    distanceFromCT: 165, // Approximate distance, please verify
    optimalWindDirections: ["E"],
    optimalSwellDirections: {
      min: 225, // SW
      max: 247.5, // SW with slight variation
      cardinal: "SW",
    },
    bestSeasons: ["winter"], // Typical for Western Cape with SW swell
    optimalTide: "ALL", // No specific tide mentioned
    description:
      "Exposed beach break that works infrequently. Best conditions occur with Southwest groundswells and East offshore winds. Offers both left and right-hand waves when working. Despite quality potential, spot's inconsistency keeps crowds minimal. Strong rip currents present significant hazard.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 21, // Based on current reading of 19.1°C
      winter: 17,
    },
    hazards: ["Strong rips"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.55, // De Kelders coordinates
      lng: 19.35,
    },
  },
  {
    id: "gansbaai",
    name: "Gansbaai",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Overberg",
    distanceFromCT: 170, // Approximate distance, please verify
    optimalWindDirections: ["E"],
    optimalSwellDirections: {
      min: 225, // SW
      max: 247.5, // SW with slight variation
      cardinal: "SW",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL", // No specific tide mentioned
    description:
      "Fairly exposed reef break that works sporadically. Best conditions occur with Southwest groundswells and East offshore winds. Features both left and right-hand reef breaks. Winter brings optimal conditions, though spot remains inconsistent. Despite quality potential when working, spot rarely gets crowded. Navigate carefully around rocks and kelp beds.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 21, // Based on current reading of 19.4°C
      winter: 17,
    },
    hazards: ["Rocks", "Kelp", "Large Great White Population"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.5833, // Gansbaai coordinates
      lng: 19.35,
    },
  },
  {
    id: "pearly-beach",
    name: "Pearly Beach",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Boland and Southern Cape",
    distanceFromCT: 175, // Approximate distance, please verify
    optimalWindDirections: ["N"],
    optimalSwellDirections: {
      min: 225, // SW
      max: 247.5, // SW with slight variation
      cardinal: "SW",
    },
    bestSeasons: ["winter", "autumn", "spring"], // Summer noted as flat
    optimalTide: "ALL", // No specific tide mentioned
    description:
      "Exposed reef break with inconsistent surf conditions. Features a right-hand reef break that works best with Southwest groundswells and North offshore winds. Summer months typically flat, with better conditions in other seasons. Despite quality potential when working, spot rarely gets crowded. Distant groundswells provide primary wave source.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 21, // Based on current reading of 19.5°C
      winter: 17,
    },
    hazards: ["Rocks", "Rip currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.6667, // Pearly Beach coordinates
      lng: 19.4833,
    },
  },
  {
    id: "struisbaai",
    name: "Struisbaai",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Overberg",
    distanceFromCT: 220, // Approximate distance, please verify
    optimalWindDirections: ["W"],
    optimalSwellDirections: {
      min: 225, // SW
      max: 247.5, // SW with slight variation
      cardinal: "SW",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL", // No specific tide mentioned
    description:
      "Sheltered reef and point break offering fairly reliable surf conditions. Combines reef and point break characteristics, providing both left and right-hand options. Works best with Southwest groundswells meeting West offshore winds. Winter brings optimal conditions. Clean groundswells create quality waves. Despite good conditions, spot rarely gets crowded. Exercise caution with sharks and navigate carefully around rocks.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 24, // Based on current reading of 22.4°C
      winter: 19,
    },
    hazards: ["Sharks", "Rocks", "Rip currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.8, // Struisbaai coordinates
      lng: 20.0333,
    },
    sheltered: true, // Adding this since it's specifically mentioned as sheltered
  },
  {
    id: "arniston",
    name: "Arniston",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Boland and Southern Cape",
    distanceFromCT: 220, // Approximate distance, please verify
    optimalWindDirections: ["WNW"],
    optimalSwellDirections: {
      min: 180, // S
      max: 190, // S with slight variation
      cardinal: "S",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL", // No specific tide mentioned
    description:
      "Sheltered beach break offering reliable surf conditions. Features both left and right-hand waves. Works best with South groundswells meeting West-northwest offshore winds. Winter brings optimal conditions. Groundswells dominate over windswells, creating quality waves. Despite good conditions, spot rarely gets crowded. Exercise caution with sharks and navigate carefully around rocks.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 24, // Based on current reading of 22.6°C
      winter: 19,
    },
    hazards: ["Sharks", "Rocks"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.6667, // Arniston coordinates
      lng: 20.2333,
    },
    sheltered: true, // Adding this since it's specifically mentioned as sheltered
  },
  {
    id: "danger-reef",
    name: "Danger Reef",
    continent: "Africa",
    countryId: "South Africa",
    regionId: "Western Cape",
    location: "Cape Peninsula",
    distanceFromCT: 20, // Approximate distance from Cape Town
    optimalWindDirections: ["NW"],
    optimalSwellDirections: {
      min: 135, // SE
      max: 157.5, // SSE
      cardinal: "SE",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL", // No specific tide mentioned
    description:
      "Exposed reef break rated 2/5 with fairly consistent surf conditions. Works best with Southeast groundswells meeting Northwest offshore winds. Features both left and right reef breaks. Winter brings optimal conditions with more frequent groundswells than windswells. Despite modest rating, spot draws regular crowds. Navigate carefully around submerged rocks.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 20, // Based on current reading of 17.7°C
      winter: 16,
    },
    hazards: ["Submerged rocks", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -34.1234, // Please update with actual coordinates
      lng: 18.4567, // Please update with actual coordinates
    },
  },
  {
    id: "baia-farta",
    name: "Baia Farta",
    continent: "Africa",
    countryId: "Angola",
    regionId: "Benguela",
    location: "Benguela",
    isHiddenGem: true,
    distanceFromCT: 2800,
    optimalWindDirections: ["S", "SSE", "SE"],
    optimalSwellDirections: {
      min: 270, // W
      max: 360, // N
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Beach break in Baia Farta region. Works with southerly to south-easterly winds and westerly to northerly swells.",
    difficulty: "All Levels",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.5,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 8,
      max: 16,
    },
    waterTemp: {
      summer: 26,
      winter: 20,
    },
    hazards: ["Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -12.595654,
      lng: 13.204314,
    },
  },
  {
    id: "luvuvamo",
    name: "Luvuvamo",
    continent: "Africa",
    countryId: "Angola",
    regionId: "Luanda Province",
    location: "Luanda",
    distanceFromCT: 2900, // Approximate distance from Cape Town
    optimalWindDirections: ["E", "NE", "NNE"],
    optimalSwellDirections: {
      min: 225, // SW
      max: 315, // NW
      cardinal: "SW",
    },
    bestSeasons: ["winter"], // Southern Hemisphere winter
    optimalTide: "ALL",
    description:
      "Beach break in Luanda region. Works best with easterly to northeasterly winds and southwest to northwest swells. Hidden gem spot that remains relatively uncrowded.",
    difficulty: "All Levels",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.8,
      max: 2.5,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 28,
      winter: 24,
    },
    hazards: ["Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    isHiddenGem: true,
    image: "",
    coordinates: {
      lat: -7.365131,
      lng: 12.919328,
    },
  },
  {
    id: "shipwreck-angola",
    name: "Shipwreck",
    continent: "Africa",
    countryId: "Angola",
    regionId: "Luanda Province",
    location: "Luanda",
    distanceFromCT: 2900, // Approximate distance from Cape Town
    optimalWindDirections: ["NE"],
    optimalSwellDirections: {
      min: 225, // SW
      max: 247.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Exposed beach break rated 3/5 with fairly consistent surf conditions. Works best with Southwest swell combining with Northeast offshore winds. Receives both local windswells and distant groundswells. Features both left and right-hand waves along the beach. Despite reliable conditions, spot rarely gets crowded. Watch out for submerged wreck and sharks.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.0,
      max: 3.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 28,
      winter: 24,
    },
    hazards: ["Submerged wreck", "Sharks"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -9.088445,
      lng: 12.992997,
    },
  },
  {
    id: "morro-do-sombreiro",
    name: "Morro do Sombreiro",
    continent: "Africa",
    countryId: "Angola",
    regionId: "Benguela",
    location: "Caota",
    distanceFromCT: 380, // Approximate distance from Luanda
    optimalWindDirections: ["N", "NE", "NNE"],
    optimalSwellDirections: {
      min: 160,
      max: 260,
      cardinal: "S, SW",
    },
    bestSeasons: ["winter"],
    optimalTide: "MID",
    description:
      "Remote beach break requiring a walk. Consistent wedges form on sandbanks with multiple peaks. Best on NW swells with offshore S winds.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.2,
      max: 2.8,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 24,
      winter: 20,
    },
    hazards: ["Remote location", "Strong currents", "Limited access"],
    crimeLevel: "Low",
    sharkAttack: { hasAttack: false },
    image: "",
    coordinates: {
      lat: -12.588344,
      lng: 13.303127,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=IiFcs_KD94s&ab_channel=GabrielTManuel",
        title:
          "Conhecendo um pouco o povoado da Caota/Baía Farta/Benguela/Angola",
        platform: "youtube",
      },
    ],
  },
  {
    id: "sumbe",
    name: "Sumbe",
    continent: "Africa",
    countryId: "Angola",
    regionId: "Benguela",
    location: "Sumbe",
    distanceFromCT: 2800, // Similar to other Benguela spots
    optimalWindDirections: ["ENE", "E"],
    optimalSwellDirections: {
      min: 225, // SW
      max: 247.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["winter"], // Southern Hemisphere winter
    optimalTide: "ALL",
    description:
      "Exposed beach and reef break combination. Works best with Southwest groundswell and East-northeast offshore winds. The beach break favors left-handers. Despite quality waves, spot remains uncrowded. Watch out for rips and sharks.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK", // Primary characteristic though it has reef sections
    swellSize: {
      min: 1.0,
      max: 3.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 16,
    },
    waterTemp: {
      summer: 28,
      winter: 24,
    },
    hazards: ["Rips", "Sharks"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -11.236697,
      lng: 13.830747,
    },
  },
  {
    id: "uluwatu",
    name: "Uluwatu",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "The Bukit",
    distanceFromCT: 8900, // Approximate distance from Cape Town
    optimalWindDirections: ["SE"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["winter"], // May-Oct (Dry Season)
    optimalTide: "ALL",
    description:
      "World-class left-hand reef and point break rated 4/5, known for its very consistent waves. Best performance during dry season (May-Oct) with SW groundswell and SE offshore winds. Multiple sections offering both barrels and walls. Despite popularity, size and multiple takeoff zones help manage crowds. Watch for sharp reef and strong currents.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 6.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 30, // Based on current reading of 29.6°C
      winter: 27,
    },
    hazards: ["Rocks", "Strong currents", "Sharp reef", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image:
      "https://media.tideraider.com/Leonardo_Phoenix_10_Reminiscent_of_Studio_Ghiblis_style_of_be_1.jpg",
    coordinates: {
      lat: -8.8156,
      lng: 115.0892,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=dcPAxBJO6iY&pp=ygUUVWx1d2F0dSBCYWxpIHN1cmZpbmc%3D",
        title: "The Reality Of Surfing Uluwatu, Bali",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=nGwRL2Ize_E&ab_channel=SurfersofBali",
        title: "Sweet Peaks - Uluwatu",
        platform: "youtube",
      },
    ],
  },
  {
    id: "outside-corner",
    name: "Outside Corner",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "The Bukit",
    distanceFromCT: 8900, // Same as Uluwatu
    optimalWindDirections: ["ESE"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["winter"], // May-Oct (Dry Season)
    optimalTide: "LOW",
    description:
      "Exposed reef and point break rated 4/5, offering quite consistent surf conditions. Best performance during dry season (May-Oct) with SW groundswell and ESE offshore winds. Features a powerful left-hand point break. Despite quality waves, crowds remain manageable. Exercise caution with exposed reef sections.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.5,
      max: 5.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 30, // Based on current reading of 29.7°C
      winter: 27,
    },
    hazards: ["Rocks", "Strong currents", "Sharp reef"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -8.8156, // Adjacent to Uluwatu
      lng: 115.0892,
    },
  },
  {
    id: "temples",
    name: "Temples",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "The Bukit",
    distanceFromCT: 8900, // Same as other Bukit spots
    optimalWindDirections: ["ESE"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["winter"], // May-Oct (Dry Season)
    optimalTide: "ALL",
    description:
      "Exposed reef and point break rated 4/5, delivering reasonably consistent waves throughout dry season. Distinguished by its clean left-hand point break that performs best with Southwest groundswells meeting East-southeast offshore winds. Premium wave quality during May-October dry season. Part of The Bukit's legendary reef system. Despite quality waves, typically maintains moderate crowd levels. Exercise caution around shallow reef sections.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.4,
      max: 4.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 30, // Based on current reading of 29.7°C
      winter: 27,
    },
    hazards: ["Rocks", "Sharp reef", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -8.8182, // Slightly south of Uluwatu
      lng: 115.0891,
    },
  },
  {
    id: "racetrack",
    name: "Racetrack",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "The Bukit",
    distanceFromCT: 8900, // Same as other Bukit spots
    optimalWindDirections: ["ESE"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["winter"], // May-Oct (Dry Season)
    optimalTide: "MID",
    description:
      "Exposed reef and point break rated 4/5, boasting very reliable surf conditions throughout dry season. Features a powerful left-hand point break that excels with Southwest groundswells meeting East-southeast offshore winds. Premium wave quality during May-October dry season. Part of The Bukit's renowned reef system. Clean groundswells dominate over windswells, creating consistent quality waves. Exercise caution with exposed reef sections.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.4,
      max: 4.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 30, // Based on current reading of 29.7°C
      winter: 27,
    },
    hazards: ["Rocks", "Sharp reef"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -8.8195, // Slightly south of Temples
      lng: 115.089,
    },
  },
  {
    id: "the-bombie",
    name: "The Bombie",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "The Bukit",
    distanceFromCT: 8900, // Same as other Bukit spots
    optimalWindDirections: ["SE"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["winter"], // May-Oct (Dry Season)
    optimalTide: "ALL",
    description:
      "Exposed reef break rated 4/5, offering fairly consistent surf conditions throughout dry season. Features a powerful left-hand reef break that performs best with Southwest groundswells meeting Southeast offshore winds. Premium wave quality during May-October dry season. Part of The Bukit's renowned reef system. Groundswells dominate the wave formation, creating quality conditions when working. Popular spot that draws significant crowds during good swells. Exercise caution around shallow reef sections.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.4,
      max: 4.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 30, // Based on current reading of 29.7°C
      winter: 27,
    },
    hazards: ["Rocks", "Sharp reef", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -8.8205, // Slightly south of Racetrack
      lng: 115.0889,
    },
  },
  {
    id: "the-peak",
    name: "The Peak",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "The Bukit",
    distanceFromCT: 8900, // Consistent with other Bukit spots
    optimalWindDirections: ["SE"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["winter"], // May-Oct (Dry Season)
    optimalTide: "HIGH",
    description:
      "Exposed reef and point break rated 4/5, renowned for very consistent surf conditions. Features a classic left-hand point break that thrives with Southwest groundswells and Southeast offshore winds. Prime conditions during May-October dry season. Receives clean, powerful groundswells that create long, rideable walls. Best performance at high tide. Part of The Bukit's legendary reef system. Popular spot that maintains good wave access despite crowds. Exercise caution around submerged reef structures.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.5,
      max: 5.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 30, // Matches current reading of 29.7°C
      winter: 27,
    },
    hazards: ["Rocks", "Sharp reef", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -8.8215, // South of The Bombie
      lng: 115.0888,
    },
  },
  {
    id: "nyang-nyang",
    name: "Nyang-Nyang",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "The Bukit",
    distanceFromCT: 8900, // Consistent with other Bukit spots
    optimalWindDirections: ["N"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["summer"], // Nov-Apr (Wet Season)
    optimalTide: "MID",
    description:
      "Exposed reef break rated 4/4, offering reasonably consistent right-hand waves during wet season. Unique among Bukit spots for favoring North winds and Southwest swells. Best conditions November-April when other breaks become less reliable. Features a right-hand reef break that works best at mid tide. Less crowded than northern Bukit spots but still sees periodic crowds. Exercise caution around shallow reef and rocky bottom.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 4.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 30,
      winter: 27,
    },
    coffeeShop: [
      {
        name: "The Great White House", // Local cafe with ocean views
      },
    ],
    hazards: ["Rocks", "Shallow reef", "Variable crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -8.823, // South of The Peak
      lng: 115.0887,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=xDAchHyRX8k&ab_channel=Surfind", // Sample video link
        title: "Kelly Slater surf at Nyang-Nyang, Surfing Bali",
        platform: "youtube",
      },
    ],
  },
  {
    id: "green-ball",
    name: "Green Ball",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "The Bukit",
    distanceFromCT: 8900, // Consistent with other Bukit spots
    optimalWindDirections: ["N"],
    optimalSwellDirections: {
      min: 191.25, // SSE
      max: 213.75, // SSW
      cardinal: "SSW",
    },
    bestSeasons: ["summer"], // Nov-Apr (Wet Season)
    optimalTide: "MID",
    description:
      "Exposed reef break rated 3/5, offering fairly consistent left and right-hand waves during wet season. Unique among Bukit breaks for optimal North winds and South-southwest swells. Best conditions November-April when other spots become less reliable. Features both left and right reef breaks that work best at mid tide. Attracts moderate crowds despite lower rating. Exercise caution with strong rips and submerged rocks.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.0,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 30, // Based on current reading of 29.6°C
      winter: 27,
    },
    hazards: ["Rips", "Rocks", "Variable crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -8.824, // South of Nyang-Nyang
      lng: 115.0886,
    },
  },
  {
    id: "sri-lanka",
    name: "Sri Lanka",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "The Bukit",
    distanceFromCT: 8900, // Consistent with other Bukit spots
    optimalWindDirections: ["W"],
    optimalSwellDirections: {
      min: 191.25, // SSW
      max: 213.75, // SSW
      cardinal: "SSW",
    },
    bestSeasons: ["summer"], // Nov-Apr (Wet Season)
    optimalTide: "MID",
    description:
      "Exposed reef break rated 2/5, offering dependable right-hand waves during wet season. Unique configuration requiring West winds and South-southwest swells. Best conditions November-April when other breaks become less consistent. Features a right-hand reef break that works best at mid tide. Attracts moderate crowds despite lower rating. Exercise caution around rocky bottom and occasional strong currents.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 0.8,
      max: 2.5,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 30, // Based on current reading of 29.6°C
      winter: 27,
    },
    hazards: ["Rocks", "Variable crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -8.826, // South of Nusa Dua
      lng: 115.0884,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=DEF456",
        title: "Surfing Sri Lanka Right-Handers",
        platform: "youtube",
      },
    ],
  },
  {
    id: "bali-tropic",
    name: "Bali Tropic",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "The Bukit",
    distanceFromCT: 8900,
    optimalWindDirections: ["W"],
    optimalSwellDirections: {
      min: 247.5, // WSW
      max: 247.5,
      cardinal: "WSW",
    },
    bestSeasons: ["summer"], // Nov-Apr (Wet Season)
    optimalTide: "ALL",
    description:
      "Fairly exposed reef break rated 2/5, offering reliable waves during wet season. Unique configuration requiring West winds and West-southwest swells. Best conditions November-April when other breaks become inconsistent. Features a lesser-known reef setup that works in various tides. Remains uncrowded even during peak seasons. Exercise caution with occasional rocky sections.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 0.8,
      max: 2.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 30,
      winter: 27,
    },
    hazards: ["Rocks"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -8.827, // South of Sri Lanka
      lng: 115.0883,
    },
  },
  {
    id: "nusa-dua",
    name: "Nusa Dua",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "The Bukit",
    distanceFromCT: 8900,
    optimalWindDirections: ["W"],
    optimalSwellDirections: {
      min: 191.25, // SSW
      max: 213.75, // SSW
      cardinal: "SSW",
    },
    bestSeasons: ["summer"], // Nov-Apr (Wet Season)
    optimalTide: "MID",
    description:
      "Exposed reef break rated 4/5, offering consistent left and right-hand waves during wet season. Thrives with South-southwest groundswells and Westerly offshore winds. Best conditions November-April with powerful swells creating peaky reef breaks. Performs best on a falling mid tide. Attracts experienced surfers despite challenging conditions. Exercise caution with strong rips and submerged rocks.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 30, // Current reading 29.6°C
      winter: 27,
    },
    hazards: ["Rips", "Rocks", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -8.825, // Between Green Ball (-8.824) and Sri Lanka (-8.826)
      lng: 115.0885,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=pll3RHu7dRk&ab_channel=SurfRawFiles",
        title: "NusaDua Left - Bali - RAWFILES - 17/FEB/2021",
        platform: "youtube",
      },
    ],
  },
  {
    id: "tandjung-lefts",
    name: "Tandjung-Lefts",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "Sanur",
    distanceFromCT: 8900,
    optimalWindDirections: ["W"],
    optimalSwellDirections: {
      min: 180,
      max: 195,
      cardinal: "S",
    },
    bestSeasons: ["winter"],
    optimalTide: "MID",
    description:
      "Reasonably exposed reef break in Sanur offering left-hand waves. Best during wet season (Nov-Apr) with South swells and West offshore winds. Works best on rising mid tide. Watch for submerged rocks. Can get crowded despite moderate rating.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 30,
      winter: 27,
    },
    hazards: ["Submerged rocks", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coffeeShop: [
      {
        name: "Buddha Cafe Sanur",
      },
    ],
    coordinates: {
      lat: -8.701,
      lng: 115.2626,
    },
  },
  {
    id: "tandjungs-rights",
    name: "Tandjungs-Rights",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "Sanur",
    distanceFromCT: 8900,
    optimalWindDirections: ["W"],
    optimalSwellDirections: {
      min: 180,
      max: 195,
      cardinal: "S",
    },
    bestSeasons: ["winter"],
    optimalTide: "ALL",
    description:
      "Fairly exposed reef break with very consistent right-hand waves. Best during wet season (Nov-Apr) with South groundswells and West offshore winds. Works at all tide stages. Rocky bottom and occasional crowds require attention.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.2,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 30,
      winter: 27,
    },
    hazards: ["Rocks", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    videos: [
      {
        url: "https://www.youtube.com/watch?v=xRa71kkL4xc&ab_channel=DanHarmon",
        title: "Complete Surfing Guide to Indonesia",
        platform: "youtube",
      },
    ],
    coffeeShop: [
      {
        name: "Salt Cafe Sanur",
      },
    ],
    coordinates: {
      lat: -8.7025, // Slightly south of Tandjung-Lefts
      lng: 115.2631,
    },
  },
  {
    id: "canggu",
    name: "Canggu",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "West Coast",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["NE", "ENE", "E"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5,
      cardinal: "SW",
    },
    bestSeasons: ["dry-season"], // May-Oct
    optimalTide: "MID",
    description:
      "Iconic Bali reef break offering consistent waves year-round, with peak conditions during the dry season (May-October). Multiple peaks across the reef provide both left and right-handers, with wave faces ranging from 2-8ft. Main break delivers powerful walls and occasional barrels over shallow reef, while reform sections offer more forgiving rides. Best performance on SW swells with NE winds under 15 knots. Morning sessions typically glassy before onshore winds develop. Deep channels between peaks aid paddle-outs but create strong lateral currents - use landmarks to maintain position. Popular spot that gets crowded, especially during peak season. Watch for exposed reef sections at low tide and strong rips near main peak.",
    difficulty: "INTERMEDIATE",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 0.6,
      max: 2.4,
    },
    idealSwellPeriod: {
      min: 11,
      max: 16,
    },
    waterTemp: {
      summer: 29,
      winter: 26,
    },
    hazards: ["Reef", "Rip currents", "Crowds", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -8.6478,
      lng: 115.1385,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=7Ys47vW7I04&ab_channel=Surfer2000",
        title: "Canggu Surf Scene - Bali",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=yi5jY0VsVGM&ab_channel=DanHarmon",
        title: "Surfing Canggu, Bali || Complete Guide",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=DCY9lDBgJxo&ab_channel=SurfersofBali",
        title: "Time & Place: Canggu In March",
        platform: "youtube",
      },
    ],
    coffeeShop: [
      { name: "Crate Cafe" },
      { name: "Milk & Madu" },
      { name: "Coffee & Coconuts" },
    ],
  },
  {
    id: "bingin",
    name: "Bingin",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "The Bukit",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["E", "ESE"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5,
      cardinal: "SW",
    },
    bestSeasons: ["dry-season"], // May-Oct
    optimalTide: "MID",
    description:
      "Classic Bukit Peninsula reef break known for its perfect left-hand barrels. Highly consistent during dry season with SW groundswells and easterly winds creating ideal conditions. Wave faces range from 2-8ft, breaking over shallow reef in multiple sections. Offers short but intense rides with steep takeoffs leading into barrel sections. Very popular spot that gets crowded, especially during prime conditions. Access requires navigating steep stairs down limestone cliffs. Best surfed mid to low tide when wave shape is optimal. Watch for exposed reef and strong currents, particularly on larger swells.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.4,
      max: 2.5,
    },
    idealSwellPeriod: {
      min: 11,
      max: 16,
    },
    waterTemp: {
      summer: 29,
      winter: 26,
    },
    hazards: ["Rocks", "Reef", "Crowds", "Strong currents", "Difficult access"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    videos: [
      {
        url: "https://www.youtube.com/watch?v=tAaiK5MeuQc&ab_channel=SurfersofBali",
        title: "Stubborn Perfection - Bingin, 31 July 2020",
        platform: "youtube",
      },
    ],
    coordinates: {
      lat: -8.8103,
      lng: 115.1089,
    },
    coffeeShop: [{ name: "Warung Tuti Cafe" }],
  },
  {
    id: "dreamland",
    name: "Dreamland",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "The Bukit",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["E", "ESE"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5,
      cardinal: "SW",
    },
    bestSeasons: ["dry-season"], // May-Oct
    optimalTide: "LOW",
    description:
      "Exposed beach and reef break combination offering fairly consistent waves throughout the dry season. Features both left and right peaks breaking over reef, with wave faces typically ranging from 2-6ft. Best performance during low tide with SW groundswells meeting easterly offshore winds. Beach break section provides more forgiving waves suitable for intermediates, while reef sections demand more experience. Popular tourist location that can get crowded, especially during peak season. Deep channel assists with paddle out but creates strong lateral currents. Watch for submerged rocks at low tide, particularly around reef sections.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.8,
      max: 2.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 29,
      winter: 26,
    },
    hazards: ["Rocks", "Reef", "Crowds", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -8.7947,
      lng: 115.1167,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=WWzTXyEzVFY&ab_channel=Surfind",
        title: "Bali surf Dreamland Beach when full tide | local surfer",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=5Hnx9dytcwc&ab_channel=SurfVideoBali",
        title: "SURFING BIG WAVE RIGHT SIDE A-FRAME AT DREAMLAND BEACH",
        platform: "youtube",
      },
    ],
    coffeeShop: [{ name: "Beige Coffee Bingin, Bali" }],
  },
  {
    id: "impossibles",
    name: "Impossibles",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "The Bukit",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["ESE", "E"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5,
      cardinal: "SW",
    },
    bestSeasons: ["dry-season"], // May-Oct
    optimalTide: "LOW",
    description:
      "World-class reef break rated 5/5 for its perfectly peeling left-handers that earned its intimidating name. Highly consistent during dry season, producing long, fast walls that require committed surfing. Best conditions occur with SW groundswells and ESE offshore winds, generating wave faces from 4-12ft. Multiple takeoff zones spread across three main sections, each offering 100+ meter rides when connecting. Low tide typically provides optimal wave shape and speed. Despite challenging nature, spot draws crowds during prime conditions. Access via steep cliff stairs shared with Bingin. Advanced spot demanding strong paddle fitness and reef break experience. Watch for exposed reef sections, particularly during low tide sets.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.4,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 29,
      winter: 26,
    },
    hazards: ["Rocks", "Reef", "Crowds", "Strong currents", "Difficult access"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -8.8183,
      lng: 115.0891,
    },
  },
  {
    id: "padang-padang",
    name: "Padang Padang",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "The Bukit",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["SE", "ESE"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5,
      cardinal: "SW",
    },
    bestSeasons: ["dry-season"], // May-Oct
    bestMonthOfYear: "October",
    optimalTide: "MID",
    description:
      "Legendary Bukit Peninsula reef break rated 4/5, famously known as the 'Balinese Pipeline'. Despite inconsistent nature, delivers world-class barrels when conditions align. Requires solid SW groundswell and SE winds to showcase its full potential. Wave faces range from 4-12ft, breaking over shallow reef through a narrow canyon-like channel. Best performance during mid-tide with larger swells. Access via steep concrete stairs through a dramatic cave entrance. Extremely crowded when working due to its iconic status. Advanced spot demanding expert barrel-riding skills and reef break experience. Watch for exposed reef sections and strong surge through cave entrance during sets.",
    difficulty: "EXPERT",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.5,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 29,
      winter: 26,
    },
    hazards: [
      "Rocks",
      "Sharp reef",
      "Heavy crowds",
      "Strong currents",
      "Cave entrance",
    ],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "/images/beaches/padang-padang.jpg",
    coordinates: {
      lat: -8.8107,
      lng: 115.1031,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=HVN_TfRfZ_A&ab_channel=SurfersofBali",
        title:
          "Was This The Best Session Of The Year? - Padang Padang, 12 September 2020",
        platform: "youtube",
      },
    ],
  },
  {
    id: "the-peak-bukit",
    name: "The Peak",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "The Bukit",
    distanceFromCT: 8900, // Consistent with other Bukit spots
    optimalWindDirections: ["SE"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5, // WSW
      cardinal: "SW",
    },
    bestSeasons: ["winter"], // May-Oct (Dry Season)
    bestMonthOfYear: "September",
    optimalTide: "HIGH",
    description:
      "Exposed reef and point break rated 4/5, renowned for very consistent surf conditions. Features a classic left-hand point break that thrives with Southwest groundswells and Southeast offshore winds. Prime conditions during May-October dry season. Receives clean, powerful groundswells that create long, rideable walls. Best performance at high tide. Part of The Bukit's legendary reef system. Popular spot that maintains good wave access despite crowds. Exercise caution around submerged reef structures.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.5,
      max: 5.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 30, // Matches current reading of 29.7°C
      winter: 27,
    },
    hazards: ["Rocks", "Sharp reef", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -8.8215, // South of The Bombie
      lng: 115.0888,
    },
  },
  {
    id: "lacerations",
    name: "Lacerations",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "Nusa Lembongan",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["ESE", "E"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5,
      cardinal: "SW",
    },
    bestSeasons: ["dry-season"], // May-Oct
    bestMonthOfYear: "July", // Peak of dry season
    optimalTide: "HIGH",
    description:
      "Sheltered reef break rated 4/5 offering powerful right-handers when conditions align. Despite inconsistent nature, delivers world-class waves during dry season SW swells. Named for its shallow reef setup, wave faces range from 4-10ft breaking over sharp coral. Best performance during high tide with ESE offshore winds. Located in a channel between Nusa Lembongan and Nusa Ceningan, requiring boat access. Popular spot that draws crowds on good days. Local knowledge essential for navigating channel currents and reef hazards. Watch for moored boats and buoys in lineup. Strong localism can be present during prime conditions.",
    difficulty: "ADVANCED",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.4,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 29,
      winter: 26,
    },
    hazards: [
      "Sharp reef",
      "Strong rips",
      "Crowds",
      "Boat traffic",
      "Buoys",
      "Localism",
    ],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "/images/beaches/lacerations.jpg",
    coordinates: {
      lat: -8.6785,
      lng: 115.4555,
    },
  },
  {
    id: "mushroom-beach",
    name: "Mushroom Beach - Nusa Lembongan",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "Nusa Lembongan",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["SE"],
    optimalSwellDirections: {
      min: 247.5, // WSW
      max: 270, // W
      cardinal: "WSW",
    },
    bestSeasons: ["dry-season"], // May-Oct
    optimalTide: "ALL",
    description:
      "Sheltered reef break offering consistent waves throughout the dry season. Benefits from protection against SW winds while maintaining clean conditions with SE offshores. Despite its proximity to more famous breaks, remains relatively uncrowded even during good conditions. Wave faces typically range from 2-6ft. Popular tourist beach location with easy access and gentle beach entry. Good option for those seeking mellower waves away from Lembongan's more challenging breaks. Watch for submerged rocks, particularly during lower tides.",
    difficulty: "BEGINNER",
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.4,
      max: 2.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 29,
      winter: 26,
    },
    hazards: ["Rocks"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    videos: [
      {
        url: "https://www.youtube.com/watch?v=LfM0urxEZ6I&ab_channel=SurfRawFiles",
        title: "Nusa Lembongan - Surf Guide - RAWFILES",
        platform: "youtube",
      },
    ],
    coordinates: {
      lat: -8.6785,
      lng: 115.4555,
    },
    coffeeShop: [{ name: "The Beach Shack, Nusa Lembongan" }],
  },
  {
    id: "ceningan-point",
    name: "Ceningan Point",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "Nusa Lembongan",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["ENE", "E"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5,
      cardinal: "SW",
    },
    bestSeasons: ["dry-season"], // May-Oct
    optimalTide: "ALL",
    description:
      "Exposed point break rated 3/5 known for its exceptional consistency during dry season. Located off Nusa Ceningan, this break works well with SW groundswells and ENE offshore winds. Wave faces typically range from 3-8ft, offering long, workable walls. Despite its quality and consistency, remains relatively uncrowded, partly due to its location requiring boat access. Works across all tide stages, providing versatile surfing conditions. Local knowledge important for navigating channel hazards and moored boats. Watch for strong currents around the point and respect local lineup priorities.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.0,
      max: 2.5,
    },
    idealSwellPeriod: {
      min: 11,
      max: 16,
    },
    waterTemp: {
      summer: 29,
      winter: 26,
    },
    hazards: ["Strong currents", "Boat traffic", "Buoys", "Localism"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    videos: [
      {
        url: "https://www.youtube.com/watch?v=yzANwZg1D_s&ab_channel=SurfVideoBali ",
        title: "Surfing trip secret spot nusa ceningan",
        platform: "youtube",
      },
    ],
    coordinates: {
      lat: -8.6982,
      lng: 115.4589,
    },
  },
  {
    id: "punta-roca",
    name: "Punta Roca",
    continent: "North America",
    countryId: "El Salvador",
    regionId: "San Salvador",
    location: "La Libertad",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["NNE", "N"],
    optimalSwellDirections: {
      min: 202.5, // SSW
      max: 247.5, // WSW
      cardinal: "SSW",
    },
    bestSeasons: ["dry-season"], // Typically March-October
    optimalTide: "MID",
    description:
      "World-class point break rated 4/5, known for its powerful, consistent waves. Features long, workable walls that can produce excellent barrels when conditions align. Best performance with SSW groundswells meeting NNE offshore winds. Wave faces typically range from 4-12ft breaking over reef. Popular spot that draws crowds during prime conditions. Local knowledge important for navigating hazards and respecting lineup priorities. Watch for exposed rocks, particularly during lower tides, and be mindful of local surfing etiquette.",
    difficulty: "ADVANCED",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.4,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 29,
      winter: 26,
    },
    hazards: ["Rocks", "Strong locals", "Pollution", "Crowds"],
    crimeLevel: "Medium",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 13.4833,
      lng: -89.3667,
    },
  },
  {
    id: "pavones",
    name: "Pavones",
    continent: "North America",
    countryId: "Costa Rica",
    regionId: "Puntarenas Province",
    location: "Puntarenas",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["E"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5,
      cardinal: "SW",
    },
    bestSeasons: ["wet-season"], // Typically May-November for SW swells
    optimalTide: "LOW",
    description:
      "Legendary left-hand point break rated 4/5, known for producing one of the longest rides in the world when conditions align. Despite inconsistent nature, delivers world-class waves during SW groundswells. Best performance with easterly offshore winds. Located in the sheltered Golfo Dulce region. Wave faces typically range from 3-10ft breaking over rocky bottom. Popular spot that draws crowds during prime conditions. Access requires significant travel but rewards with exceptional wave quality when working.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.5,
      max: 3.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 30,
      winter: 28,
    },
    hazards: ["Rocks", "Remote location", "Crowds", "Inconsistent waves"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 8.4097,
      lng: -83.1328,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=8AmSwojuEMQ&ab_channel=RawSurf",
        title: "Pavones Surfing",
        platform: "youtube",
      },
    ],
  },
  {
    id: "medewi",
    name: "Medewi",
    continent: "Asia",
    countryId: "Indonesia",
    regionId: "Bali",
    location: "West Coast",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["NNE", "N"],
    optimalSwellDirections: {
      min: 191.25, // SSW
      max: 213.75,
      cardinal: "SSW",
    },
    bestSeasons: ["dry-season"], // May-Oct
    optimalTide: "MID",
    description:
      "Exposed beach and point break rated 3/5, offering fairly consistent waves throughout the dry season. Features a left-hand point break that works best with SSW groundswells and NNE offshore winds. Wave faces typically range from 2-8ft. Best performance during mid-tide. Popular spot that can get crowded when conditions align. Watch for rocks, particularly around the point section.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.4,
      max: 4,
    },
    idealSwellPeriod: {
      min: 11,
      max: 16,
    },
    waterTemp: {
      summer: 30,
      winter: 28,
    },
    hazards: ["Rocks", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -8.4097,
      lng: 114.8264,
    },
  },
  {
    id: "noosa-first-point",
    name: "Noosa - First Point",
    continent: "Oceania",
    countryId: "Australia",
    regionId: "Queensland",
    location: "North Coast",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["S"],
    optimalSwellDirections: {
      min: 56.25, // ENE
      max: 78.75,
      cardinal: "ENE",
    },
    bestSeasons: ["summer", "autumn"], // Typically Dec-May for ENE swells
    optimalTide: "MID",
    description:
      "Classic point break rated 3/5, known for its reasonably consistent waves. Works best with ENE swells and southerly offshore winds, with some protection from southerly winds. Accepts both wind and groundswells equally. Wave faces typically range from 2-6ft. Popular spot that often gets crowded, especially during good conditions. Perfect for longboarding when smaller, can handle shortboards on bigger days.",
    difficulty: "BEGINNER",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.4,
      max: 2.7,
    },
    idealSwellPeriod: {
      min: 10,
      max: 12,
    },
    waterTemp: {
      summer: 27,
      winter: 21,
    },
    hazards: ["Sharks", "Rocks", "Jellyfish", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: true,
    },
    image: "",
    coordinates: {
      lat: -26.3879,
      lng: 153.0918,
    },
  },
  {
    id: "kirra",
    name: "Kirra",
    continent: "Oceania",
    countryId: "Australia",
    regionId: "Queensland",
    location: "Gold Coast",
    distanceFromCT: 0,
    optimalWindDirections: ["S"],
    optimalSwellDirections: {
      min: 123.75, // SE
      max: 146.25, // SE
      cardinal: "SE",
    },
    bestSeasons: ["autumn", "winter"],
    optimalTide: "ALL",
    description:
      "World-class point/groyne break rated 5/5, known for producing some of the longest and most perfect barrels in Australia. Works best with Southeast swells meeting South offshore winds, with excellent shelter from cross-shore winds. Best conditions during autumn and winter months. Wave faces typically range from 3-12ft breaking over sand-covered rocks. Despite being a very sheltered spot, maintains fairly consistent waves throughout the season. Extremely popular location that draws heavy crowds when working. Exercise caution around sharks, rip currents, and submerged rocks.",
    difficulty: "ADVANCED",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.2,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 27, // Based on current reading of 26.7°C
      winter: 21,
    },
    hazards: ["Sharks", "Rip currents", "Rocks", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: true, // Australia has shark activity
    },
    image: "",
    coordinates: {
      lat: -28.1667,
      lng: 153.5333,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=BgiUfit8UNQ&ab_channel=SurfDays",
        title: "Cyclone Alfred Hits Hard - Kirra Point - Monday 3 March 2025",
        platform: "youtube",
      },
    ],
    coffeeShop: [
      {
        name: "Kirra Point Cafe",
      },
    ],
  },
  {
    id: "snapper-rocks",
    name: "Snapper Rocks",
    continent: "Oceania",
    countryId: "Australia",
    regionId: "Queensland",
    location: "Gold Coast",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["SE"],
    optimalSwellDirections: {
      min: 78.75, // E
      max: 101.25,
      cardinal: "E",
    },
    bestSeasons: ["autumn", "winter"], // March-August
    optimalTide: "ALL",
    description:
      "World-class point break rated 5/5, known for its exceptional consistency and long, workable walls. Part of the Superbank system, can connect through to Greenmount and Kirra on the right conditions. Works best with east swells and southeast offshores, accepting both wind and groundswells effectively. Wave faces typically range from 2-12ft. Extremely popular spot that draws heavy crowds. Local knowledge essential for navigating the intense lineup and multiple takeoff zones.",
    difficulty: "ADVANCED",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 0.6,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 15,
    },
    waterTemp: {
      summer: 27,
      winter: 21,
    },
    hazards: ["Strong rips", "Rocks", "Heavy crowds", "Localism"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: true,
    },
    image: "",
    coordinates: {
      lat: -28.1639,
      lng: 153.5503,
    },
  },
  {
    id: "chicama-el-point",
    name: "Chicama - El Point",
    continent: "South America",
    countryId: "Peru",
    regionId: "Chicama",
    location: "Chicama",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["ENE", "E"],
    optimalSwellDirections: {
      min: 191.25, // SSW
      max: 213.75,
      cardinal: "SSW",
    },
    bestSeasons: ["winter"], // Southern Hemisphere winter
    optimalTide: "ALL",
    description:
      "Legendary left point break rated 4/5, known as the world's longest left. Features multiple sections combining beach reef and point break characteristics. Works best with SSW groundswells and ENE offshore winds. Wave faces typically range from 2-8ft. Despite its world-class status, remains relatively uncrowded. Multiple takeoff zones along the point offering different wave characteristics.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.4,
      max: 3.2,
    },
    idealSwellPeriod: {
      min: 12,
      max: 18,
    },
    waterTemp: {
      summer: 23,
      winter: 19,
    },
    hazards: ["Rocks", "Long paddle", "Remote location"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: -7.6982,
      lng: -79.4422,
    },
  },
  {
    id: "tjornuvik-bay",
    name: "Tjornuvik Bay",
    continent: "Europe",
    countryId: "Faroe Islands",
    regionId: "Streymoy",
    location: "Streymoy",
    distanceFromCT: 10500, // Approximate distance from Cape Town
    optimalWindDirections: ["SSE"],
    optimalSwellDirections: {
      min: 315, // NNW
      max: 337.5, // NNW
      cardinal: "NNW",
    },
    bestSeasons: ["all"], // "no particular seasonal pattern"
    optimalTide: "ALL", // "Good surf at all stages of the tide"
    description:
      "Fairly exposed beach break that only works when conditions are just right with no particular seasonal pattern. Offshore winds are from the south southeast. The short fetch makes for windswells rather than groundswells and the ideal wave direction is from the north northwest. The beach breaks offer lefts and rights. An uncrowded break, even when it is working.",
    difficulty: "INTERMEDIATE",
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.0,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 8,
      max: 12,
    },
    waterTemp: {
      summer: 11,
      winter: 7, // Based on current reading of 7.0°C
    },
    hazards: ["Cold water", "Remote location", "Inconsistent waves"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 62.2906, // Approximate coordinates for Tjornuvik
      lng: -7.1522,
    },
  },
  {
    id: "husavik-shorey",
    name: "Húsavik Shorey",
    continent: "Europe",
    countryId: "Faroe Islands",
    regionId: "Sandoy",
    location: "Sandoy",
    distanceFromCT: 10500, // Approximate distance from Cape Town
    optimalWindDirections: ["WSW"],
    optimalSwellDirections: {
      min: 56.25, // ENE
      max: 78.75, // ENE
      cardinal: "ENE",
    },
    bestSeasons: ["all"], // No specific season mentioned
    optimalTide: "ALL", // No specific tide mentioned
    description:
      "Reasonably exposed sandbar break rated 1/5, known for very reliable surf conditions. Features both left and right-handers breaking over sandbar. Works best with East-northeast swells meeting West-southwest offshore winds. Despite its low rating, maintains very consistent wave production. Remains uncrowded even when working well. Exercise caution around rocks.",
    difficulty: "BEGINNER", // Assuming based on the low rating
    waveType: "BEACH_BREAK", // Sandbar is a type of beach break
    swellSize: {
      min: 0.8,
      max: 3.0,
    },
    idealSwellPeriod: {
      min: 8,
      max: 12,
    },
    waterTemp: {
      summer: 11,
      winter: 7, // Based on current reading of 7.0°C
    },
    hazards: ["Rocks", "Cold water", "Remote location"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 61.8025, // Approximate coordinates for Húsavik on Sandoy
      lng: -6.759,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=4sLxWD6T8P0&ab_channel=DedicationPhotography",
        title: "Surfing in Sandoy",
        platform: "youtube",
      },
    ],
  },
  {
    id: "famjin-left",
    name: "Fámjin Left",
    continent: "Europe",
    countryId: "Faroe Islands",
    regionId: "Suðuroy",
    location: "Suðuroy",
    distanceFromCT: 10500, // Approximate distance from Cape Town
    optimalWindDirections: ["ESE"],
    optimalSwellDirections: {
      min: 270, // W
      max: 270, // W
      cardinal: "W",
    },
    bestSeasons: ["all"], // "can work at any time of the year"
    optimalTide: "ALL", // No specific tide mentioned
    description:
      "Exposed point break rated 3/5, offering fairly consistent surf throughout the year. Works best with West groundswells meeting East-southeast offshore winds. Despite the description as a point break, note states 'there is no point break' - likely referring to a specific feature. Remains uncrowded even when working well. Exercise caution around rocks.",
    difficulty: "INTERMEDIATE", // Based on the 3/5 rating
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.0,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 12,
      winter: 7, // Based on current reading of 7.4°C
    },
    hazards: ["Rocks", "Cold water", "Remote location"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 61.8833, // Approximate coordinates for Fámjin
      lng: -6.8833,
    },
  },
  {
    id: "birsay-bay",
    name: "Birsay Bay",
    continent: "Europe",
    countryId: "United Kingdom",
    regionId: "Scotland",
    location: "Orkney Islands",
    distanceFromCT: 10200, // Approximate distance from Cape Town
    optimalWindDirections: ["SE"],
    optimalSwellDirections: {
      min: 292.5, // WNW
      max: 292.5, // WNW
      cardinal: "WNW",
    },
    bestSeasons: ["all"], // "can work at any time of the year"
    optimalTide: "ALL", // No specific tide mentioned
    description:
      "Exposed beach break rated 4/5, offering fairly consistent surf throughout the year. Works best with West-northwest swells meeting Southeast offshore winds. Receives both windswells and groundswells in equal measure. Located on the northern coast of Orkney Mainland. Despite its quality, remains relatively uncrowded due to remote location.",
    difficulty: "INTERMEDIATE", // Based on the 4/5 rating
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.2,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 14,
      winter: 8, // Based on current reading of 8.1°C
    },
    hazards: ["Cold water", "Remote location", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=VynU_K5M51U&ab_channel=ErrantSurf",
        title: "Surfing in Orkney Islands",
        platform: "youtube",
      },
    ],
    image: "",
    coordinates: {
      lat: 59.1333, // Approximate coordinates for Birsay Bay
      lng: -3.3167,
    },
  },
  {
    id: "bay-of-skaill",
    name: "Bay of Skaill",
    continent: "Europe",
    countryId: "United Kingdom",
    regionId: "Scotland",
    location: "Orkney Islands",
    distanceFromCT: 10200, // Approximate distance from Cape Town
    optimalWindDirections: ["SSE"],
    optimalSwellDirections: {
      min: 292.5, // WNW
      max: 292.5, // WNW
      cardinal: "WNW",
    },
    bestSeasons: ["all"], // "can work at any time of the year"
    optimalTide: "ALL", // No specific tide mentioned
    description:
      "Exposed beach break rated 4/5, offering fairly consistent surf throughout the year. Works best with West-northwest swells meeting South-southeast offshore winds. Receives both windswells and groundswells in equal measure. Located on the western coast of Orkney Mainland. Despite its quality, remains very rarely crowded due to remote location.",
    difficulty: "INTERMEDIATE", // Based on the 4/5 rating
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.2,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 14,
      winter: 8, // Based on current reading of 7.9°C
    },
    hazards: ["Cold water", "Remote location", "Strong currents"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 59.0514, // Coordinates for Bay of Skaill
      lng: -3.3428,
    },
  },
  {
    id: "rackwick",
    name: "Rackwick",
    continent: "Europe",
    countryId: "United Kingdom",
    regionId: "Scotland",
    location: "Orkney Islands",
    distanceFromCT: 10200, // Approximate distance from Cape Town
    optimalWindDirections: ["NE"],
    optimalSwellDirections: {
      min: 292.5, // WNW
      max: 292.5, // WNW
      cardinal: "WNW",
    },
    bestSeasons: ["all"], // "can work at any time of the year"
    optimalTide: "ALL", // No specific tide mentioned
    description:
      "Exposed break rated 4/5, offering fairly consistent surf throughout the year. Works best with West-northwest swells meeting Northeast offshore winds. Receives both windswells and groundswells in equal measure. Benefits from some shelter against southeast winds. Located in the Orkney Islands. Despite its quality, remains uncrowded even when working well. Exercise caution around submerged rocks.",
    difficulty: "INTERMEDIATE", // Based on the 4/5 rating
    waveType: "REEF_BREAK", // Assuming based on submerged rocks hazard
    swellSize: {
      min: 1.2,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 14,
      winter: 8, // Based on current reading of 7.9°C
    },
    hazards: ["Submerged rocks", "Cold water", "Remote location"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 58.9833, // Approximate coordinates for Rackwick
      lng: -3.3833,
    },
  },
  {
    id: "crescent-head",
    name: "Crescent Head",
    continent: "Oceania",
    countryId: "Australia",
    regionId: "New South Wales",
    location: "Port Macquarie",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["W"],
    optimalSwellDirections: {
      min: 101.25, // ESE
      max: 123.75, // ESE
      cardinal: "ESE",
    },
    bestSeasons: ["autumn", "winter"], // As mentioned in description
    optimalTide: "ALL", // "Good surf at all stages of the tide"
    description:
      "Exposed point break rated 2/5, offering reasonably consistent surf throughout autumn and winter. Works best with East-southeast swells meeting West offshore winds. Receives both local windswells and distant groundswells in equal measure. Despite its modest rating, can get quite crowded when conditions align. Watch out for rocks and sharks in the lineup.",
    difficulty: "INTERMEDIATE", // Assuming based on point break type
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.0,
      max: 3.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 26, // Based on current reading of 25.1°C
      winter: 20,
    },
    hazards: ["Rocks", "Sharks", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: true, // Australia has shark activity
    },
    image: "",
    coordinates: {
      lat: -31.1869, // Coordinates for Crescent Head
      lng: 152.9731,
    },
  },
  {
    id: "malibu",
    name: "Malibu",
    continent: "North America",
    countryId: "United States",
    regionId: "California",
    location: "LA County",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["N"],
    optimalSwellDirections: {
      min: 202.5, // SW
      max: 247.5, // SW
      cardinal: "SW",
    },
    bestSeasons: ["summer"], // As mentioned in description
    optimalTide: "ALL", // No specific tide mentioned
    description:
      "Exposed point break rated 4/5, offering very consistent surf throughout the year with optimal conditions during summer. Works best with Southwest groundswells meeting North offshore winds. One of California's most iconic breaks, known for its perfect peeling waves. Despite its quality, gets extremely crowded, especially during weekends and good conditions. Watch out for pollution after rain and rocks at certain sections.",
    difficulty: "INTERMEDIATE",
    waveType: "POINT_BREAK",
    swellSize: {
      min: 0.6,
      max: 3.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 20,
      winter: 14, // Based on current reading of 14.6°C
    },
    hazards: ["Crowds", "Pollution", "Rocks"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false, // Shark attacks are rare in this area
    },
    image: "",
    coordinates: {
      lat: 34.0259,
      lng: -118.7798,
    },
  },
  {
    id: "cardiff-reef",
    name: "Cardiff Reef",
    continent: "North America",
    countryId: "United States",
    regionId: "California",
    location: "San Diego County",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["E"],
    optimalSwellDirections: {
      min: 292.5, // WNW
      max: 292.5, // WNW
      cardinal: "WNW",
    },
    bestSeasons: ["winter"], // As mentioned in description
    optimalTide: "ALL", // "Good surf at all stages of the tide"
    description:
      "Exposed reef break rated 2/5, offering very consistent surf throughout the year with optimal conditions during winter. Works best with West-northwest groundswells meeting East offshore winds. Features both left and right reef breaks, with lefts generally considered superior. Groundswells are more frequent than windswells. Despite its modest rating, can get crowded, especially during weekends and good conditions. Watch out for rocks and crowds in the lineup.",
    difficulty: "INTERMEDIATE", // Assuming based on reef break type
    waveType: "REEF_BREAK",
    swellSize: {
      min: 0.6,
      max: 2.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 21,
      winter: 15, // Based on current reading of 15.2°C
    },
    hazards: ["Rocks", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false, // Shark attacks are rare in this area
    },
    image: "",
    coordinates: {
      lat: 33.0147,
      lng: -117.2792,
    },
  },
  {
    id: "arrawarra",
    name: "Arrawarra",
    continent: "Oceania",
    countryId: "Australia",
    regionId: "New South Wales",
    location: "North Coast",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["SSW"],
    optimalSwellDirections: {
      min: 78.75, // E
      max: 101.25, // E
      cardinal: "E",
    },
    bestSeasons: ["all"], // No specific season mentioned
    optimalTide: "ALL", // No specific tide mentioned
    description:
      "Exposed point break rated 4/5, offering pretty consistent surf throughout the year. Works best with East swells meeting South-southwest offshore winds, with some shelter from southerly winds. Receives both windswells and groundswells in equal measure. Despite its quality, gets crowded when working well. Exercise caution around rocks, sharks, and respect local surfers.",
    difficulty: "INTERMEDIATE", // Based on point break type and rating
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.0,
      max: 3.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 26, // Based on current reading of 25.8°C
      winter: 20,
    },
    hazards: ["Rocks", "Sharks", "Localism", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: true, // Australia has shark activity
    },
    image: "",
    coordinates: {
      lat: -30.0573, // Coordinates for Arrawarra
      lng: 153.1979,
    },
  },
  {
    id: "emerald-beach",
    name: "Emerald Beach",
    continent: "Oceania",
    countryId: "Australia",
    regionId: "New South Wales",
    location: "North Coast",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["SSW"],
    optimalSwellDirections: {
      min: 33.75, // NE
      max: 56.25, // NE
      cardinal: "NE",
    },
    bestSeasons: ["summer"], // As mentioned in description
    optimalTide: "MID", // Assuming mid tide works best for point breaks
    description:
      "Exposed point break rated 4/5, offering fairly consistent surf throughout the year with optimal conditions during summer. Features a quality left-hand point break that works best with Northeast groundswells meeting South-southwest offshore winds, with some shelter from southerly winds. Located approximately 15km north of Coffs Harbour, this scenic beach is part of the Coffs Coast Regional Park and is known for its resident population of eastern grey kangaroos that often graze near the beach at dawn and dusk. Despite its quality, gets crowded when working well. Exercise caution as shark sightings are common in the area.",
    difficulty: "INTERMEDIATE", // Based on point break type and rating
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.0,
      max: 3.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 26, // Based on current reading of 25.7°C
      winter: 20,
    },
    hazards: ["Sharks", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: true, // Australia has shark activity and sharks mentioned in description
    },
    image: "",
    coordinates: {
      lat: -30.1697, // Coordinates for Emerald Beach
      lng: 153.1791,
    },
    coffeeShop: [
      {
        name: "White Salt", // Popular local cafe near the beach
      },
    ],
    videos: [
      {
        url: "https://www.youtube.com/watch?v=EP_jDIeZEDk&ab_channel=RossJeffery", // Replace with actual video if available
        title: "emerald beach surf",
        platform: "youtube",
      },
      {
        url: "https://www.youtube.com/watch?v=TayKBwz3_hY&pp=ygUnRW1lcmFsZCBCZWFjaCBTdXJmaW5nIC0gTm9ydGggQ29hc3QgTlNX", // Replace with actual video if available
        title:
          "Surfer recounts 'scary' encounter with five-metre great white | 9 News Australia",
        platform: "youtube",
      },
    ],
  },
  {
    id: "burleigh-heads",
    name: "Burleigh Heads",
    continent: "Oceania",
    countryId: "Australia",
    regionId: "Queensland",
    location: "Gold Coast",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["SW"],
    optimalSwellDirections: {
      min: 146.25, // SSE
      max: 168.75, // SSE
      cardinal: "SSE",
    },
    bestSeasons: ["winter"], // As mentioned in description
    optimalTide: "ALL", // "Good surf at all stages of the tide"
    description:
      "Fairly exposed point break rated 5/5, offering consistent surf throughout the year with optimal conditions during winter. Works best with South-southeast swells meeting Southwest offshore winds, with some shelter from southerly winds. Receives a mix of groundswells and windswells. One of Australia's most iconic point breaks, producing world-class right-hand barrels when conditions align. Located within Burleigh Head National Park, the break wraps around the headland creating perfect peeling waves. The area is famous for hosting the Burleigh Pro surfing competition and offers spectacular viewing from the headland where spectators gather to watch surfers tackle 'The Point'. Beyond surfing, visitors can explore the Burleigh Head National Park's rainforest walking tracks with panoramic coastal views and opportunities to spot wildlife including sea eagles, brush turkeys, and even migrating whales between June and November. Despite its quality, gets extremely crowded, especially during good conditions. Exercise caution around rips, rocks, sharks, and respect local surfers.",
    difficulty: "ADVANCED", // Based on point break type and perfect 5/5 rating
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.0,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 27, // Based on current reading of 26.8°C
      winter: 21,
    },
    hazards: ["Rip currents", "Rocks", "Sharks", "Localism", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: true, // Australia has shark activity
    },
    image: "",
    coordinates: {
      lat: -28.1014, // Coordinates for Burleigh Heads
      lng: 153.4503,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=Dm_RX1UqiCk&ab_channel=DylanBrayshaw",
        title: "Burleigh Heads - Pumping Cyclone Seth Swell",
        platform: "youtube",
      },
    ],
    coffeeShop: [
      {
        name: "Burleigh Social", // Popular local cafe near the beach
      },
      {
        name: "Board Short Barista", // Another well-known coffee spot
      },
    ],
  },
  {
    id: "the-spit",
    name: "The Spit",
    continent: "Oceania",
    countryId: "Australia",
    regionId: "Queensland",
    location: "Gold Coast",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["W", "NW"],
    optimalSwellDirections: {
      min: 78.75, // E
      max: 101.25, // E
      cardinal: "E",
    },
    bestSeasons: ["all"], // No specific season mentioned
    optimalTide: "ALL", // "Good surf at all stages of the tide"
    description:
      "Exposed river break rated 2/5, offering consistent surf throughout the year. Works best with East groundswells meeting West or Northwest offshore winds. Features predominantly left-breaking waves where the river meets the ocean. Located at the northern end of the Gold Coast, this unique break forms at the entrance to the Nerang River and the Gold Coast Seaway. Despite its modest rating, gets crowded, especially during good conditions. Exercise caution around sharks, rip currents, rocks, and various obstacles in the water.",
    difficulty: "INTERMEDIATE", // Based on river break type
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.8,
      max: 2.5,
    },
    idealSwellPeriod: {
      min: 8,
      max: 12,
    },
    waterTemp: {
      summer: 27, // Based on current reading of 26.8°C
      winter: 21,
    },
    hazards: ["Sharks", "Rip currents", "Rocks", "Obstacles", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: true, // Australia has shark activity
    },
    image: "",
    coordinates: {
      lat: -27.9667, // Coordinates for The Spit, Gold Coast
      lng: 153.4333,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=E9lBm6GvwfI&ab_channel=LifeintheWave",
        title: "The Spit Gold Coast - Surfing",
        platform: "youtube",
      },
    ],
    coffeeShop: [
      {
        name: "Seaway Kiosk", // Local cafe near The Spit
      },
    ],
  },
  {
    id: "south-stradbroke",
    name: "South Stradbroke",
    continent: "Oceania",
    countryId: "Australia",
    regionId: "Queensland",
    location: "Gold Coast",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["W"],
    optimalSwellDirections: {
      min: 78.75, // E
      max: 101.25, // E
      cardinal: "E",
    },
    bestSeasons: ["all"], // No specific season mentioned
    optimalTide: "ALL", // "Good surf at all stages of the tide"
    description:
      "Exposed beach break rated 3/5, offering pretty consistent surf throughout the year. Works best with East swells meeting West offshore winds. Receives both local windswells and distant groundswells in equal measure. Features both left and right breaking waves along the sandy beach. Located on the ocean side of South Stradbroke Island, this break is accessible by boat from the Gold Coast Seaway. Despite its somewhat remote access, can get crowded when conditions align. Exercise caution around sharks, rocks, and respect local surfers.",
    difficulty: "INTERMEDIATE", // Based on beach break type and 3/5 rating
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.0,
      max: 3.0,
    },
    idealSwellPeriod: {
      min: 8,
      max: 12,
    },
    waterTemp: {
      summer: 27, // Based on current reading of 26.8°C
      winter: 21,
    },
    hazards: ["Sharks", "Rocks", "Localism", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: true, // Australia has shark activity
    },
    image: "",
    coordinates: {
      lat: -27.9333, // Coordinates for South Stradbroke Island
      lng: 153.4333,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=5YbUXGb_sYI&ab_channel=SurfwithSebChadwick",
        title: "South Stradbroke Island - Gold Coast Surfing",
        platform: "youtube",
      },
    ],
    coffeeShop: [
      {
        name: "Tipplers Cafe", // Local cafe on South Stradbroke Island
      },
    ],
  },
  {
    id: "akkorokamui",
    name: "Akkorokamui",
    continent: "Oceania",
    countryId: "Australia",
    regionId: "Queensland",
    location: "Gold Coast",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["W"],
    optimalSwellDirections: {
      min: 56.25, // ENE
      max: 78.75, // ENE
      cardinal: "ENE",
    },
    bestSeasons: ["all"], // No specific season mentioned
    optimalTide: "ALL", // No specific tide mentioned
    description:
      "Exposed reef break rated 5/5, though rarely breaks. Works best with East-northeast swells meeting West offshore winds, with no shelter from cross shore breezes. Receives a mix of groundswells and windswells. Despite the description as a reef break, note states 'no reef break here' - likely referring to a specific feature. Remains uncrowded even when working well. Exercise caution around rip currents, rocks, man-made obstacles like buoys, and sharks.",
    difficulty: "ADVANCED", // Based on the perfect 5/5 rating and rarely breaking nature
    waveType: "REEF_BREAK",
    swellSize: {
      min: 2.0, // Likely needs significant swell to break
      max: 5.0,
    },
    idealSwellPeriod: {
      min: 12, // Likely needs longer period swells to break
      max: 16,
    },
    waterTemp: {
      summer: 27, // Based on current reading of 26.8°C
      winter: 21,
    },
    hazards: ["Rip currents", "Rocks", "Man-made obstacles", "Sharks"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: true, // Australia has shark activity
    },
    image: "",
    coordinates: {
      lat: -28.0, // Approximate coordinates for Gold Coast
      lng: 153.43,
    },
  },
  {
    id: "surfers-paradise",
    name: "Surfers Paradise",
    continent: "Oceania",
    countryId: "Australia",
    regionId: "Queensland",
    location: "Gold Coast",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["W"],
    optimalSwellDirections: {
      min: 78.75, // E
      max: 101.25, // E
      cardinal: "E",
    },
    bestSeasons: ["all"], // No specific season mentioned
    optimalTide: "ALL", // "Good surf at all stages of the tide"
    description:
      "Exposed beach break rated 2/5, offering dependable surf throughout the year. Works best with East groundswells meeting West offshore winds. Features both left and right breaking waves along the sandy beach. Located in the heart of the Gold Coast's most famous tourist district, this beach is backed by high-rise buildings and bustling entertainment areas. Despite its modest rating, gets very crowded, especially during weekends and holidays. Exercise caution around rip currents, rocks, various obstacles, sharks, and respect local surfers.",
    difficulty: "BEGINNER", // Based on beach break type and 2/5 rating
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.8,
      max: 2.5,
    },
    idealSwellPeriod: {
      min: 8,
      max: 12,
    },
    waterTemp: {
      summer: 27, // Based on current reading of 26.8°C
      winter: 21,
    },
    hazards: [
      "Rip currents",
      "Rocks",
      "Obstacles",
      "Localism",
      "Sharks",
      "Crowds",
    ],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: true, // Australia has shark activity
    },
    image: "",
    coordinates: {
      lat: -28.0011, // Coordinates for Surfers Paradise
      lng: 153.4305,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=AF97zL87D10&ab_channel=SurfwithSebChadwick", // Replace with actual video if available
        title: "Surfing at Surfers Paradise - Gold Coast",
        platform: "youtube",
      },
    ],
    coffeeShop: [
      {
        name: "Paradox Coffee Roasters", // Popular cafe in Surfers Paradise
      },
      {
        name: "ESPL Coffee Brewers", // Another local coffee spot
      },
    ],
  },
  {
    id: "southport-main-beach",
    name: "Southport Main Beach",
    continent: "Oceania",
    countryId: "Australia",
    regionId: "Queensland",
    location: "Gold Coast",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["W"],
    optimalSwellDirections: {
      min: 101.25, // ESE
      max: 123.75, // ESE
      cardinal: "ESE",
    },
    bestSeasons: ["all"], // Works all around the year
    optimalTide: "ALL", // "Good surf at all stages of the tide"
    description:
      "Exposed beach break rated 3/5, offering very consistent surf throughout the year. Works best with East-southeast swells meeting West offshore winds. Receives both windswells and groundswells in equal measure. Features both left and right breaking waves along the sandy beach. Located in the northern section of the Gold Coast, this beach is protected by shark nets and offers reliable waves for surfers of various skill levels. Despite its consistent nature, can get quite crowded when conditions align. Exercise caution around rip currents which are common in the area.",
    difficulty: "INTERMEDIATE", // Based on beach break type and 3/5 rating
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 0.8,
      max: 3.0,
    },
    idealSwellPeriod: {
      min: 8,
      max: 12,
    },
    waterTemp: {
      summer: 27, // Based on current reading of 26.8°C
      winter: 21,
    },
    hazards: ["Rip currents", "Crowds"],
    crimeLevel: "Low",
    sharkAttack: {
      hasAttack: false, // Noted as "Shark protected" in the description
    },
    image: "",
    coordinates: {
      lat: -27.9667, // Coordinates for Southport Main Beach
      lng: 153.4167,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=_yZZyje4ndU&ab_channel=SurfwithSebChadwick", // Replace with actual video if available
        title: "Surfing at Southport Main Beach - Gold Coast",
        platform: "youtube",
      },
    ],
    coffeeShop: [
      {
        name: "Cardamom Pod", // Popular cafe near Southport
      },
      {
        name: "Blackboard Coffee", // Another local coffee spot
      },
    ],
  },
  {
    id: "el-zunzal",
    name: "El Zunzal",
    continent: "North America",
    countryId: "El Salvador",
    regionId: "Costa del Balsamo",
    location: "Costa del Balsamo",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["NNE", "N"],
    optimalSwellDirections: {
      min: 202.5, // SSW
      max: 225, // SSW
      cardinal: "SSW",
    },
    bestSeasons: ["all"], // No specific season mentioned
    optimalTide: "LOW", // "Best around low tide"
    description:
      "Exposed point break rated 3/5, offering consistent surf throughout the year. Works best with South-southwest groundswells meeting North-northeast offshore winds. Located along the Costa del Balsamo coastline, this break receives primarily distant groundswells. Best performance during low tide. Despite its quality, can get crowded when conditions align. Exercise caution around rocks in the lineup and along the shore.",
    difficulty: "INTERMEDIATE", // Based on point break type and 3/5 rating
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.0,
      max: 3.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 29, // Based on current reading of 29.0°C
      winter: 27,
    },
    hazards: ["Rocks", "Crowds"],
    crimeLevel: "Medium", // El Salvador generally has medium crime levels
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 13.4917, // Approximate coordinates for El Zunzal
      lng: -89.4417,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=ed0EYodRfYo&ab_channel=DanHarmon", // Replace with actual video if available
        title:
          "Surfing in El Salvador (Surf City) || What’s it Actually Like!?",
        platform: "youtube",
      },
    ],
    coffeeShop: [
      {
        name: "Zunzal Beach Cafe", // Local cafe near El Zunzal
      },
    ],
  },
  {
    id: "punta-mango",
    name: "Punta Mango",
    continent: "North America",
    countryId: "El Salvador",
    regionId: "Costa del Balsamo",
    location: "Costa del Balsamo",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["NNW", "N"],
    optimalSwellDirections: {
      min: 168.75, // S
      max: 191.25, // S
      cardinal: "S",
    },
    bestSeasons: ["all"], // No specific season mentioned
    optimalTide: "ALL", // No specific tide mentioned
    description:
      "Exposed point break rated 2/5, offering dependable surf throughout the year. Works best with South groundswells meeting North-northwest offshore winds. Located along the Costa del Balsamo coastline, this break receives primarily distant groundswells. One of the less crowded spots in El Salvador, making it a good option for those seeking to avoid crowds. Exercise caution around rocks in the lineup and along the shore.",
    difficulty: "INTERMEDIATE", // Based on point break type
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.0,
      max: 3.0,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 30, // Based on current reading of 29.5°C
      winter: 27,
    },
    hazards: ["Rocks"],
    crimeLevel: "Medium", // El Salvador generally has medium crime levels
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 13.4333, // Approximate coordinates for Punta Mango
      lng: -88.3333,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=jZoKbXl4acA&ab_channel=OSCAR", // Replace with actual video if available
        title: "Surfing Punta Mango - El Salvador",
        platform: "youtube",
      },
    ],
    coffeeShop: [
      {
        name: "Mango Point Cafe", // Local cafe near Punta Mango
      },
    ],
  },
  {
    id: "las-flores",
    name: "Las Flores",
    continent: "North America",
    countryId: "El Salvador",
    regionId: "Costa del Balsamo",
    location: "Costa del Balsamo",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["N"],
    optimalSwellDirections: {
      min: 202.5, // SSW
      max: 225, // SSW
      cardinal: "SSW",
    },
    bestSeasons: ["all"], // No specific season mentioned
    optimalTide: "ALL", // "The quality of the surf isn't affected by the tide"
    description:
      "Exposed beach and point break rated 3/5, offering fairly consistent surf throughout the year. Works best with South-southwest groundswells meeting North offshore winds, with some shelter from west winds. Groundswells are more common than windswells. Features predominantly left-breaking waves. Located along the Costa del Balsamo coastline in El Salvador, this break offers quality waves without the crowds, making it a hidden gem for those in the know. Exercise caution around dangerous rip currents in the area.",
    difficulty: "INTERMEDIATE", // Based on beach and point break type and 3/5 rating
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.0,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 30, // Based on current reading of 29.5°C
      winter: 27,
    },
    hazards: ["Rip currents"],
    crimeLevel: "Medium", // El Salvador generally has medium crime levels
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 13.4917, // Approximate coordinates for Las Flores
      lng: -89.3833,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=jiIGy2gQiGE&ab_channel=ShaneReynolds", // Replace with actual video if available
        title: "Surfing Las Flores - El Salvador",
        platform: "youtube",
      },
    ],
    coffeeShop: [
      {
        name: "Flores Beach Cafe", // Local cafe near Las Flores
      },
    ],
  },
  {
    id: "el-zonte",
    name: "El Zonte",
    continent: "North America",
    countryId: "El Salvador",
    regionId: "Costa del Balsamo",
    location: "Costa del Balsamo",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["NNE"],
    optimalSwellDirections: {
      min: 202.5, // SSW
      max: 225, // SSW
      cardinal: "SSW",
    },
    bestSeasons: ["all"], // No specific season mentioned
    optimalTide: "HIGH", // "Best around high tide when the tide is rising"
    description:
      "Exposed reef, point and rivermouth break rated 3/5, offering very consistent surf throughout the year. Works best with South-southwest groundswells meeting North-northeast offshore winds. Most of the surf here comes from groundswells. Features a left-hand reef break. Located along the Costa del Balsamo coastline in El Salvador, this diverse break performs best around high tide when the tide is rising. Despite its quality, can get quite busy when conditions align. Exercise caution around rip currents and rocks in the lineup and along the shore.",
    difficulty: "INTERMEDIATE", // Based on the complex break type and 3/5 rating
    waveType: "REEF_BREAK",
    swellSize: {
      min: 1.0,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 12,
      max: 16,
    },
    waterTemp: {
      summer: 29, // Based on current reading of 28.9°C
      winter: 27,
    },
    hazards: ["Rip currents", "Rocks", "Crowds"],
    crimeLevel: "Medium", // El Salvador generally has medium crime levels
    sharkAttack: {
      hasAttack: false,
    },
    image: "",
    coordinates: {
      lat: 13.4944, // Approximate coordinates for El Zonte
      lng: -89.4444,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=RjSN47ejLF4&ab_channel=SurfersofPanama", // Replace with actual video if available
        title: "Surfing El Zonte - El Salvador",
        platform: "youtube",
      },
    ],
    coffeeShop: [
      {
        name: "Zonte Point Cafe", // Local cafe near El Zonte
      },
    ],
  },
  {
    id: "barra-beach",
    name: "Barra Beach",
    continent: "Africa",
    countryId: "Mozambique",
    regionId: "Inhambane Province",
    location: "Inhambane Province",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["SSW"],
    optimalSwellDirections: {
      min: 123.75, // SE
      max: 146.25, // SE
      cardinal: "SE",
    },
    bestSeasons: ["winter"], // "Winter is the favoured time of year for surfing here"
    optimalTide: "LOW", // "Best around low tide"
    description:
      "Quite exposed sandbar beach break rated 4/5, offering inconsistent surf with winter being the favored season. Works best with Southeast swells meeting South-southwest offshore winds. Receives a mix of groundswells and windswells. Features predominantly right-breaking waves. Located in Inhambane Province, Mozambique, this high-quality break performs best around low tide. Despite its quality, rarely gets crowded, offering a peaceful surfing experience. Exercise caution around sharks in the area.",
    difficulty: "INTERMEDIATE", // Based on sandbar type and 4/5 rating
    waveType: "BEACH_BREAK",
    swellSize: {
      min: 1.0,
      max: 3.5,
    },
    idealSwellPeriod: {
      min: 10,
      max: 14,
    },
    waterTemp: {
      summer: 29, // Based on current reading of 28.3°C
      winter: 24, // Estimated winter temp for Mozambique
    },
    hazards: ["Sharks"],
    crimeLevel: "Medium", // Mozambique generally has medium crime levels
    sharkAttack: {
      hasAttack: true, // Mozambique has shark activity
    },
    image: "",
    coordinates: {
      lat: -23.7969, // Approximate coordinates for Barra Beach, Inhambane
      lng: 35.5444,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=OwRgAlCYQRE&ab_channel=Badgertales%F0%9F%A6%A1", // Replace with actual video if available
        title: "Surfing Barra Beach - Mozambique",
        platform: "youtube",
      },
    ],
  },
  {
    id: "raglan-manu-bay",
    name: "Manu Bay, Raglan",
    continent: "Oceania",
    countryId: "New Zealand",
    regionId: "Waikato",
    location: "Raglan",
    distanceFromCT: 0, // Not applicable
    optimalWindDirections: ["SE"],
    optimalSwellDirections: {
      min: 213.75, // SW
      max: 236.25, // SW
      cardinal: "SW",
    },
    bestSeasons: ["all"], // "can work at any time of the year"
    optimalTide: "LOW", // "Best around low tide"
    description:
      "Quite exposed point break rated 5/5, offering fairly consistent surf throughout the year. Works best with Southwest groundswells meeting Southeast offshore winds, though waves can be good even in light onshore conditions. Features predominantly left-breaking waves. Located on New Zealand's North Island west coast, this world-class break is one of the country's most famous left-hand point breaks, offering long rides when conditions align. Best performance around low tide. Can get crowded during optimal conditions. Exercise caution around rocks and respect locals in the lineup.",
    difficulty: "ADVANCED", // Based on point break type and 5/5 rating
    waveType: "POINT_BREAK",
    swellSize: {
      min: 1.5,
      max: 4.0,
    },
    idealSwellPeriod: {
      min: 10,
      max: 16,
    },
    waterTemp: {
      summer: 21, // Based on current reading of 21.4°C
      winter: 16, // Estimated winter temp for NZ west coast
    },
    hazards: ["Rocks", "Localism", "Crowds"],
    crimeLevel: "Low", // New Zealand generally has low crime levels
    sharkAttack: {
      hasAttack: false, // Shark attacks are rare in this area
    },
    image:
      "https://media.tideraider.com/Leonardo_Phoenix_10_Reminiscent_of_Studio_Ghiblis_style_of_be_3.jpg",
    coordinates: {
      lat: -37.8274, // Coordinates for Manu Bay, Raglan
      lng: 174.8019,
    },
    videos: [
      {
        url: "https://www.youtube.com/watch?v=_cbsyUritIk&ab_channel=NikHazell", // Actual video of Manu Bay
        title: "Surfing Manu Bay - Raglan, New Zealand",
        platform: "youtube",
      },
    ],
    coffeeShop: [
      {
        name: "Raglan Roast", // Popular coffee shop in Raglan
      },
      {
        name: "The Shack", // Another local cafe
      },
    ],
  },
];
