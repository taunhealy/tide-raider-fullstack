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
        <Bell className="w-12 h-12 text-[var(--color-tertiary)]" />
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
            <span className="text-xs text-[var(--color-text-secondary)]">Email updates when forecast matches your Alerts</span>
          </div>
        </div>
      </div>

      <Link href="/alerts/new">
        <Button size="lg" className="font-primary px-8 bg-[var(--color-tertiary)] hover:bg-[var(--color-ui-accent)] text-black">
          Create Your First Alert
        </Button>
      </Link>
    </div>
  );
}
