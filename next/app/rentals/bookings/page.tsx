import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";
import { BookingsClient } from "./BookingsClient";

export const metadata = {
  title: "My Bookings | Surf Safari",
  description: "Manage your rental bookings",
};

export default async function BookingsPage() {
  const session = await getServerSession(authOptions);

  // Redirect if not logged in
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/rentals/bookings");
  }

  // Here you would fetch the user's bookings from your database
  // For now, we'll pass empty arrays to the client component

  return <BookingsClient userId={session.user.id} />;
}
