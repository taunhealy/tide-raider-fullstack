"use client";

import { useState } from "react";
import { beachData } from "@/app/types/beaches";
import BeachDetailsModal from "@/app/components/BeachDetailsModal";

interface BeachLocation {
  beach: {
    id: string;
    name: string;
    location: string;
    country: string;
  };
}

export function BeachLocationsList({ beaches }: { beaches: BeachLocation[] }) {
  const [selectedBeach, setSelectedBeach] = useState<
    (typeof beachData)[0] | null
  >(null);

  return (
    <>
      <div className="space-y-4">
        {beaches.map((connection) => (
          <button
            key={connection.beach.id}
            className="w-full text-left"
            onClick={() => {
              const foundBeach = beachData.find(
                (b) => b.id === connection.beach.id
              );
              setSelectedBeach(foundBeach || null);
            }}
          >
            <div className="border border-[var(--color-border-light)] rounded-lg p-4 hover:shadow-md transition-shadow">
              <p className="font-medium text-[var(--color-text-primary)] font-primary">
                {connection.beach.name}
              </p>
              <p className="text-small text-[var(--color-text-secondary)] font-primary">
                {connection.beach.location}, {connection.beach.country}
              </p>
            </div>
          </button>
        ))}
      </div>

      {selectedBeach && (
        <BeachDetailsModal
          beach={selectedBeach}
          isOpen={!!selectedBeach}
          onClose={() => setSelectedBeach(null)}
          isSubscribed={true}
          onSubscribe={() => {}}
        />
      )}
    </>
  );
}
