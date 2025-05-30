"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/app/lib/utils";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/app/components/ui/tabs";

type Adventure = {
  id: string;
  title: string;
  location: string;
  description: string;
  imageUrl: string;
  rating: number;
  price: string;
  url: string;
};

type AdventureCategory = {
  id: string;
  label: string;
  emoji: string;
  adventures: Adventure[];
};

const ADVENTURE_CATEGORIES: AdventureCategory[] = [
  {
    id: "kayaking",
    label: "Kayaking",
    emoji: "🚣",
    adventures: [
      {
        id: "kay-1",
        title: "Ocean Kayaking Tour",
        location: "Cape Town",
        description: "Explore the coastline with expert guides",
        imageUrl: "https://media.tideraider.com/kayaking-2.webp",
        price: "R650",
        url: "/adventures/kayaking/ocean-tour",
        rating: 4.7,
      },
      {
        id: "kay-2",
        title: "Sunset Paddle Experience",
        location: "Langebaan",
        description: "Peaceful evening kayaking with stunning views",
        imageUrl: "https://media.tideraider.com/kayaking-1.webp",
        rating: 4.7,
        price: "R550",
        url: "/adventures/kayaking/sunset-paddle",
      },
      {
        id: "kay-3",
        title: "Hout Bay Coastal Kayaking",
        location: "Hout Bay",
        description: "Explore the coast of Chappies via Kayak!",
        imageUrl: "https://media.tideraider.com/kayaking-3.webp",
        rating: 4.7,
        price: "R550",
        url: "/adventures/kayaking/sunset-paddle",
      },
    ],
  },
  {
    id: "diving",
    label: "Diving",
    emoji: "🤿",
    adventures: [
      {
        id: "div-1",
        title: "Reef Diving Adventure",
        location: "Sodwana Bay",
        description: "Discover vibrant coral reefs and marine life",
        imageUrl: "https://media.tideraider.com/diving-1.webp",
        rating: 4.9,
        price: "R1200",
        url: "/adventures/diving/reef-adventure",
      },
      {
        id: "div-2",
        title: "Shipwreck Exploration",
        location: "False Bay",
        description: "Dive among historic shipwrecks with certified guides",
        imageUrl:
          "https://media.tideraider.com/kiril-dobrev-8cQpL8kGqso-unsplash.jpg",
        rating: 4.6,
        price: "R1500",
        url: "/adventures/diving/shipwreck",
      },
      {
        id: "div-3",
        title: "Night Diving Experience",
        location: "Aliwal Shoal",
        description:
          "Explore the underwater world after dark with specialized equipment",
        imageUrl: "https://media.tideraider.com/diving-3.webp",
        rating: 4.8,
        price: "R1800",
        url: "/adventures/diving/night-dive",
      },
    ],
  },
  {
    id: "paragliding",
    label: "Paragliding",
    emoji: "🪂",
    adventures: [
      {
        id: "para-1",
        title: "Coastal Paragliding",
        location: "Lion's Head",
        description: "Soar above the coastline with breathtaking views",
        imageUrl: "https://media.tideraider.com/paragliding-1.webp",
        rating: 4.9,
        price: "R1800",
        url: "/adventures/paragliding/coastal",
      },
      {
        id: "para-2",
        title: "Tandem Mountain Flight",
        location: "Hermanus",
        description: "Experience the thrill with a professional pilot",
        imageUrl: "https://media.tideraider.com/paragliding-2.webp",
        rating: 4.7,
        price: "R1600",
        url: "/adventures/paragliding/tandem",
      },
      {
        id: "para-3",
        title: "Cape Town Paragliding Tour",
        location: "Cape Town",
        description: "Glide through the sky as the sun sets over the ocean",
        imageUrl: "https://media.tideraider.com/paragliding-3.webp",
        rating: 4.8,
        price: "R1750",
        url: "/adventures/paragliding/sunset-tour",
      },
    ],
  },
  {
    id: "van-life",
    label: "Van Life",
    emoji: "🚐",
    adventures: [
      {
        id: "van-1",
        title: "Coastal Road Trip",
        location: "Garden Route",
        description:
          "Explore South Africa's stunning coastline in a fully equipped camper van",
        imageUrl: "https://media.tideraider.com/van-life-1.webp",
        rating: 4.8,
        price: "R1800/day",
        url: "/adventures/van-life/coastal-trip",
      },
      {
        id: "van-2",
        title: "Mountain Explorer Package",
        location: "Drakensberg",
        description:
          "Adventure through mountain passes with comfortable overnight stays",
        imageUrl: "https://media.tideraider.com/van-life-2.webp",
        rating: 4.6,
        price: "R2100/day",
        url: "/adventures/van-life/mountain-explorer",
      },
    ],
  },
];

export default function AdventureExperiences({
  selectedRegion,
}: {
  selectedRegion: string;
}) {
  const [activeTab, setActiveTab] = useState(ADVENTURE_CATEGORIES[0].id);
  const [isMounted, setIsMounted] = useState(false);
  const errorImagePath = "https://media.tideraider.com/placeholder.jpg";
  const [adventureAds, setAdventureAds] = useState<any[]>([]);

  // Use a ref to track if the effect has run
  const effectRan = useRef(false);

  // Prevent hydration errors by only rendering after component mounts
  useEffect(() => {
    // Only run the effect once in development mode
    if (effectRan.current === false) {
      setIsMounted(true);
      effectRan.current = true;
    }

    return () => {
      // For strict mode in development
      if (process.env.NODE_ENV === "development") {
        effectRan.current = false;
      }
    };
  }, []);

  // Update fetch to include region parameter
  useEffect(() => {
    async function fetchAdventureAds() {
      try {
        if (!selectedRegion) {
          setAdventureAds([]);
          return;
        }

        console.log("Fetching adventure ads for region:", selectedRegion);

        // First get the region ID if we have a region name
        let regionId = selectedRegion;

        // Check if selectedRegion is a name rather than ID
        if (
          selectedRegion &&
          !selectedRegion.match(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          )
        ) {
          // Fetch region ID by name
          const regionsResponse = await fetch(
            `/api/regions?name=${encodeURIComponent(selectedRegion)}`
          );
          const regionsData = await regionsResponse.json();

          if (regionsData.length > 0) {
            regionId = regionsData[0].id;
          } else {
            console.warn(`Region not found for name: ${selectedRegion}`);
            setAdventureAds([]);
            return;
          }
        }

        // Now fetch ads with the correct region ID
        const response = await fetch(
          `/api/advertising/ads?type=adventure&regionId=${regionId}`
        );
        const data = await response.json();
        console.log("Received adventure ads:", data);

        if (data.ads) {
          setAdventureAds(data.ads);
          console.log("Set adventure ads:", data.ads);

          // Set active tab to the category of the first ad if there are any ads
          if (data.ads.length > 0 && data.ads[0].category) {
            const adCategory = data.ads[0].category.toLowerCase();
            // Check if this category exists in our ADVENTURE_CATEGORIES
            const categoryExists = ADVENTURE_CATEGORIES.some(
              (cat) => cat.id.toLowerCase() === adCategory
            );

            if (categoryExists) {
              setActiveTab(adCategory);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching adventure ads:", error);
      }
    }

    fetchAdventureAds();
  }, [selectedRegion]);

  // Add a useEffect to log when ads change
  useEffect(() => {
    console.log("Adventure ads state updated:", adventureAds);
  }, [adventureAds]);

  // Return null or a loading state during server-side rendering
  if (!isMounted) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6 min-h-[400px]"></div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[18px] font-semibold text-gray-800 font-primary">
          Adventure Experiences
        </h3>
      </div>

      <Tabs
        defaultValue={activeTab}
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="flex flex-wrap gap-2 mb-4">
          {ADVENTURE_CATEGORIES.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="font-primary text-sm"
              title={category.label}
            >
              {category.emoji}
            </TabsTrigger>
          ))}
        </TabsList>

        {ADVENTURE_CATEGORIES.map((category) => (
          <TabsContent
            key={category.id}
            value={category.id}
            className="space-y-4"
          >
            {/* Sponsored adventure ads */}
            {adventureAds.map((ad) => {
              // Check if this category should show this ad
              const shouldShow =
                ad.category.toLowerCase() === category.id.toLowerCase();

              if (!shouldShow) return null;

              return (
                <Link
                  href={ad.linkUrl}
                  key={ad.id}
                  className="block"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    // Record ad click
                    fetch(`/api/advertising/click?id=${ad.id}`, {
                      method: "POST",
                    });
                    console.log("Ad clicked:", ad);
                  }}
                >
                  <div className="group flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                    <div className="relative h-40 w-full">
                      <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
                      {ad.imageUrl ? (
                        <Image
                          src={ad.imageUrl}
                          alt={ad.title || ad.companyName}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = errorImagePath;
                          }}
                        />
                      ) : (
                        <Image
                          src={errorImagePath}
                          alt={ad.title || ad.companyName}
                          fill
                          className="object-cover"
                        />
                      )}
                      <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-primary">
                        Sponsored
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-primary font-medium text-gray-900 group-hover:text-black/80 transition-colors">
                          {ad.title}
                        </h4>
                      </div>
                      <div className="flex items-center mb-2">
                        <span className="text-sm text-gray-600 font-primary">
                          {ad.companyName}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 font-primary line-clamp-2">
                        {ad.description || "Sponsored adventure experience"}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Regular adventure listings - now displayed after sponsored ads */}
            {category.adventures.map((adventure) => (
              <Link href={adventure.url} key={adventure.id} className="block">
                <div className="group flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <div className="relative h-40 w-full">
                    <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
                    <Image
                      src={adventure.imageUrl}
                      alt={adventure.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = errorImagePath;
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-primary font-medium text-gray-900 group-hover:text-black/80 transition-colors">
                        {adventure.title}
                      </h4>
                      <span className="font-primary text-sm font-semibold text-black/80">
                        {adventure.price}
                      </span>
                    </div>
                    <div className="flex items-center mb-2">
                      <span className="text-sm text-gray-600 font-primary">
                        {adventure.location}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 font-primary line-clamp-2">
                      {adventure.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
