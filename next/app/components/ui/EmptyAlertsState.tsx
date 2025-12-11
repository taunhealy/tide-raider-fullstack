"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Bell, Lock, Waves, CheckCircle } from "lucide-react";
import { Button } from "@/app/components/ui/Button";

export function EmptyAlertsState() {
  const { data: session } = useSession();
  
  // Check if user is subscribed (premium or has a subscription tier)
  const isSubscribed = session?.user?.isSubscribed;
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl border border-gray-100 shadow-sm text-center max-w-2xl mx-auto mt-8">
      <div className="bg-blue-50 p-4 rounded-full mb-6">
        <Bell className="w-12 h-12 text-blue-500" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-3 font-primary">
        Never Miss the Perfect Swell
      </h2>
      
      <p className="text-gray-600 mb-8 max-w-md mx-auto font-primary leading-relaxed">
        Set up custom alerts to get notified exactly when your favorite spots turn on. 
        Track swell height, wind direction, and period effortlessly.
      </p>
      
      {/* Value Props */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left w-full max-w-lg mb-8">
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <Waves className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <span className="block font-semibold text-gray-900 text-sm">Custom Conditions</span>
            <span className="text-xs text-gray-500">Alerts for specific wave height & wind</span>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <span className="block font-semibold text-gray-900 text-sm">Instant Notification</span>
            <span className="text-xs text-gray-500">Email updates when forecast matches</span>
          </div>
        </div>
      </div>

      {isSubscribed ? (
        <Link href="/alerts/new">
          <Button size="lg" className="font-primary px-8">
            Create Your First Alert
          </Button>
        </Link>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Link href="/pricing">
            <Button size="lg" className="font-primary px-8 gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-none">
              <Lock className="w-4 h-4" />
              Subscribe to Unlock Alerts
            </Button>
          </Link>
          <p className="text-xs text-gray-500">
            Start your premium journey today
          </p>
        </div>
      )}
    </div>
  );
}
