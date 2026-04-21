"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      console.log(`[Referral] 🔗 Referral code detected: ${ref}`);
      
      // Check if we already set this in this session to avoid double toast
      const alreadySet = sessionStorage.getItem("ref-detected");
      if (!alreadySet) {
        toast.info("Referral Active", { 
          description: "Welcome to Tide Raider! You've joined via a squad recruit link.",
          icon: "🌊",
          duration: 6000
        });
        sessionStorage.setItem("ref-detected", "true");
      }

      // Store in cookie for 7 days
      const expires = new Date();
      expires.setDate(expires.getDate() + 7);
      
      // Set cookie using document.cookie for simplicity in client component
      document.cookie = `referral-code=${ref}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    }
  }, [searchParams]);

  return null;
}
