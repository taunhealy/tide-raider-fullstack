"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "./ui/Button";
import { useSubscription } from "../providers/SubscriptionProvider";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "../lib/utils";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { handleSignIn } from "../lib/auth-utils";
import Image from "next/image";
import NotificationBadge from "./notifications/NotificationBadge";

// Keep navigation items at top level for easy editing
const NAVIGATION_ITEMS = [
  { href: "/raid", label: "Raid" },
  { href: "/raidlogs", label: "Logs" },
  { href: "/alerts", label: "Alerts" },
  { href: "/blog", label: "Blog" },
] as const;

export default function Navbar() {
  const { data: session, status } = useSession();
  const { isSubscribed } = useSubscription();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until authentication is checked
  if (status === "loading" || !mounted) {
    return null; // Or a loading spinner
  }

  // Simple function to render profile image consistently
  const ProfileImage = () => {
    if (!session?.user?.image) return null;

    return (
      <Image
        key={session.user.image}
        src={session.user.image}
        alt="Profile"
        width={32}
        height={32}
        className="rounded-full"
      />
    );
  };

  // Simple function to render auth button consistently
  const AuthButton = () => {
    return session ? (
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
        onClick={(e) => {
          e.preventDefault();
          handleSignIn(window.location.pathname);
        }}
        className="transition-all duration-300 font-primary"
      >
        Sign In
      </Button>
    );
  };

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
            <div className="relative">
              {session && (
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-full relative"
                >
                  <ProfileImage />
                  <NotificationBadge />
                </button>
              )}

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
                    href={`/profile/${session!.user.id}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-primary"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Profile
                  </Link>
                </div>
              )}
            </div>
            <AuthButton />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-4">
          {session && (
            <div className="flex items-center gap-2">
              <ProfileImage />
            </div>
          )}
          <AuthButton />
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
                      <ProfileImage />
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
