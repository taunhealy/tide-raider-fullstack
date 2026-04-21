"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const category = searchParams.get("category") || "WEEKLY_INTEL";

  const categoryLabels: Record<string, string> = {
    WEEKLY_INTEL: "Weekly Strategic Intelligence",
    TACTICAL_ALERTS: "Tactical Condition Alerts",
    PROMOTIONAL: "Promotional Intelligence",
    SYSTEM_UPDATES: "System Status Updates",
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-mono relative overflow-hidden">
      {/* Tactical Background Elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>
        <div className="grid grid-cols-12 h-full w-full">
            {[...Array(12)].map((_, i) => (
                <div key={i} className="border-r border-white/5 h-full"></div>
            ))}
        </div>
      </div>

      <div className="relative z-10 max-w-md w-full bg-zinc-950 border border-zinc-800 p-8 rounded-lg shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-cyan-500 rounded flex items-center justify-center text-black font-black text-xl">
            TR
          </div>
          <div className="text-xl font-black tracking-tighter uppercase">
            Tide <span className="text-cyan-400">Raider</span>
          </div>
        </div>

        {success ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/40 rounded-full flex items-center justify-center mb-6 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-black mb-4 text-center">COMMUNICATION TERMINATED</h1>
            <p className="text-zinc-400 text-sm mb-8 text-center leading-relaxed">
              Target confirmed. You have been successfully unsubscribed from 
              <span className="text-cyan-400 block mt-1 font-bold">[{categoryLabels[category] || category}]</span>
            </p>

            <div className="space-y-4">
              <Link 
                href="/raid"
                className="block w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black py-4 rounded transition-all text-center uppercase tracking-widest text-xs"
              >
                Access Dashboard
              </Link>
              <Link 
                href="/settings"
                className="block w-full border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-bold py-4 rounded transition-all text-center uppercase tracking-widest text-xs"
              >
                Manage Preferences
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-black mb-4 text-red-500">SIGNATURE INVALID</h1>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
              Unable to process unsubscription request. The security token provided is invalid or has expired.
            </p>
            <Link 
              href="/settings"
              className="block w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-4 rounded transition-all text-center uppercase tracking-widest text-xs"
            >
              Manual Settings Override
            </Link>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-zinc-900 text-[10px] text-zinc-600 uppercase tracking-widest flex justify-between">
          <span>Sector: Western Cape</span>
          <span>Status: Verified</span>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-black text-cyan-500 flex items-center justify-center font-mono">
            INITIALIZING DECRYPTION...
        </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
