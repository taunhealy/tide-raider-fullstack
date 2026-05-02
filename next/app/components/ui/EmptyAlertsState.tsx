"use client";

import { useSubscriptionStatus } from "@/app/hooks/useSubscriptionStatus";
import Link from "next/link";
import { Bell, Lock, Waves, CheckCircle } from "lucide-react";
import { Button } from "@/app/components/ui/Button";

export function EmptyAlertsState() {
  const { isPremium } = useSubscriptionStatus();
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-light)] shadow-sm text-center max-w-2xl mx-auto mt-8">
      <div className="bg-[var(--color-component-icon-bg)] p-4 rounded-full mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 256 256" className="text-[var(--color-tertiary)]">
          <path d="M221.8,175.94C216.25,166.12,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.13-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3 font-primary">
        Never Miss the Perfect Swell
      </h2>
      
      <p className="text-[var(--color-text-secondary)] mb-8 max-w-md mx-auto font-primary leading-relaxed">
        Set up custom alerts to get notified exactly when your favourite spots turn on. 
      </p>
      
      {/* Value Props */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left w-full max-w-lg mb-8">
        <div className="flex items-start gap-3 p-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-light)] rounded-lg">
          <Waves className="w-5 h-5 text-[var(--color-tertiary)] mt-0.5" />
          <div>
            <span className="block font-semibold text-[var(--color-text-primary)] text-sm">Custom Conditions</span>
            <span className="text-xs text-[var(--color-text-secondary)]">Alerts for specific forecast conditions and log entries</span>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-light)] rounded-lg">
          <CheckCircle className="w-5 h-5 text-[var(--color-tertiary)] mt-0.5" />
          <div>
            <span className="block font-semibold text-[var(--color-text-primary)] text-sm">Instant Notification</span>
            <span className="text-xs text-[var(--color-text-secondary)]">Email/Whatsapp    updates when forecast matches your Alerts</span>
          </div>
        </div>
      </div>

      <Link href="/dashboard/alerts/new">
        <Button 
          variant="action"
          size="sm"
          className="whitespace-nowrap px-8 h-10 shadow-md active:scale-95 uppercase tracking-widest font-black text-xs"
        >
          Create Your First Alert
        </Button>
      </Link>
    </div>
  );
}
