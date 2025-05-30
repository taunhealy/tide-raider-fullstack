"use client";

import { Button } from "@/app/components/ui/Button";

interface Tab {
  id: string;
  label: string;
}

interface DashboardTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function DashboardTabs({
  tabs,
  activeTab,
  onTabChange,
}: DashboardTabsProps) {
  return (
    <div className="flex flex-row gap-2 sm:gap-4 mb-6">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant={activeTab === tab.id ? "default" : "outline"}
          onClick={() => onTabChange(tab.id)}
          className="w-full sm:w-auto font-primary"
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}
