import "./globals.css";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/sections/Footer";
import NewsBannerWrapper from "@/app/components/NewsBannerWrapper";
import AIChatWidget from "@/app/components/AIChatWidget";
import AppProviders from "@/app/providers/AppProviders";
import { Metadata } from "next";
import { AuthCallbackHandler } from "@/app/components/AuthCallbackHandler";
import { ReferralTracker } from "@/app/components/ReferralTracker";
import { Suspense } from "react";

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
  const session = null;
  const beaches: any[] = [];

  return (
    <html
      lang="en"
      className="antialiased"
      suppressHydrationWarning
    >
      <head>
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
          <AIChatWidget />
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
