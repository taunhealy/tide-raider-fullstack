import { Metadata } from "next";
import NotificationsContainer from "@/app/components/notifications/NotificationsContainer";

export const metadata: Metadata = {
  title: "Notifications | Dashboard",
  description: "View your alert notifications",
};

export default function NotificationsPage() {
  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#FDFDFD] py-16">
      <div className="container mx-auto px-4 md:pl-[81px] max-w-7xl">
        <div className="md:pl-[54px]">
          {/* Header Section - Dashboard Command Center Style */}
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-brand-3 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-3">System Signals</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Tactical <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500">Notifications</span>
            </h1>
            <p className="text-slate-500 mt-3 max-w-lg font-medium text-lg">
              Historical record of tactical alerts and regional broadcast deployments.
            </p>
          </header>

          {/* Content Container */}
          <div className="bg-white border border-gray-100 rounded-[32px] p-6 sm:p-10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.04)]">
            <NotificationsContainer />
          </div>
        </div>
      </div>
    </div>
  );
}
