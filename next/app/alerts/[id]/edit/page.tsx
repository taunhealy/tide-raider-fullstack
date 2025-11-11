import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/lib/authOptions";
import { AlertEditForm } from "./AlertEditForm";

export const dynamic = "force-dynamic";

async function getAlert(id: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/alerts/${id}?include=logEntry.forecast,logEntry.beach,region,properties,checks,notifications`,
      { next: { revalidate: 0 } }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch alert");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching alert:", error);
    return null;
  }
}

export default async function EditAlertPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const alert = await getAlert(id);

  // If alert not found, redirect to alerts page
  if (!alert) {
    redirect("/alerts");
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold font-primary text-[var(--color-primary)] mb-6">
        Edit Alert
      </h1>
      <AlertEditForm initialAlert={alert} />
    </div>
  );
}
