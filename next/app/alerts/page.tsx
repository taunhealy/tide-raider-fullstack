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
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-semibold font-primary text-[var(--color-text-primary)]">
            Alerts
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] font-primary">
            Get notified when surf conditions match your preferences
          </p>
        </div>
        <Link href="/alerts/new" className="sm:flex-shrink-0">
          <Button 
            className="w-full sm:w-auto font-primary flex items-center gap-2 justify-center"
            size="default"
          >
            <Bell className="h-4 w-4" />
            New Alert
          </Button>
        </Link>
      </div>

      <AlertsList />
    </div>
  );
}
