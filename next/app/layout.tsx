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
import { AuthCallbackHandler } from "./components/AuthCallbackHandler";

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
export const dynamic = "force-dynamic";

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
  // Note: In production, this may fail if DATABASE_URL is not accessible (e.g., pgbouncer only works from Fly network)
  // The app will work fine without initial beach data - beaches will be fetched client-side via API
  let beaches: BeachWithRelations[] = [];
  try {
    // Only try to fetch if DATABASE_URL is available and accessible
    if (
      process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.includes("pgbouncer")
    ) {
      beaches = await getAllBeaches();
    } else {
      console.log("Skipping initial beach fetch - using backend API instead");
    }
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
      </head>
      <body
        className="min-h-screen flex flex-col font-primary"
        suppressHydrationWarning
      >
        <AuthCallbackHandler />
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
