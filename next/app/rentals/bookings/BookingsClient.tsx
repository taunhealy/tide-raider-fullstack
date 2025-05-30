"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/app/lib/utils";

export function BookingsClient({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState<"my-bookings" | "rental-bookings">(
    "my-bookings"
  );

  return (
    <div className="max-w-7xl mx-auto font-primary">
      <div className="flex justify-between items-center mb-6">
        <h1 className="heading-4">Bookings</h1>
        <Link href="/rentals" className="btn-tertiary px-4 py-2 rounded-md">
          Browse Rentals
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--color-border-light)] mb-6">
        <div className="flex space-x-8">
          <TabButton
            isActive={activeTab === "my-bookings"}
            onClick={() => setActiveTab("my-bookings")}
          >
            My Bookings
          </TabButton>
          <TabButton
            isActive={activeTab === "rental-bookings"}
            onClick={() => setActiveTab("rental-bookings")}
          >
            Rental Bookings
          </TabButton>
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-4">
        {activeTab === "my-bookings" ? (
          <MyBookingsContent />
        ) : (
          <RentalBookingsContent />
        )}
      </div>
    </div>
  );
}

function TabButton({
  children,
  isActive,
  onClick,
}: {
  children: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "font-primary text-[16px] py-4 px-1 border-b-2 transition-colors duration-200",
        isActive
          ? "border-[var(--color-tertiary)] text-[var(--color-text-primary)]"
          : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-medium)]"
      )}
    >
      {children}
    </button>
  );
}

function MyBookingsContent() {
  return (
    <div>
      <p className="text-main mb-4">
        These are bookings you've made for other people's rentals.
      </p>

      {/* Placeholder for bookings list */}
      <div className="bg-[var(--color-bg-secondary)] p-8 rounded-md text-center">
        <p className="text-[var(--color-text-secondary)]">
          You don't have any bookings yet.
        </p>
        <Link
          href="/rentals"
          className="btn-tertiary inline-block mt-4 px-4 py-2 rounded-md"
        >
          Browse Rentals
        </Link>
      </div>
    </div>
  );
}

function RentalBookingsContent() {
  return (
    <div>
      <p className="text-main mb-4">
        These are bookings others have made for your rentals.
      </p>

      {/* Placeholder for bookings list */}
      <div className="bg-[var(--color-bg-secondary)] p-8 rounded-md text-center">
        <p className="text-[var(--color-text-secondary)]">
          You don't have any rental bookings yet.
        </p>
        <Link
          href="/rentals/my-rentals"
          className="btn-tertiary inline-block mt-4 px-4 py-2 rounded-md"
        >
          Manage My Rentals
        </Link>
      </div>
    </div>
  );
}
