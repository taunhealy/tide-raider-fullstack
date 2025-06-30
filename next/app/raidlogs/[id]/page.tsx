import RaidLogDetails from "@/app/components/raid-logs/RaidLogDetails";

export default function RaidLogPage({ params }: { params: { id: string } }) {
  return (
    <div className="bg-[var(--color-bg-secondary)] min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <RaidLogDetails id={params.id} />
      </div>
    </div>
  );
}
