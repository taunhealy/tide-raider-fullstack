import { Metadata } from "next";
import NotificationsContainer from "@/app/components/notifications/NotificationsContainer";

export const metadata: Metadata = {
  title: "Notifications | Dashboard",
  description: "View your alert notifications",
};

export default function NotificationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-primary font-semibold mb-6">
        Notifications
      </h1>
      <NotificationsContainer />
    </div>
  );
}
