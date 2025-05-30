import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";
import { RentalItemForm } from "@/app/components/rentals/RentalItemForm";
import { SubscriptionStatus } from "@/app/types/subscription";

export const metadata = {
  title: "List a Rental Item | Surf Safari",
  description: "List your surfboard, motorbike, or scooter for rent",
};

export default async function NewRentalItemPage() {
  const session = await getServerSession(authOptions);

  // Redirect if not logged in
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/rentals/new");
  }

  // Check if user is subscribed
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionStatus: true, hasActiveTrial: true },
  });

  // Check for either an active subscription OR an active trial
  const isSubscribed =
    user?.subscriptionStatus === SubscriptionStatus.ACTIVE ||
    user?.hasActiveTrial === true;

  // Redirect if not subscribed
  if (!isSubscribed) {
    redirect("/pricing?callbackUrl=/rentals/new");
  }

  // Fetch beaches for the form
  const beaches = await prisma.beach.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="max-w-4xl mx-auto p-6 font-primary">
      <h1 className="text-3xl font-bold mb-6">List a Rental Item</h1>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <RentalItemForm beaches={beaches} />
      </div>
    </div>
  );
}
