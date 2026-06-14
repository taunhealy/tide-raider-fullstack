"use client";

import { useSubscriptionStatus } from "@/app/hooks/useSubscriptionStatus";
import Link from "next/link";
import { Bell, Lock, Waves, CheckCircle } from "lucide-react";
import { Button } from "@/app/components/ui/Button";

export function EmptyAlertsState() {
  const { isPremium } = useSubscriptionStatus();
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 min-h-[450px] bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 text-center max-w-2xl mx-auto mt-8 shadow-sm">
      <div className="w-14 h-14 bg-gradient-to-br from-blue-700 to-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 text-white">
        <Bell className="w-6 h-6 animate-bounce" />
      </div>
      
      <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
        Never Miss the Perfect Swell
      </h2>
      
      <p className="text-sm text-slate-500 font-medium mb-8 max-w-md mx-auto leading-relaxed">
        Set up custom alerts to get notified exactly when your favourite spots turn on. 
      </p>
      
      {/* Value Props */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left w-full max-w-lg mb-8">
        <div className="flex items-start gap-3 p-4 bg-white/60 border border-slate-100 rounded-2xl transition-all hover:shadow-sm">
          <Waves className="w-5 h-5 text-brand-blue-primary mt-0.5 shrink-0" />
          <div>
            <span className="block font-black text-slate-800 text-xs uppercase tracking-wider mb-1">Custom Conditions</span>
            <span className="text-[11px] text-slate-500 font-medium leading-relaxed block">Alerts for specific forecast conditions and log entries</span>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 bg-white/60 border border-slate-100 rounded-2xl transition-all hover:shadow-sm">
          <CheckCircle className="w-5 h-5 text-brand-blue-primary mt-0.5 shrink-0" />
          <div>
            <span className="block font-black text-slate-800 text-xs uppercase tracking-wider mb-1">Instant Notification</span>
            <span className="text-[11px] text-slate-500 font-medium leading-relaxed block">Email/WhatsApp updates when forecast matches your Alerts</span>
          </div>
        </div>
      </div>

      <Link href="/dashboard/alerts/new">
        <Button 
          variant="action"
          size="sm"
          className="whitespace-nowrap px-8 h-10 shadow-md active:scale-95 uppercase tracking-widest font-black text-[10px]"
        >
          Create Your First Alert
        </Button>
      </Link>
    </div>
  );
}
