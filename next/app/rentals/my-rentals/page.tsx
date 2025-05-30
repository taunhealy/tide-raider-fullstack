import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";
import { redirect } from "next/navigation";
import MyRentalsClient from "./MyRentalsClient";

export const metadata: Metadata = {
  title: "My Rentals | Surf Safari",
  description: "Manage your rental listings",
};

export default async function MyRentalsPage() {
  const session = await getServerSession(authOptions);

  // Redirect if not logged in
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/rentals/my-rentals");
  }

  return <MyRentalsClient />;
}
