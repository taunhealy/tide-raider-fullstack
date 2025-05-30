"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/app/lib/utils";
import { useSession } from "next-auth/react";

interface RentalsLayoutProps {
  children: ReactNode;
}

export default function RentalsLayout({ children }: RentalsLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  // Only run authentication check on client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle authentication redirect
  useEffect(() => {
    if (
      isClient &&
      status === "unauthenticated" &&
      (pathname.includes("/my-rentals") ||
        pathname.includes("/requests") ||
        pathname.includes("/bookings"))
    ) {
      // Only redirect for protected routes
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, isClient, pathname]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="border-b border-[var(--color-border-light)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex overflow-x-auto py-4">
            <NavLinks />
          </nav>
        </div>
      </div>
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

function NavLinks() {
  const pathname = usePathname();

  const links = [
    { href: "/rentals", label: "All Rentals" },
    { href: "/rentals/my-rentals", label: "My Rentals" },
    { href: "/rentals/requests", label: "Rental Requests" },
    { href: "/rentals/bookings", label: "Bookings" },
  ];

  return (
    <ul className="flex space-x-8">
      {links.map((link) => {
        const isActive =
          link.href === "/rentals"
            ? pathname === "/rentals" ||
              (pathname.startsWith("/rentals/") &&
                !links.find(
                  (l) => l.href !== "/rentals" && pathname.startsWith(l.href)
                ))
            : pathname.startsWith(link.href);

        return (
          <li key={link.href}>
            <Link
              href={link.href}
              className={cn(
                "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium font-primary",
                isActive
                  ? "border-[var(--color-tertiary)] text-[var(--color-text-primary)]"
                  : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-medium)]"
              )}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
