import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-primary" });

export const metadata: Metadata = {
  title: "Luxury Adventure Rentals | Supercars, Yachts & More",
  description:
    "Book premium supercars, yachts, jet-skis, and 4x4 campers for your next South African adventure.",
  keywords: [
    "supercar rental",
    "yacht rental",
    "jet ski rental",
    "4x4 camper",
    "luxury rentals",
    "South Africa",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-primary antialiased`}>
        {children}
      </body>
    </html>
  );
}

