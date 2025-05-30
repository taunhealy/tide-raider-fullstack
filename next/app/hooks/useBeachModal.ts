// hooks/useBeachModal.ts
import { useState, useCallback, useEffect } from "react";
import type { Beach } from "@/app/types/beaches";

export function useBeachModal(initialBeaches: Beach[]) {
  const [selectedBeach, setSelectedBeach] = useState<Beach | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleBeachClick = useCallback((beach: Beach) => {
    const params = new URLSearchParams(window.location.search);
    params.set("beach", beach.id);
    window.history.pushState({}, "", `?${params.toString()}`);

    setSelectedBeach(beach);
    setIsModalOpen(true);
  }, []);
  
  const handleCloseBeachModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedBeach(null);
  }, []);

  // URL parameter synchronization
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const beachId = params.get("beach");

    if (beachId) {
      const beach = initialBeaches.find((b) => b.id === beachId);
      if (beach) {
        setSelectedBeach(beach);
        setIsModalOpen(true);
      }
    }
  }, [initialBeaches]);

  return {
    selectedBeach,
    isModalOpen,
    handleBeachClick,
    handleCloseBeachModal
  };
}