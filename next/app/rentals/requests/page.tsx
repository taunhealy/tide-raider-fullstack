import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Rental Requests | Surf Safari",
  description: "Manage your rental requests",
};

export default async function RentalRequestsPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  try {
    const session = await getServerSession(authOptions);
    const requestType = searchParams.type || "all";

    // Redirect if not logged in
    if (!session?.user?.id) {
      redirect("/login?callbackUrl=/rentals/requests");
    }

    return (
      <div className="max-w-7xl mx-auto p-6 font-primary">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Rental Requests</h1>
          <Link href="/rentals" className="btn-tertiary px-4 py-2 rounded-md">
            Browse Rentals
          </Link>
        </div>

        <div className="mb-6">
          <div className="flex space-x-4 border-b">
            <Link
              href="/rentals/requests"
              className={`py-2 px-4 border-b-2 ${
                requestType === "all"
                  ? "border-[var(--color-tertiary)] font-medium"
                  : "border-transparent text-[var(--color-text-secondary)]"
              }`}
            >
              All Requests
            </Link>
            <Link
              href="/rentals/requests?type=renter"
              className={`py-2 px-4 border-b-2 ${
                requestType === "renter"
                  ? "border-[var(--color-tertiary)] font-medium"
                  : "border-transparent text-[var(--color-text-secondary)]"
              }`}
            >
              Items I'm Renting
            </Link>
            <Link
              href="/rentals/requests?type=owner"
              className={`py-2 px-4 border-b-2 ${
                requestType === "owner"
                  ? "border-[var(--color-tertiary)] font-medium"
                  : "border-transparent text-[var(--color-text-secondary)]"
              }`}
            >
              My Items Being Rented
            </Link>
          </div>
        </div>

        {/* Simplified content without database queries */}
        <div className="bg-[var(--color-bg-secondary)] p-8 rounded-md text-center">
          <p className="text-[var(--color-text-secondary)]">
            You don't have any rental requests
            {requestType !== "all" ? ` for this category` : ""} yet.
          </p>
          <Link
            href="/rentals"
            className="btn-tertiary inline-block mt-4 px-4 py-2 rounded-md"
          >
            Browse Rentals
          </Link>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in rental requests page:", error);
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-red-500">
          Error loading rental requests
        </h1>
        <p>
          There was a problem loading your requests. Please try again later.
        </p>
        <Link
          href="/rentals"
          className="mt-4 btn-tertiary inline-block px-4 py-2 rounded-md"
        >
          Back to Rentals
        </Link>
      </div>
    );
  }
}
