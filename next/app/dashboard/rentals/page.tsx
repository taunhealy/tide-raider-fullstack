import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";
import { RentalItemCard } from "@/app/components/rentals/RentalItemCard";
import { SubscriptionStatus } from "@/app/types/subscription";
import { calculateDailyPrice } from "@/app/lib/rentalUtility";
import { RentalItemType } from "@/app/types/rentals";

export const metadata = {
  title: "Manage Rentals | Dashboard",
  description: "Manage your rental listings",
};

export default async function ManageRentalsPage() {
  const session = await getServerSession(authOptions);

  // Redirect if not logged in
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/rentals");
  }

  // Check if user is subscribed
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { subscriptionStatus: true, hasActiveTrial: true },
  });

  const isSubscribed =
    user?.subscriptionStatus === SubscriptionStatus.ACTIVE ||
    user?.hasActiveTrial === true;

  // Redirect if not subscribed
  if (!isSubscribed) {
    redirect("/pricing?callbackUrl=/dashboard/rentals");
  }

  // Fetch user's rental items
  const rentalItems = await prisma.rentalItem.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
      availableBeaches: {
        include: {
          beach: {
            select: {
              id: true,
              name: true,
              region: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      rentalRequests: {
        where: {
          status: "PENDING",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch pending rental requests
  const pendingRequests = await prisma.rentalItemRequest.count({
    where: {
      ownerId: session.user.id,
      status: "PENDING",
    },
  });

  return (
    <div className="max-w-7xl mx-auto p-6 font-primary">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Your Rentals</h1>
        <Link href="/rentals/new" className="btn-primary">
          Add New Rental Item
        </Link>
      </div>

      {pendingRequests > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You have {pendingRequests} pending rental{" "}
                {pendingRequests === 1 ? "request" : "requests"}.
                <Link
                  href="/rentals/requests?type=owner&status=PENDING"
                  className="font-medium underline text-yellow-700 hover:text-yellow-600"
                >
                  {" "}
                  View requests
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {rentalItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rentalItems.map((item) => (
            <div key={item.id} className="relative">
              {item.rentalRequests.length > 0 && (
                <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {item.rentalRequests.length} new{" "}
                  {item.rentalRequests.length === 1 ? "request" : "requests"}
                </div>
              )}
              <Link href={`/dashboard/rentals/${item.id}`}>
                <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                  <RentalItemCard
                    item={{
                      ...item,
                      description: item.description || undefined,
                      availableBeaches: item.availableBeaches,
                      rentalRequests: undefined,
                      dailyPrice: calculateDailyPrice(item.itemType as any),
                      itemType: item.itemType as RentalItemType,
                    }}
                  />
                  <div className="p-4 bg-gray-50 border-t">
                    <div className="flex justify-between items-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="text-sm text-gray-500">Edit Item</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">No rental items yet</h2>
          <p className="text-gray-600 mb-6">
            Start listing your items for rent and earn extra income!
          </p>
          <Link href="/rentals/new" className="btn-primary">
            Add Your First Rental Item
          </Link>
        </div>
      )}
    </div>
  );
}
