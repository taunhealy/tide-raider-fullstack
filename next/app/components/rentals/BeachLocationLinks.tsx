"use client";

import { useState } from "react";
import { Beach, beachData } from "@/app/types/beaches";
import BeachDetailsModal from "@/app/components/BeachDetailsModal";

interface BeachLocationLinksProps {
  beaches: {
    id: string;
    name: string;
    region?: {
      name: string;
    };
  }[];
}

export default function BeachLocationLinks({
  beaches,
}: BeachLocationLinksProps) {
  const [selectedBeach, setSelectedBeach] = useState<Beach | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBeachClick = (beachId: string) => {
    // Find the beach in the beachData array
    const beach = beachData.find((beach) => beach.id === beachId);

    if (beach) {
      setSelectedBeach(beach);
      setIsModalOpen(true);
    } else {
      console.error(`Beach with ID ${beachId} not found in beachData`);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {beaches.map((beach) => (
          <button
            key={beach.id}
            onClick={() => handleBeachClick(beach.id)}
            className="bg-[var(--color-bg-secondary)] px-3 py-1 rounded-full text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors cursor-pointer font-primary"
          >
            {beach.name}
          </button>
        ))}
      </div>

      {selectedBeach && (
        <BeachDetailsModal
          beach={selectedBeach}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          isSubscribed={true} // You might want to pass this as a prop from the parent
          onSubscribe={() => (window.location.href = "/pricing")}
        />
      )}
    </>
  );
}
