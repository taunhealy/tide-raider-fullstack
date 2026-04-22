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
          {/* Header Section - Pricing Page Style */}
          <div className="mb-12 border-b border-gray-100 pb-8">
            <h1 className="text-[32px] leading-[40px] font-bold tracking-tight text-black mb-2">
              Notifications
            </h1>
            <p className="text-[16px] leading-[24px] font-normal text-black opacity-60">
              Tactical alert history and global broadcast signals.
            </p>
          </div>

          {/* Content Container */}
          <div className="bg-white border border-gray-100 rounded-[32px] p-6 sm:p-10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.04)]">
            <NotificationsContainer />
          </div>
        </div>
      </div>
    </div>
  );
}
