import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./sections/Footer";
import NewsBannerWrapper from "./components/NewsBannerWrapper";
import AppProviders from "./providers/AppProviders";
import { Metadata } from "next";
// Removed NextAuth imports - we use backend auth now
import { AuthCallbackHandler } from "./components/AuthCallbackHandler";
import { ReferralTracker } from "./components/ReferralTracker";
import { Suspense } from "react";

// Load all weights explicitly for Inter
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
});

// Load all weights explicitly for Montserrat
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-secondary",
  display: "swap",
  preload: true,
  fallback: ["Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title:
    "Tide Raider - Daily Surf Forecast, Surf Report & Surf Spot Suggestions",
  description:
    "Read the surf report and find the best surf spots in Africa, based on current surf conditions",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
};

// Force dynamic rendering for client-side auth
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // We use backend auth, so no need to fetch session server-side
  // SessionProvider will handle auth client-side
  const session = null;

  // Don't fetch beaches server-side - causes timeouts on Vercel
  // Beaches are already fetched client-side via API routes, so this is not needed
  // Passing empty array - AppProviders will handle client-side fetching
  const beaches: any[] = [];

  return (
    <html
      lang="en"
      className={`${inter.variable} ${montserrat.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Force preload critical fonts */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap"
        />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;900&display=swap"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;900&display=swap"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className="min-h-screen flex flex-col font-primary"
        suppressHydrationWarning
      >

        <AuthCallbackHandler />
        <Suspense fallback={null}>
          <ReferralTracker />
        </Suspense>
        <AppProviders session={session} initialBeaches={beaches}>
          <NewsBannerWrapper />
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
