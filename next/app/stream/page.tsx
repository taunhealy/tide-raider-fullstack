import LiveStreamDashboard from "@/app/components/stream/LiveStreamDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Surf Intel | Tide Raider",
  description: "Real-time surf intelligence dashboard for Long Beach, Muizenberg, Witsands, and Jeffreys Bay.",
};

export default function StreamPage() {
  return (
    <main className="fixed inset-0 z-[9999] bg-black overflow-hidden flex flex-col">
      <LiveStreamDashboard />
    </main>
  );
}
