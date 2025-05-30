import { Metadata } from "next";
import AdvertisingForm from "../components/advertising/AdvertisingForm";

export const metadata: Metadata = {
  title: "Advertising - Surf Check",
  description: "Advertise your business on Surf Check",
};

export default function AdvertisingPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 font-primary">
        Advertise on Tide Raider
      </h1>
      <p className="mb-8 font-primary">
        Reach surfers in your area with targeted advertising.
      </p>

      <AdvertisingForm />
    </main>
  );
}
