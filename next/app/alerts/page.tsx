import { AlertsList } from "@/app/components/alerts/AlertsList";
import { Button } from "@/app/components/ui/Button";
import { Bell } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Alerts | Surf Forecast",
  description: "Manage your surf forecast alerts",
};

export default function AlertsPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="container mx-auto px-4 max-w-6xl py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg">
                <Bell className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Condition Monitor</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Your Alerts
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Automated notifications for your preferred surf conditions.
            </p>
          </div>
          
          <Link href="/alerts/new">
            <button 
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-900 bg-gray-900 text-white hover:bg-gray-800 font-bold text-sm tracking-tight shadow-xl transition-all duration-300 active:scale-95"
            >
              <Bell className="h-4 w-4" />
              <span>Create New Alert</span>
            </button>
          </Link>
        </div>

        <div className="bg-white/40 backdrop-blur-sm rounded-[2.5rem] p-4 md:p-8 border border-white/60 shadow-sm">
           <AlertsList />
        </div>
      </div>
    </div>
  );
}
