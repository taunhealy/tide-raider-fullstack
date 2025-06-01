"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "./ui/Button";
import { useSubscription } from "../providers/SubscriptionProvider";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "../lib/utils";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { handleSignIn } from "../lib/auth-utils";
import Image from "next/image";
import NotificationBadge from "./notifications/NotificationBadge";

const NAVIGATION_ITEMS = [
  { href: "/raid", label: "Raid" },
  { href: "/rentals", label: "Rentals" },
  { href: "/raidlogs", label: "Log Book" },
  { href: "/chronicles", label: "Chronicles" },
  { href: "/alerts", label: "Alerts" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
];

export default function Navbar() {
  const { data: session, status } = useSession({
    required: false,
  });
  const { isSubscribed } = useSubscription();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-white">
      <div
        className={cn(
          "flex justify-between items-center px-4 md:px-8 py-4 bg-white",
          "relative z-50"
        )}
      >
        <Link
          href="/"
          onClick={(e) => {
            e.preventDefault();
            router.push("/");
            router.refresh();
            setIsMenuOpen(false); // Close mobile menu if open
          }}
          className="font-semibold hover:text-[var(--color-bg-tertiary)] transition-all duration-300"
        >
          <h6 className="heading-6 text-[var(--color-text-primary)]">
            Tide Raider
          </h6>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <nav>
            <ul className="flex gap-2 items-center">
              {NAVIGATION_ITEMS.map((link) => (
                <li key={link.href} className="px-2 py-2">
                  <Link
                    href={link.href}
                    className={cn(
                      "link-nav",
                      pathname === link.href && "link-nav-active"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex gap-4 items-center">
            {session ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-full relative"
                  >
                    <Image
                      src={session.user?.image || "/default-avatar.png"}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <NotificationBadge />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 font-primary">
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-primary"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/notifications"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-primary"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Notifications
                      </Link>
                      <Link
                        href={`/profile/${session.user.id}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-primary"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Profile
                      </Link>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => signOut()}
                  className="transition-all duration-300 font-primary"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => handleSignIn()}
                className="transition-all duration-300 font-primary"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-4">
          {session && (
            <div className="flex items-center gap-2">
              <Image
                src={session.user?.image || "/default-avatar.png"}
                alt="Profile"
                width={32}
                height={32}
                className="rounded-full"
              />
            </div>
          )}
          {session ? (
            <Button
              variant="outline"
              onClick={() => signOut()}
              className="transition-all duration-300 font-primary"
            >
              Sign Out
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => handleSignIn()}
              className="transition-all duration-300 font-primary"
            >
              Sign In
            </Button>
          )}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-gray-50 rounded-md transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <>
          <nav className="md:hidden absolute w-full px-4 py-4 bg-white border-t border-[var(--color-border-light)] z-50">
            <ul className="space-y-2">
              {session && (
                <>
                  <li className="px-2 py-3">
                    <div className="flex items-center gap-3 mb-4">
                      <Image
                        src={session.user?.image || "/default-avatar.png"}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <span className="font-primary text-[var(--color-text-primary)]">
                        {session.user?.name}
                      </span>
                    </div>
                    <div className="border-t border-[var(--color-border-light)] mt-3" />
                  </li>
                  <li className="px-2 py-3">
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "block font-primary text-[var(--color-text-primary)] hover:text-[var(--color-text-primary)] hover:font-semibold",
                        "transition-all duration-300"
                      )}
                    >
                      Dashboard
                    </Link>
                    <div className="border-t border-[var(--color-border-light)] mt-3" />
                  </li>
                  <li className="px-2 py-3">
                    <Link
                      href="/dashboard/notifications"
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "block font-primary text-[var(--color-text-primary)] hover:text-[var(--color-text-primary)] hover:font-semibold",
                        "transition-all duration-300"
                      )}
                    >
                      Notifications
                    </Link>
                    <div className="border-t border-[var(--color-border-light)] mt-3" />
                  </li>
                  <li className="px-2 py-3">
                    <Link
                      href={`/profile/${session.user.id}`}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "block font-primary text-[var(--color-text-primary)] hover:text-[var(--color-text-primary)] hover:font-semibold",
                        "transition-all duration-300"
                      )}
                    >
                      Profile
                    </Link>
                    <div className="border-t border-[var(--color-border-light)] mt-3" />
                  </li>
                </>
              )}
              {NAVIGATION_ITEMS.map((link) => (
                <li key={link.href} className="px-2 py-3">
                  <Link
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "block font-primary text-[var(--color-text-primary)] hover:text-[var(--color-text-primary)] hover:font-semibold",
                      "transition-all duration-300",
                      pathname === link.href &&
                        "font-semibold text-[var(--color-text-primary)]"
                    )}
                  >
                    {link.label}
                  </Link>
                  <div className="border-t border-[var(--color-border-light)] mt-3" />
                </li>
              ))}
            </ul>
          </nav>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
        </>
      )}
    </header>
  );
}
