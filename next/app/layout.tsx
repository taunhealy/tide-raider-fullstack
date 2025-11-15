import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./sections/Footer";
import NewsBannerWrapper from "./components/NewsBannerWrapper";
import AppProviders from "./providers/AppProviders";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { getAllBeaches, type BeachWithRelations } from "@/app/lib/beachService";

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

// Force dynamic rendering since we use getServerSession which requires headers
export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error("Error getting session in layout:", error);
    session = null;
  }

  // Fetch beaches from database for initial data
  let beaches: BeachWithRelations[] = [];
  try {
    beaches = await getAllBeaches();
  } catch (error) {
    console.error("Error fetching beaches in layout:", error);
    // Continue with empty array - app will still work, just without initial beach data
    beaches = [];
  }

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

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/android-chrome-192x192.png"
        />
      </head>
      <body
        className="min-h-screen flex flex-col font-primary"
        suppressHydrationWarning
      >
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
