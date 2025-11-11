"use client";

import { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function RentalsLayout({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Handle authentication for protected routes
  if (
    status === "unauthenticated" &&
    (pathname.includes("/my-rentals") ||
      pathname.includes("/requests") ||
      pathname.includes("/bookings"))
  ) {
    router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
