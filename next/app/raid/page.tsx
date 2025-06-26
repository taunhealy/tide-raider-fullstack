import BeachContainer from "@/app/components/BeachContainer";
import { BeachProvider } from "@/app/context/BeachContext";

export default function RaidPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      <div className="container mx-auto px-4 py-8">
        <BeachContainer />
      </div>
    </div>
  );
}
