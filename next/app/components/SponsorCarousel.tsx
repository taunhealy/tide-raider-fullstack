// app/components/SponsorCarousel.tsx
"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { gsap } from "gsap";

interface Sponsor {
  id: string;
  name: string;
  logo: string;
  link: string;
}

export default function SponsorCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: sponsors = [] } = useQuery({
    queryKey: ["sponsors"],
    queryFn: async () => {
      const response = await fetch("/api/sponsors");
      if (!response.ok) throw new Error("Failed to fetch sponsors");
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  useEffect(() => {
    if (sponsors.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sponsors.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [sponsors.length]);

  useEffect(() => {
    if (sponsors.length === 0) return;

    const currentSponsor = document.querySelector(`[data-sponsor-index="${currentIndex}"]`);
    if (!currentSponsor) return;

    gsap.fromTo(
      currentSponsor,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
    );

    return () => {
      gsap.to(currentSponsor, { opacity: 0, y: -20, duration: 0.3 });
    };
  }, [currentIndex, sponsors.length]);

  if (sponsors.length === 0) return null;

  return (
    <div className="fixed bottom-9 left-4 z-40 bg-white rounded-lg shadow-lg p-3 border border-gray-200 w-48">
      <h4 className="text-xs font-semibold font-primary text-[var(--color-primary)] mb-2">
        Sponsored by
      </h4>
      <div className="relative h-12">
        {sponsors.map((sponsor: Sponsor, index: number) => (
          <a
            key={sponsor.id}
            href={sponsor.link}
            target="_blank"
            rel="noopener noreferrer"
            data-sponsor-index={index}
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={sponsor.logo}
              alt={sponsor.name}
              className="max-h-8 max-w-full object-contain"
            />
          </a>
        ))}
      </div>
    </div>
  );
}