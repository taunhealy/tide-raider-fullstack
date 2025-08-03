"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/app/lib/utils";

type Sponsor = {
  id: string;
  title: string;
  companyName: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  location: string;
};

const SPONSORS: Sponsor[] = [
  {
    id: "sponsor-1",
    title: "Premium Surf Equipment",
    companyName: "WaveRider Pro",
    description:
      "High-quality surfboards, wetsuits, and accessories for every level of surfer",
    imageUrl: "https://media.tideraider.com/sponsor-1.webp",
    linkUrl: "https://waveriderpro.com",
    location: "Cape Town",
  },
  {
    id: "sponsor-2",
    title: "Surf Lessons & Coaching",
    companyName: "Surf Academy SA",
    description:
      "Professional surf instruction for beginners to advanced surfers",
    imageUrl: "https://media.tideraider.com/sponsor-2.webp",
    linkUrl: "https://surfacademysa.com",
    location: "Durban",
  },
  {
    id: "sponsor-3",
    title: "Beach Accommodation",
    companyName: "Coastal Retreats",
    description: "Luxury beachfront accommodation with stunning ocean views",
    imageUrl: "https://media.tideraider.com/sponsor-3.webp",
    linkUrl: "https://coastalretreats.co.za",
    location: "Jeffreys Bay",
  },
  {
    id: "sponsor-4",
    title: "Surf Photography",
    companyName: "Ocean Lens",
    description: "Professional surf photography and videography services",
    imageUrl: "https://media.tideraider.com/sponsor-4.webp",
    linkUrl: "https://oceanlens.co.za",
    location: "Port Elizabeth",
  },
  {
    id: "sponsor-5",
    title: "Surf Travel Packages",
    companyName: "Surf Adventures",
    description: "Curated surf trips to the best breaks in South Africa",
    imageUrl: "https://media.tideraider.com/sponsor-5.webp",
    linkUrl: "https://surfadventures.co.za",
    location: "Multiple Locations",
  },
];

export default function Sponsors() {
  const [isMounted, setIsMounted] = useState(false);
  const errorImagePath = "https://media.tideraider.com/placeholder.jpg";

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
          Sponsors
        </h3>
      </div>

      <div className="space-y-4">
        {/* Sponsor ads */}
        {SPONSORS.map((sponsor) => (
          <Link
            href={sponsor.linkUrl}
            key={sponsor.id}
            className="block"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              console.log("Sponsor clicked:", sponsor);
            }}
          >
            <div className="group flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="relative h-40 w-full">
                <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
                {sponsor.imageUrl ? (
                  <Image
                    src={sponsor.imageUrl}
                    alt={sponsor.title || sponsor.companyName}
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
                    alt={sponsor.title || sponsor.companyName}
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
                    {sponsor.title}
                  </h4>
                </div>
                <div className="flex items-center mb-2">
                  <span className="text-sm text-gray-600 font-primary">
                    {sponsor.companyName}
                  </span>
                </div>
                <p className="text-sm text-gray-600 font-primary line-clamp-2">
                  {sponsor.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
